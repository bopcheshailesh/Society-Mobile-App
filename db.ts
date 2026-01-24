
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
    mobile_number: '9999999999',
    role: Role.ADMIN, 
    total_contribution: 0, 
    current_loan_balance: 0, 
    joined_date: new Date().toISOString().split('T')[0] 
  },
  testMember: {
    id: 'test_m_1',
    name: 'Test Member',
    mobile_number: '8888888888',
    role: Role.MEMBER,
    total_contribution: 5000,
    current_loan_balance: 0,
    joined_date: new Date().toISOString().split('T')[0]
  },
  stats: {
    id: 'global',
    total_members: 2,
    total_fund: 5000,
    total_loaned: 0,
    available_balance: 5000,
    monthly_contribution_amount: MONTHLY_CONTRIBUTION,
    interest_rate: 1,
  }
};

export const SocietyService = {
  init: async () => {
    if (DB_CONFIG.IS_DEMO_MODE) return { connected: true, tablesExist: true, isEmpty: false };
    try {
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
    await supabase!.from('stats').upsert([INITIAL_SEED_DATA.stats]);
    await supabase!.from('members').upsert([INITIAL_SEED_DATA.admin, INITIAL_SEED_DATA.testMember]);
    return true;
  },

  getStats: async (): Promise<SocietyStats> => {
    if (DB_CONFIG.IS_DEMO_MODE) return JSON.parse(localStorage.getItem('society_cache_stats') || '{}');
    const { data, error } = await supabase!.from('stats').select('*').eq('id', 'global').single();
    if (error) throw error;
    return {
      totalMembers: Number(data.total_members) || 0,
      totalFund: Number(data.total_fund) || 0,
      totalLoaned: Number(data.total_loaned) || 0,
      availableBalance: Number(data.available_balance) || 0,
      monthlyContributionAmount: Number(data.monthly_contribution_amount) || 0,
      interestRate: Number(data.interest_rate) || 0
    };
  },

  getMembers: async (): Promise<User[]> => {
    if (DB_CONFIG.IS_DEMO_MODE) return JSON.parse(localStorage.getItem('society_cache_members') || '[]');
    const { data, error } = await supabase!.from('members').select('*').order('name');
    if (error) throw error;
    return (data || []).map(m => ({
      id: String(m.id),
      name: String(m.name),
      // CRITICAL: Cast to string to ensure strict equality comparison in Login.tsx works
      mobileNumber: String(m.mobile_number || ''),
      role: m.role as Role,
      totalContribution: Number(m.total_contribution) || 0,
      currentLoanBalance: Number(m.current_loan_balance) || 0,
      joinedDate: String(m.joined_date || '')
    }));
  },

  updateMemberProfile: async (userId: string, updates: { name: string, mobileNumber: string }) => {
    if (DB_CONFIG.IS_DEMO_MODE) return;
    const { error } = await supabase!
      .from('members')
      .update({ name: updates.name, mobile_number: updates.mobileNumber })
      .eq('id', userId);
    if (error) throw error;
  },

  createMember: async (user: User) => {
    if (DB_CONFIG.IS_DEMO_MODE) return;
    const payload = {
      id: user.id,
      name: user.name,
      mobile_number: user.mobileNumber,
      role: user.role,
      total_contribution: user.totalContribution,
      current_loan_balance: user.currentLoanBalance,
      joined_date: user.joinedDate
    };
    const { error } = await supabase!.from('members').insert([payload]);
    if (error) throw error;
    
    const stats = await SocietyService.getStats();
    await supabase!.from('stats').update({ 
      total_members: stats.totalMembers + 1,
      total_fund: stats.totalFund + user.totalContribution,
      available_balance: stats.availableBalance + user.totalContribution,
      total_loaned: stats.totalLoaned + user.currentLoanBalance
    }).eq('id', 'global');
  },

  getTransactions: async (): Promise<Transaction[]> => {
    if (DB_CONFIG.IS_DEMO_MODE) return [];
    const { data } = await supabase!.from('transactions').select('*').order('date', { ascending: false });
    return (data || []).map(tx => ({
      id: tx.id,
      userId: tx.user_id,
      userName: tx.user_name,
      month: tx.month,
      year: tx.year,
      contribution: Number(tx.contribution),
      principalRepayment: Number(tx.principal_repayment),
      interestPaid: Number(tx.interest_paid),
      totalPaid: Number(tx.total_paid),
      status: tx.status as TransactionStatus,
      date: tx.date
    }));
  },

  getLoanRequests: async (): Promise<LoanRequest[]> => {
    if (DB_CONFIG.IS_DEMO_MODE) return [];
    const { data } = await supabase!.from('loan_requests').select('*').order('requested_date', { ascending: false });
    return (data || []).map(r => ({ 
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      amount: Number(r.amount),
      status: r.status as TransactionStatus,
      requestedDate: r.requested_date 
    }));
  },
  
  createLoanRequest: async (request: LoanRequest) => {
    if (DB_CONFIG.IS_DEMO_MODE) return [];
    const payload = { id: request.id, user_id: request.userId, user_name: request.userName, amount: request.amount, status: request.status, requested_date: request.requestedDate };
    await supabase!.from('loan_requests').insert(payload);
    return SocietyService.getLoanRequests();
  },

  updateLoanRequestStatus: async (id: string, status: TransactionStatus) => {
    if (DB_CONFIG.IS_DEMO_MODE) return;
    await supabase!.from('loan_requests').update({ status }).eq('id', id);
  },

  recordTransaction: async (tx: Transaction) => {
    if (DB_CONFIG.IS_DEMO_MODE) return [];
    const payload = { 
      id: tx.id, 
      user_id: tx.userId, 
      user_name: tx.userName, 
      month: tx.month, 
      year: tx.year, 
      contribution: tx.contribution, 
      principal_repayment: tx.principalRepayment, 
      interest_paid: tx.interestPaid, 
      total_paid: tx.totalPaid, 
      status: tx.status, 
      date: tx.date 
    };
    await supabase!.from('transactions').insert(payload);
    return SocietyService.getTransactions();
  },

  updateTransactionStatus: async (id: string, status: TransactionStatus) => {
    if (DB_CONFIG.IS_DEMO_MODE) return;
    await supabase!.from('transactions').update({ status }).eq('id', id);
  },

  updateGlobalState: async (stats: SocietyStats, members: User[]) => {
    if (DB_CONFIG.IS_DEMO_MODE) return;
    const statsPayload = { 
      total_members: stats.totalMembers, 
      total_fund: stats.totalFund, 
      total_loaned: stats.totalLoaned, 
      available_balance: stats.availableBalance, 
      monthly_contribution_amount: stats.monthlyContributionAmount, 
      interest_rate: stats.interestRate 
    };
    await Promise.all([
      supabase!.from('stats').update(statsPayload).eq('id', 'global'),
      ...members.map(m => {
        const memberPayload = { 
          name: m.name, 
          role: m.role, 
          total_contribution: m.totalContribution, 
          current_loan_balance: m.currentLoanBalance 
        };
        return supabase!.from('members').update(memberPayload).eq('id', m.id);
      })
    ]);
  }
};
