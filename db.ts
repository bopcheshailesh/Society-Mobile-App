
import { User, SocietyStats, LoanRequest, Transaction, TransactionStatus, Role } from './types';
import { MONTHLY_CONTRIBUTION } from './logic';

/**
 * CACHE KEYS
 */
const CACHE_KEYS = {
  STATS: 'society_cache_stats',
  REQUESTS: 'society_cache_requests',
  TRANSACTIONS: 'society_cache_transactions',
  MEMBERS: 'society_cache_members',
  PENDING_SYNC: 'society_pending_sync'
};

/**
 * INITIAL MOCK DATA
 */
const INITIAL_MEMBERS: User[] = [
  { id: 'm1', name: 'Amit Shah', role: Role.ADMIN, totalContribution: 48000, currentLoanBalance: 0, joinedDate: '2022-01-01' },
  { id: 'm2', name: 'Rajesh Kumar', role: Role.MEMBER, totalContribution: 42000, currentLoanBalance: 15000, joinedDate: '2022-03-15' },
  { id: 'm3', name: 'Priya Verma', role: Role.MEMBER, totalContribution: 38000, currentLoanBalance: 45000, joinedDate: '2022-04-10' },
  { id: 'm4', name: 'Sanjay Gupta', role: Role.MEMBER, totalContribution: 36000, currentLoanBalance: 0, joinedDate: '2022-05-20' },
  { id: 'm5', name: 'Deepika Padukone', role: Role.MEMBER, totalContribution: 28000, currentLoanBalance: 12000, joinedDate: '2022-08-12' },
];

/**
 * SUPABASE MOCK CLIENT
 */
const mockSupabase = {
  from: (table: string) => ({
    select: (query: string = '*') => ({
      order: (col: string, { ascending }: any) => Promise.resolve({ data: JSON.parse(localStorage.getItem(`remote_${table}`) || '[]'), error: null }),
      single: () => Promise.resolve({ data: JSON.parse(localStorage.getItem(`remote_${table}`) || '{}'), error: null }),
    }),
    insert: (data: any) => {
      console.log(`[Supabase Remote] Inserting into ${table}`, data);
      if (Math.random() < 0.05) return Promise.reject("Network Error");
      const existing = JSON.parse(localStorage.getItem(`remote_${table}`) || '[]');
      localStorage.setItem(`remote_${table}`, JSON.stringify([data, ...existing]));
      return Promise.resolve({ error: null });
    },
    update: (data: any) => ({
      eq: (col: string, val: any) => {
        console.log(`[Supabase Remote] Updating ${table} where ${col}=${val}`, data);
        return Promise.resolve({ error: null });
      }
    })
  })
};

export const SocietyService = {
  init: async () => {
    if (!localStorage.getItem(CACHE_KEYS.STATS)) {
      const initialStats: SocietyStats = {
        totalMembers: 20,
        totalFund: 480000,
        totalLoaned: 120000,
        availableBalance: 360000,
        monthlyContributionAmount: MONTHLY_CONTRIBUTION,
        interestRate: 1,
      };
      localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(initialStats));
      localStorage.setItem('remote_stats', JSON.stringify(initialStats));
      localStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      localStorage.setItem('remote_members', JSON.stringify(INITIAL_MEMBERS));
    }
  },

  getStats: async (): Promise<SocietyStats> => {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.STATS) || '{}');
    try {
      const { data } = await mockSupabase.from('stats').select().single();
      if (data) localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(data));
    } catch (e) {}
    return cached;
  },

  getMembers: async (): Promise<User[]> => {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.MEMBERS) || '[]');
    return cached;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return JSON.parse(localStorage.getItem(CACHE_KEYS.TRANSACTIONS) || '[]');
  },

  getLoanRequests: async (): Promise<LoanRequest[]> => {
    return JSON.parse(localStorage.getItem(CACHE_KEYS.REQUESTS) || '[]');
  },
  
  createLoanRequest: async (request: LoanRequest) => {
    const requests = JSON.parse(localStorage.getItem(CACHE_KEYS.REQUESTS) || '[]');
    const newRequests = [request, ...requests];
    localStorage.setItem(CACHE_KEYS.REQUESTS, JSON.stringify(newRequests));
    try {
      await mockSupabase.from('loan_requests').insert(request);
    } catch (e) {}
    return newRequests;
  },

  recordTransaction: async (tx: Transaction) => {
    const txs = JSON.parse(localStorage.getItem(CACHE_KEYS.TRANSACTIONS) || '[]');
    const newTxs = [tx, ...txs];
    localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(newTxs));
    try {
      await mockSupabase.from('transactions').insert(tx);
    } catch (e) {}
    return newTxs;
  },

  updateGlobalState: async (stats: SocietyStats, members: User[]) => {
    localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(stats));
    localStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(members));
    try {
      await Promise.all([
        mockSupabase.from('stats').update(stats).eq('id', 'global'),
      ]);
    } catch (e) {}
  }
};
