
import React, { useState, useEffect } from 'react';
import { User, Role, SocietyStats, LoanRequest, Transaction, TransactionStatus } from './types';
import { getCurrentMonthYear } from './logic';
import { SocietyService } from './db';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [societyStats, setSocietyStats] = useState<SocietyStats | null>(null);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Load from Service (Cache-First)
  useEffect(() => {
    const loadAppData = async () => {
      setLoading(true);
      await SocietyService.init();
      
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
        const parsedUser = JSON.parse(savedUser);
        const freshUser = membersData.find(m => m.id === parsedUser.id);
        if (freshUser) setCurrentUser(freshUser);
      }
      setLoading(false);
    };

    loadAppData();
  }, []);

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
    
    const updatedRequests = await SocietyService.createLoanRequest(newReq);
    setLoanRequests(updatedRequests);
  };

  const handleTransaction = async (data: Partial<Transaction>) => {
    if (!currentUser) return;
    const { month, year } = getCurrentMonthYear();
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      month,
      year,
      contribution: data.contribution || 0,
      principalRepayment: data.principalRepayment || 0,
      interestPaid: data.interestPaid || 0,
      totalPaid: (data.contribution || 0) + (data.principalRepayment || 0) + (data.interestPaid || 0),
      status: TransactionStatus.PENDING,
      date: new Date().toISOString().split('T')[0],
    };

    const updatedTxs = await SocietyService.recordTransaction(newTx);
    setTransactions(updatedTxs);
  };

  const approveLoan = async (id: string) => {
    const req = loanRequests.find(r => r.id === id);
    if (req && societyStats) {
      const currentMembers = await SocietyService.getMembers();
      
      // Calculate New State
      const newStats = {
        ...societyStats,
        totalLoaned: societyStats.totalLoaned + req.amount,
        availableBalance: societyStats.availableBalance - req.amount
      };

      const updatedMembers = currentMembers.map(m => 
        m.id === req.userId ? { ...m, currentLoanBalance: m.currentLoanBalance + req.amount } : m
      );

      // Update Service (Cache + DB)
      await SocietyService.updateGlobalState(newStats, updatedMembers);
      
      // Update local state UI
      setSocietyStats(newStats);
      setMembers(updatedMembers);
      setLoanRequests(prev => prev.map(r => r.id === id ? { ...r, status: TransactionStatus.APPROVED } : r));
      
      if (currentUser?.id === req.userId) {
        setCurrentUser(updatedMembers.find(m => m.id === req.userId) || null);
      }
    }
  };

  const approvePayment = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && societyStats) {
      const currentMembers = await SocietyService.getMembers();

      const newStats = {
        ...societyStats,
        totalFund: societyStats.totalFund + tx.totalPaid,
        availableBalance: societyStats.availableBalance + tx.totalPaid,
        totalLoaned: societyStats.totalLoaned - tx.principalRepayment
      };

      const updatedMembers = currentMembers.map(m => 
        m.id === tx.userId ? { 
          ...m, 
          currentLoanBalance: Math.max(0, m.currentLoanBalance - tx.principalRepayment),
          totalContribution: m.totalContribution + tx.contribution
        } : m
      );

      await SocietyService.updateGlobalState(newStats, updatedMembers);
      
      setSocietyStats(newStats);
      setMembers(updatedMembers);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: TransactionStatus.APPROVED } : t));
      
      if (currentUser?.id === tx.userId) {
        setCurrentUser(updatedMembers.find(m => m.id === tx.userId) || null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm font-medium">Securing Society Data...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={handleLogin} />;
  if (!societyStats) return null;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto shadow-xl relative overflow-hidden pb-24">
      <header className="bg-indigo-600 text-white p-6 pt-10 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">SocietyPay</h1>
            <p className="text-indigo-100 text-sm opacity-90">Welcome, {currentUser.name}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-indigo-500/30 p-2 rounded-full hover:bg-indigo-500/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider text-indigo-200">Society Fund</span>
            <div className="text-xl font-bold">₹{(societyStats.availableBalance).toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-indigo-200">Total Loaned</span>
            <div className="text-xl font-bold">₹{(societyStats.totalLoaned).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </header>

      <main className="p-4 mt-2">
        {currentUser.role === Role.ADMIN ? (
          /* FIX: Added the missing 'members' prop which is required by AdminDashboardProps */
          <AdminDashboard 
            stats={societyStats} 
            requests={loanRequests} 
            transactions={transactions}
            members={members}
            onApproveLoan={approveLoan}
            onApprovePayment={approvePayment}
          />
        ) : (
          <MemberDashboard 
            user={currentUser} 
            stats={societyStats}
            members={members}
            transactions={transactions}
            onLoanRequest={submitLoanRequest}
            onPayment={handleTransaction}
            pendingRequests={loanRequests.filter(r => r.userId === currentUser.id)}
          />
        )}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 pb-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center text-indigo-600">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="text-[10px] font-medium mt-1">Ledger</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
