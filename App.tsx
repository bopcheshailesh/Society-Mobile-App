
import React, { useState, useEffect } from 'react';
import { User, Role, SocietyStats, LoanRequest, Transaction, TransactionStatus } from './types';
import { getCurrentMonthYear, formatCurrency } from './logic';
import { SocietyService } from './db';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ProfileOverlay from './components/ProfileOverlay';
import { DB_CONFIG } from './config';
import { Logger } from './services/Logger';
import { Storage } from './services/Storage';

const SESSION_TTL = 1440; // 24 Hours in minutes

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [societyStats, setSocietyStats] = useState<SocietyStats | null>(null);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    setLoading(true);
    try {
      const dbStatus = await SocietyService.init();
      
      if (!dbStatus.connected && !DB_CONFIG.IS_DEMO_MODE) {
        setConnError("Connection Failed. Check Supabase config.");
        return;
      }

      if (dbStatus.isEmpty && !DB_CONFIG.IS_DEMO_MODE) {
        setNeedsBootstrap(true);
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

      // Check for persisted session using the new Storage service
      const savedUser = Storage.get<User>('society_user');
      if (savedUser) {
        // Find the freshest data for this user from the DB list
        const fresh = membersData.find(m => m.id === savedUser.id);
        if (fresh) {
          setCurrentUser(fresh);
          // Re-up the session expiry on successful sync
          Storage.set('society_user', fresh, SESSION_TTL);
        } else {
          // User exists in cache but not in DB (possibly deleted)
          handleLogout();
        }
      }
    } catch (e: any) {
      setConnError(`System Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: { name: string, mobileNumber: string }) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await SocietyService.updateMemberProfile(currentUser.id, updates);
      
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      Storage.set('society_user', updatedUser, SESSION_TTL);
      
      const membersData = await SocietyService.getMembers();
      setMembers(membersData);
      
      Logger.log('INFO', `Profile updated for ${updates.name}`);
    } catch (e: any) {
      alert("Failed to update profile: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    Storage.set('society_user', user, SESSION_TTL);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    Storage.remove('society_user');
    setShowProfile(false);
  };

  const handleBootstrap = async () => {
    setLoading(true);
    try {
      await SocietyService.seedDatabase();
      await loadAppData();
    } catch (e: any) {
      alert(`Init Failed: ${e.message}`);
      setLoading(false);
    }
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
    await SocietyService.createLoanRequest(newReq);
    Logger.log('INFO', `${currentUser.name} requested loan of ${amount}`);
    await loadAppData();
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
    await SocietyService.recordTransaction(newTx);
    Logger.log('INFO', `${currentUser.name} logged payment for ${month}`);
    await loadAppData();
  };

  const approveLoan = async (id: string) => {
    const req = loanRequests.find(r => r.id === id);
    if (req && societyStats) {
      if (req.amount > societyStats.availableBalance) {
        alert("CRITICAL REJECTION: Requested amount exceeds society's available pool balance.");
        return;
      }
      setLoading(true);
      try {
        const currentMembers = await SocietyService.getMembers();
        const newStats = { 
          ...societyStats, 
          totalLoaned: societyStats.totalLoaned + req.amount, 
          availableBalance: societyStats.availableBalance - req.amount 
        };
        const updatedMembers = currentMembers.map(m => 
          m.id === req.userId ? { ...m, currentLoanBalance: m.currentLoanBalance + req.amount } : m
        );
        await SocietyService.updateGlobalState(newStats, updatedMembers);
        await SocietyService.updateLoanRequestStatus(id, TransactionStatus.APPROVED);
        Logger.log('INFO', `Loan of ${req.amount} approved for ${req.userName}`);
        await loadAppData();
      } catch (e) {
        alert("Error during disbursement persistence.");
      } finally {
        setLoading(false);
      }
    }
  };

  const rejectLoan = async (id: string) => {
    setLoading(true);
    try {
      await SocietyService.updateLoanRequestStatus(id, TransactionStatus.REJECTED);
      Logger.log('WARN', `Loan request ${id} rejected`);
      await loadAppData();
    } catch (e) {
      alert("Error rejecting loan.");
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && societyStats) {
      setLoading(true);
      try {
        const currentMembers = await SocietyService.getMembers();
        const newStats = { 
          ...societyStats, 
          totalFund: societyStats.totalFund + tx.totalPaid, 
          availableBalance: societyStats.availableBalance + tx.totalPaid, 
          totalLoaned: Math.max(0, societyStats.totalLoaned - tx.principalRepayment)
        };
        const updatedMembers = currentMembers.map(m => 
          m.id === tx.userId ? { 
            ...m, 
            currentLoanBalance: Math.max(0, m.currentLoanBalance - tx.principalRepayment), 
            totalContribution: m.totalContribution + tx.contribution 
          } : m
        );
        await SocietyService.updateGlobalState(newStats, updatedMembers);
        await SocietyService.updateTransactionStatus(id, TransactionStatus.APPROVED);
        Logger.log('INFO', `Payment of ${tx.totalPaid} verified for ${tx.userName}`);
        await loadAppData();
      } catch (e) {
        alert("Payment verification failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const rejectPayment = async (id: string) => {
    setLoading(true);
    try {
      await SocietyService.updateTransactionStatus(id, TransactionStatus.REJECTED);
      Logger.log('WARN', `Payment log ${id} rejected`);
      await loadAppData();
    } catch (e) {
      alert("Error rejecting payment log.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (user: User) => {
    setLoading(true);
    try {
      await SocietyService.createMember(user);
      Logger.log('INFO', `New trustee added: ${user.name}`);
      await loadAppData();
    } catch (e: any) {
      alert("Member creation failed: " + e.message);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-12 text-center">
      <div className="space-y-6">
        <div className="w-16 h-16 border-[6px] border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-80">Syncing Community Bank</p>
      </div>
    </div>
  );

  if (connError) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-10 text-center">
      <div className="max-w-xs space-y-4">
        <h2 className="text-xl font-black text-slate-800">Connection Failed</h2>
        <p className="text-xs text-slate-400 font-bold">{connError}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Retry</button>
      </div>
    </div>
  );

  if (needsBootstrap) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-10 text-center">
      <div className="max-w-xs space-y-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">System Uninitialized</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Seed UAT Database now.</p>
        <button onClick={handleBootstrap} className="w-full bg-indigo-600 text-white py-5 rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">Bootstrap System</button>
      </div>
    </div>
  );

  if (!currentUser) return <Login onLogin={handleLogin} />;
  if (!societyStats) return null;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto shadow-2xl relative overflow-hidden pb-24 border-x border-slate-100">
      <header className="bg-indigo-600 text-white p-6 pt-12 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-white/90">SocietyPay</h1>
            <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mt-2 opacity-80">{currentUser.name}</p>
          </div>
          <button onClick={() => setShowProfile(true)} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 border border-white/10 transition-all">
             <div className="w-5 h-5 rounded-full bg-indigo-300/30 flex items-center justify-center text-[10px] font-bold">
               {currentUser.name.charAt(0)}
             </div>
          </button>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-6 flex justify-between items-center border border-white/5 relative z-10">
          <div><span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Available Pool</span><div className="text-xl font-black tracking-tight">{formatCurrency(societyStats.availableBalance)}</div></div>
          <div className="text-right"><span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Debt Portfolio</span><div className="text-xl font-black tracking-tight">{formatCurrency(societyStats.totalLoaned)}</div></div>
        </div>
      </header>
      <main className="p-4 mt-2">
        {currentUser.role === Role.ADMIN ? 
          <AdminDashboard 
            stats={societyStats} 
            requests={loanRequests} 
            transactions={transactions} 
            members={members} 
            onApproveLoan={approveLoan} 
            onRejectLoan={rejectLoan}
            onApprovePayment={approvePayment} 
            onRejectPayment={rejectPayment}
            onAddMember={handleAddMember}
          /> :
          <MemberDashboard 
            user={currentUser} 
            stats={societyStats} 
            transactions={transactions} 
            members={members}
            onLoanRequest={submitLoanRequest} 
            onPayment={handleTransaction} 
            pendingRequests={loanRequests.filter(r => r.userId === currentUser.id)} 
          />
        }
      </main>
      <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[32px] flex justify-around p-4 shadow-2xl z-50">
        <button onClick={() => setShowProfile(false)} className={`transition-all active:scale-90 ${!showProfile ? 'text-indigo-600' : 'text-slate-300'}`}>
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
        </button>
        <button onClick={() => setShowProfile(true)} className={`transition-all active:scale-90 ${showProfile ? 'text-indigo-600' : 'text-slate-300'}`}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </button>
      </nav>

      {showProfile && (
        <ProfileOverlay 
          user={currentUser} 
          onClose={() => setShowProfile(false)} 
          onLogout={handleLogout} 
          onUpdateProfile={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default App;
