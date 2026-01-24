
import React, { useState, useEffect } from 'react';
import { User, Role, SocietyStats, LoanRequest, Transaction, TransactionStatus } from './types';
import { getCurrentMonthYear, formatCurrency } from './logic';
import { SocietyService } from './db';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { DB_CONFIG } from './config';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [societyStats, setSocietyStats] = useState<SocietyStats | null>(null);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    setLoading(true);
    setConnError(null);
    setNeedsBootstrap(false);
    
    try {
      const dbStatus = await SocietyService.init();
      
      if (!dbStatus.connected && !DB_CONFIG.IS_DEMO_MODE) {
        setConnError("Connection Failed: Ensure your Project URL and Anon Key in config.ts are correct and your internet is active.");
        setLoading(false);
        return;
      }

      if (!dbStatus.tablesExist && !DB_CONFIG.IS_DEMO_MODE) {
        setConnError("Database Tables Missing: Run the SQL DDL script in your Supabase dashboard.");
        setLoading(false);
        return;
      }

      if (dbStatus.isEmpty && !DB_CONFIG.IS_DEMO_MODE) {
        setNeedsBootstrap(true);
        setLoading(false);
        return;
      }

      const [stats, reqs, txs, membersData] = await Promise.all([
        SocietyService.getStats(),
        SocietyService.getLoanRequests(),
        SocietyService.getTransactions(),
        SocietyService.getMembers()
      ]);

      setSocietyStats(stats);
      setLoanRequests(reqs);
      setTransactions(txs);
      setMembers(membersData);

      const savedUser = localStorage.getItem('society_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const fresh = membersData.find(m => m.id === parsed.id);
        if (fresh) setCurrentUser(fresh);
      }
    } catch (e: any) {
      console.error(e);
      setConnError(`System Error: ${e.message || "Failed to communicate with Supabase."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async () => {
    setLoading(true);
    setConnError(null);
    try {
      await SocietyService.seedDatabase();
      // Wait a moment for Supabase replication then reload
      setTimeout(() => {
        loadAppData();
      }, 800);
    } catch (e: any) {
      setConnError(`Initialization Failed: ${e.message}. This usually means your 'INSERT' policies are missing or your SQL script didn't run correctly.`);
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('society_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('society_user');
  };

  const submitLoanRequest = async (amount: number) => {
    if (!currentUser) return;
    const newReq: LoanRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      status: TransactionStatus.PENDING,
      requestedDate: new Date().toISOString().split('T')[0]
    };
    const updated = await SocietyService.createLoanRequest(newReq);
    setLoanRequests(updated);
  };

  const handleTransaction = async (data: Partial<Transaction>) => {
    if (!currentUser) return;
    const { month, year } = getCurrentMonthYear();
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      month, year,
      contribution: data.contribution || 0,
      principalRepayment: data.principalRepayment || 0,
      interestPaid: data.interestPaid || 0,
      totalPaid: (data.contribution || 0) + (data.principalRepayment || 0) + (data.interestPaid || 0),
      status: TransactionStatus.PENDING,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = await SocietyService.recordTransaction(newTx);
    setTransactions(updated);
  };

  const approveLoan = async (id: string) => {
    const req = loanRequests.find(r => r.id === id);
    if (req && societyStats) {
      const currentMembers = await SocietyService.getMembers();
      const newStats = { ...societyStats, totalLoaned: societyStats.totalLoaned + req.amount, availableBalance: societyStats.availableBalance - req.amount };
      const updatedMembers = currentMembers.map(m => m.id === req.userId ? { ...m, currentLoanBalance: m.currentLoanBalance + req.amount } : m);
      await SocietyService.updateGlobalState(newStats, updatedMembers);
      setSocietyStats(newStats); setMembers(updatedMembers);
      setLoanRequests(prev => prev.map(r => r.id === id ? { ...r, status: TransactionStatus.APPROVED } : r));
    }
  };

  const approvePayment = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && societyStats) {
      const currentMembers = await SocietyService.getMembers();
      const newStats = { ...societyStats, totalFund: societyStats.totalFund + tx.totalPaid, availableBalance: societyStats.availableBalance + tx.totalPaid, totalLoaned: societyStats.totalLoaned - tx.principalRepayment };
      const updatedMembers = currentMembers.map(m => m.id === tx.userId ? { ...m, currentLoanBalance: Math.max(0, m.currentLoanBalance - tx.principalRepayment), totalContribution: m.totalContribution + tx.contribution } : m);
      await SocietyService.updateGlobalState(newStats, updatedMembers);
      setSocietyStats(newStats); setMembers(updatedMembers);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: TransactionStatus.APPROVED } : t));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-12 text-center">
      <div className="space-y-6">
        <div className="w-16 h-16 border-[6px] border-white/20 border-t-white rounded-full animate-spin mx-auto shadow-2xl"></div>
        <p className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-80 animate-pulse">Synchronizing Ledger</p>
      </div>
    </div>
  );

  if (needsBootstrap) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
      <div className="max-w-xs space-y-6">
        <div className="bg-indigo-50 text-indigo-500 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tables Ready!</h2>
        <p className="text-slate-400 text-xs font-bold leading-relaxed">The database structure is detected. Now click below to create the initial Society Admin profile and starting stats.</p>
        <button onClick={handleBootstrap} className="w-full bg-indigo-600 text-white font-black py-4 rounded-3xl shadow-xl shadow-indigo-100 uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Initialize Society</button>
        {connError && (
          <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-left">
             <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2">Error during Seeding:</p>
             <p className="text-red-700 text-[11px] font-bold leading-tight break-words">{connError}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (connError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
      <div className="max-w-xs space-y-6">
        <div className="bg-red-50 text-red-500 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-lg"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Blocked</h2>
        <p className="text-slate-400 text-xs font-bold leading-relaxed">{connError}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white font-black py-4 rounded-3xl shadow-xl shadow-indigo-100 uppercase text-[10px] tracking-widest">Retry Connection</button>
      </div>
    </div>
  );

  if (!currentUser) return <Login onLogin={handleLogin} />;
  if (!societyStats) return null;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto shadow-2xl relative overflow-hidden pb-24 border-x border-slate-100">
      <header className="bg-indigo-600 text-white p-6 pt-12 rounded-b-[40px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-white/90">SocietyPay</h1>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">{currentUser.name}</p>
          </div>
          <button onClick={handleLogout} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-6 flex justify-between items-center shadow-inner">
          <div><span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Bank Pool</span><div className="text-xl font-black">{formatCurrency(societyStats.availableBalance)}</div></div>
          <div className="text-right"><span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Community Debt</span><div className="text-xl font-black">{formatCurrency(societyStats.totalLoaned)}</div></div>
        </div>
      </header>
      <main className="p-4 mt-2">
        {currentUser.role === Role.ADMIN ? 
          <AdminDashboard stats={societyStats} requests={loanRequests} transactions={transactions} members={members} onApproveLoan={approveLoan} onApprovePayment={approvePayment} /> :
          <MemberDashboard user={currentUser} stats={societyStats} members={members} transactions={transactions} onLoanRequest={submitLoanRequest} onPayment={handleTransaction} pendingRequests={loanRequests.filter(r => r.userId === currentUser.id)} />
        }
      </main>
      <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] flex justify-around p-4 shadow-2xl z-50">
        <button className="flex flex-col items-center text-indigo-600"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg></button>
        <button className="flex flex-col items-center text-slate-300"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></button>
        <button className="flex flex-col items-center text-slate-300"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
      </nav>
    </div>
  );
};

export default App;
