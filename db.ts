
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { User, SocietyStats, LoanRequest, Transaction, TransactionStatus, Role } from './types';
import { MONTHLY_CONTRIBUTION } from './logic';
import { DB_CONFIG } from './config';
import { Logger } from './services/Logger';

const supabase = !DB_CONFIG.IS_DEMO_MODE 
  ? createClient(DB_CONFIG.SUPABASE_URL, DB_CONFIG.SUPABASE_ANON_KEY)
  : null;

export const INITIAL_SEED_DATA = {
  admin: { 
    id: 'admin_1', 
    name: 'Society Admin', 
    role: Role.ADMIN, 
    total_contribution: 0, 
    current_loan_balance: 0, 
    joined_date: new Date().toISOString().split('T')[0] 
  },
  stats: {
    id: 'global',
    total_members: 1,
    total_fund: 0,
    total_loaned: 0,
    available_balance: 0,
    monthly_contribution_amount: MONTHLY_CONTRIBUTION,
    interest_rate: 1,
  }
};

export const SocietyService = {
  init: async () => {
    const start = performance.now();
    if (DB_CONFIG.IS_DEMO_MODE) return { connected: true, tablesExist: true, isEmpty: false };

    try {
      // Check both tables - if either is empty/missing, we need bootstrap
      const [statsRes, membersRes] = await Promise.all([
        supabase!.from('stats').select('id').limit(1),
        supabase!.from('members').select('id').limit(1)
      ]);
      
      if (statsRes.error || membersRes.error) {
        const err = statsRes.error || membersRes.error;
        if (err?.code === 'PGRST116' || err?.message.includes('does not exist')) {
          return { connected: true, tablesExist: false, isEmpty: true };
        }
        return { connected: false, tablesExist: false, isEmpty: true };
      }

      const isEmpty = (!statsRes.data || statsRes.data.length === 0) || 
                      (!membersRes.data || membersRes.data.length === 0);
      
      return { connected: true, tablesExist: true, isEmpty };
    } catch (err: any) {
      return { connected: false, tablesExist: false, isEmpty: true };
    }
  },

  seedDatabase: async () => {
    if (DB_CONFIG.IS_DEMO_MODE) return true;
    
    // Using .upsert() instead of .insert() to handle cases where 
    // one table might have data but another is missing it.
    // This prevents the "duplicate key value violates unique constraint" error.
    
    // 1. Upsert stats
    const { error: sErr } = await supabase!
      .from('stats')
      .upsert([INITIAL_SEED_DATA.stats]);

    if (sErr) throw new Error(`Stats Table: ${sErr.message}`);

    // 2. Upsert admin member
    const { error: mErr } = await supabase!
      .from('members')
      .upsert([INITIAL_SEED_DATA.admin]);

    if (mErr) throw new Error(`Members Table: ${mErr.message}`);

    return true;
  },

  getStats: async (): Promise<SocietyStats> => {
    if (DB_CONFIG.IS_DEMO_MODE) return JSON.parse(localStorage.getItem('society_cache_stats') || '{}');
    const { data, error } = await supabase!.from('stats').select('*').eq('id', 'global').single();
    if (error) throw error;
    return {
      totalMembers: data.total_members,
      totalFund: data.total_fund,
      totalLoaned: data.total_loaned,
      availableBalance: data.available_balance,
      monthlyContributionAmount: data.monthly_contribution_amount,
      interestRate: data.interest_rate
    };
  },

  getMembers: async (): Promise<User[]> => {
    if (DB_CONFIG.IS_DEMO_MODE) return JSON.parse(localStorage.getItem('society_cache_members') || '[]');
    const { data, error } = await supabase!.from('members').select('*');
    if (error) throw error;
    return (data || []).map(m => ({
      id: m.id,
      name: m.name,
      role: m.role as Role,
      totalContribution: m.total_contribution,
      currentLoanBalance: m.current_loan_balance,
      joinedDate: m.joined_date
    }));
  },

  getTransactions: async (): Promise<Transaction[]> => {
    if (DB_CONFIG.IS_DEMO_MODE) return [];
    const { data } = await supabase!.from('transactions').select('*').order('date', { ascending: false });
    return (data || []).map(tx => ({
      ...tx, userId: tx.user_id, userName: tx.user_name, principalRepayment: tx.principal_repayment,
      interestPaid: tx.interest_paid, totalPaid: tx.total_paid
    }));
  },

  getLoanRequests: async (): Promise<LoanRequest[]> => {
    if (DB_CONFIG.IS_DEMO_MODE) return [];
    const { data } = await supabase!.from('loan_requests').select('*').order('requested_date', { ascending: false });
    return (data || []).map(r => ({ ...r, userId: r.user_id, userName: r.user_name, requestedDate: r.requested_date }));
  },
  
  createLoanRequest: async (request: LoanRequest) => {
    const payload = { id: request.id, user_id: request.userId, user_name: request.userName, amount: request.amount, status: request.status, requested_date: request.requestedDate };
    await supabase!.from('loan_requests').insert(payload);
    return SocietyService.getLoanRequests();
  },

  recordTransaction: async (tx: Transaction) => {
    const payload = { id: tx.id, user_id: tx.userId, user_name: tx.userName, month: tx.month, year: tx.year, contribution: tx.contribution, principal_repayment: tx.principalRepayment, interest_paid: tx.interestPaid, total_paid: tx.totalPaid, status: tx.status, date: tx.date };
    await supabase!.from('transactions').insert(payload);
    return SocietyService.getTransactions();
  },

  updateGlobalState: async (stats: SocietyStats, members: User[]) => {
    const statsPayload = { total_members: stats.totalMembers, total_fund: stats.totalFund, total_loaned: stats.totalLoaned, available_balance: stats.availableBalance, monthly_contribution_amount: stats.monthlyContributionAmount, interest_rate: stats.interestRate };
    await Promise.all([
      supabase!.from('stats').update(statsPayload).eq('id', 'global'),
      ...members.map(m => {
        const memberPayload = { name: m.name, role: m.role, total_contribution: m.totalContribution, current_loan_balance: m.currentLoanBalance };
        return supabase!.from('members').update(memberPayload).eq('id', m.id);
      })
    ]);
  }
};
