
import React, { useState } from 'react';
import { User, SocietyStats, Transaction, LoanRequest, TransactionStatus } from '../types';
import { calculateInterest, formatCurrency, getCurrentMonthYear } from '../logic';
import PaymentModal from './PaymentModal';
import LoanRequestModal from './LoanRequestModal';

interface MemberDashboardProps {
  user: User;
  stats: SocietyStats;
  transactions: Transaction[]; // All society transactions for transparency
  members: User[]; // All society members
  pendingRequests: LoanRequest[];
  onLoanRequest: (amount: number) => void;
  onPayment: (data: Partial<Transaction>) => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ 
  user, 
  stats, 
  transactions, 
  members,
  pendingRequests, 
  onLoanRequest, 
  onPayment 
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'ledger' | 'activity'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  
  const interestDue = calculateInterest(user.currentLoanBalance);
  const { month, year } = getCurrentMonthYear();
  
  // Filter for personal view
  const myTransactions = transactions.filter(t => t.userId === user.id);
  const hasLoggedCurrent = myTransactions.some(t => t.month === month && t.year === year);

  // Filter for global ledger
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Transparency Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-0 z-20 backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'personal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          My Status
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'ledger' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Ledger
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'activity' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Activity Feed
        </button>
      </div>

      {activeTab === 'personal' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action Card */}
          {!hasLoggedCurrent ? (
            <div className="bg-slate-900 rounded-[32px] p-7 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
              </div>
              <h3 className="text-xl font-black mb-1">Time to Log {month}</h3>
              <p className="text-slate-400 text-xs mb-6 font-medium uppercase tracking-widest">Self-Declaration Required</p>
              
              <div className="flex items-end mb-8">
                <div className="text-4xl font-black text-indigo-400">₹{(stats.monthlyContributionAmount + interestDue).toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 ml-2 mb-2 font-bold uppercase tracking-tighter">Fixed + Interest</div>
              </div>
              
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center text-sm"
              >
                Start Payment Log
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-100 rounded-[32px] p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 text-white shadow-lg shadow-green-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-black text-green-800 uppercase text-sm tracking-widest">Payment Logged</h3>
              <p className="text-[10px] text-green-600/70 font-bold mt-1">Awaiting admin bank verification</p>
            </div>
          )}

          {/* User Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[120px]">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">My Loan Bal.</span>
              <div className="text-2xl font-black text-slate-800">{formatCurrency(user.currentLoanBalance)}</div>
              <div className="text-[9px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full w-fit">
                1% Monthly Int.
              </div>
            </div>
            <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[120px]">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">My Savings</span>
              <div className="text-2xl font-black text-slate-800">{formatCurrency(user.totalContribution)}</div>
              <div className="text-[9px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full w-fit">
                Total Contrib.
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-1">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Society Actions</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowLoanModal(true)}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-start space-y-3 hover:bg-slate-50 transition-all group"
              >
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-sm font-bold text-slate-700">Get Loan</span>
              </button>
              <button className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-start space-y-3 hover:bg-slate-50 transition-all group">
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="text-sm font-bold text-slate-700">Audit Trail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-4">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Find a member..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
             <div className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] grid grid-cols-3 px-6 py-4 border-b border-slate-100">
               <div>Member</div>
               <div className="text-right">Savings</div>
               <div className="text-right">Loan Bal.</div>
             </div>
             <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto no-scrollbar">
               {filteredMembers.map(member => (
                 <div key={member.id} className="grid grid-cols-3 px-6 py-5 text-sm items-center hover:bg-slate-50 transition-colors">
                   <div className="flex items-center text-left">
                     <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-black mr-3 uppercase border border-indigo-100 shadow-sm">
                        {member.name.charAt(0)}
                     </div>
                     <span className="font-bold text-slate-800 truncate">{member.name}</span>
                   </div>
                   <div className="text-right text-slate-600 font-medium">{formatCurrency(member.totalContribution)}</div>
                   <div className={`text-right font-black ${member.currentLoanBalance > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                     {formatCurrency(member.currentLoanBalance)}
                   </div>
                 </div>
               ))}
             </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center italic px-8 leading-relaxed">
            Community transparency ensures trust. You are seeing the actual confirmed bank ledger for all 20 members.
          </p>
        </div>
      )}

      {activeTab === 'activity' && (activeTab === 'activity') && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Public Log Feed</h4>
            <div className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400">Live</span>
            </div>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
            {transactions.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-medium italic bg-white rounded-[32px] border-2 border-dashed border-slate-100">No activity yet. Start the month by logging a payment!</div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-4 shadow-sm border ${tx.status === TransactionStatus.APPROVED ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {tx.status === TransactionStatus.APPROVED ? (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 leading-tight">
                        {tx.userName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {tx.month} {tx.year} Logged
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900 leading-none mb-1">{formatCurrency(tx.totalPaid)}</div>
                    <div className={`text-[9px] font-black uppercase tracking-widest ${tx.status === TransactionStatus.APPROVED ? 'text-green-500' : 'text-amber-500'}`}>
                      {tx.status === TransactionStatus.APPROVED ? 'Verified' : 'Pending Verification'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal 
          onClose={() => setShowPaymentModal(false)} 
          onSubmit={(data) => {
            onPayment(data);
            setShowPaymentModal(false);
          }}
          principal={user.currentLoanBalance}
          interest={interestDue}
        />
      )}

      {showLoanModal && (
        <LoanRequestModal 
          onClose={() => setShowLoanModal(false)} 
          onSubmit={(amount) => {
            onLoanRequest(amount);
            setShowLoanModal(false);
          }}
          availableBalance={stats.availableBalance}
        />
      )}
    </div>
  );
};

export default MemberDashboard;
