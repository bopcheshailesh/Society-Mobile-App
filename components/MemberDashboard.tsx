
import React, { useState, useMemo } from 'react';
import { User, SocietyStats, Transaction, LoanRequest, TransactionStatus } from '../types';
import { calculateInterest, formatCurrency, getCurrentMonthYear } from '../logic';
import PaymentModal from './PaymentModal';
import LoanRequestModal from './LoanRequestModal';
import AuditReportModal from './AuditReportModal';

interface MemberDashboardProps {
  user: User;
  stats: SocietyStats;
  members: User[];
  transactions: Transaction[]; 
  pendingRequests: LoanRequest[]; 
  onLoanRequest: (amount: number) => void;
  onPayment: (data: Partial<Transaction>) => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ 
  user, 
  stats, 
  members,
  transactions, 
  pendingRequests, 
  onLoanRequest, 
  onPayment 
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'activity' | 'transparency'>('personal');
  
  const interestDue = calculateInterest(user.currentLoanBalance);
  const { month, year } = getCurrentMonthYear();
  
  const myTransactions = transactions.filter(t => t.userId === user.id);
  const hasLoggedCurrent = myTransactions.some(t => t.month === month && t.year === year && t.status !== TransactionStatus.REJECTED);

  const activityFeed = useMemo(() => {
    const combined = [
      ...myTransactions.map(tx => ({ ...tx, type: 'PAYMENT' as const })),
      ...pendingRequests.map(req => ({ ...req, type: 'LOAN' as const }))
    ];
    return combined.sort((a, b) => {
      const dateA = 'date' in a ? a.date : a.requestedDate;
      const dateB = 'date' in b ? b.date : b.requestedDate;
      return dateB.localeCompare(dateA);
    });
  }, [myTransactions, pendingRequests]);

  const getStatusLabel = (item: any) => {
    if (item.status === TransactionStatus.PENDING) return 'PENDING';
    if (item.status === TransactionStatus.REJECTED) return 'REJECTED';
    if (item.status === TransactionStatus.APPROVED) {
      return item.type === 'PAYMENT' ? 'ACKNOWLEDGED' : 'APPROVED';
    }
    return item.status;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-0 z-20 backdrop-blur-md border border-white/50 shadow-sm overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('personal')} 
          className={`flex-1 py-3 px-4 whitespace-nowrap text-[9px] font-black uppercase rounded-xl transition-all ${activeTab === 'personal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 opacity-60'}`}
        >
          My Portfolio
        </button>
        <button 
          onClick={() => setActiveTab('activity')} 
          className={`flex-1 py-3 px-4 whitespace-nowrap text-[9px] font-black uppercase rounded-xl transition-all ${activeTab === 'activity' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 opacity-60'}`}
        >
          Activity
        </button>
        <button 
          onClick={() => setActiveTab('transparency')} 
          className={`flex-1 py-3 px-4 whitespace-nowrap text-[9px] font-black uppercase rounded-xl transition-all ${activeTab === 'transparency' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 opacity-60'}`}
        >
          Transparency
        </button>
      </div>

      {activeTab === 'personal' && (
        <div className="space-y-6">
          {!hasLoggedCurrent ? (
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <h3 className="text-xl font-black mb-1 tracking-tight">Period: {month} {year}</h3>
              <p className="text-slate-400 text-[10px] mb-8 font-black uppercase tracking-widest">Mandatory Contribution Log</p>
              <div className="flex items-end mb-10">
                <div className="text-5xl font-black text-white tracking-tighter">₹{(stats.monthlyContributionAmount + interestDue).toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 ml-3 mb-3 font-black uppercase tracking-tight">Base Due</div>
              </div>
              <button onClick={() => setShowPaymentModal(true)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-600/20 active:scale-[0.98] text-[11px] uppercase tracking-widest flex items-center justify-center">Log Bank Transfer <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
            </div>
          ) : (
            <div className="bg-white border border-green-100 rounded-[32px] p-8 flex flex-col items-center text-center shadow-sm">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-4 text-white shadow-xl shadow-green-100"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>
              <h3 className="font-black text-slate-800 uppercase text-[12px] tracking-widest leading-tight">Cycle Verified</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Your ledger record for {month} is safe</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]"><span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Outstand Loan</span><div className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(user.currentLoanBalance)}</div><div className="text-[8px] text-red-500 font-black bg-red-50 px-2.5 py-1 rounded-xl w-fit uppercase tracking-widest mt-2 border border-red-100/50">1% Rate Active</div></div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]"><span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Trust Savings</span><div className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(user.totalContribution)}</div><div className="text-[8px] text-green-500 font-black bg-green-50 px-2.5 py-1 rounded-xl w-fit uppercase tracking-widest mt-2 border border-green-100/50">Growth Fund</div></div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[32px] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Interest Contributed</span>
              <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-tight">Your impact on community pool</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-indigo-600 tracking-tighter">{formatCurrency(user.totalInterestPaid)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 px-1">
             <button onClick={() => setShowLoanModal(true)} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-start space-y-3 hover:bg-slate-50 active:scale-95 transition-all"><div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Apply for Loan</span></button>
             <button onClick={() => setShowAuditModal(true)} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-start space-y-3 hover:bg-slate-50 transition-all active:scale-95"><div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Audit Reports</span></button>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {activityFeed.length === 0 ? (
              <div className="py-32 text-center text-slate-200 font-black uppercase text-[10px] tracking-widest bg-white rounded-[32px] border border-slate-100 border-dashed">No entries found.</div>
            ) : (
              activityFeed.map((item, idx) => {
                const isLoan = item.type === 'LOAN';
                const statusColor = item.status === TransactionStatus.APPROVED ? 'text-green-600' : item.status === TransactionStatus.REJECTED ? 'text-red-500' : 'text-amber-500';
                const bgColor = item.status === TransactionStatus.APPROVED ? 'bg-green-50 border-green-100 text-green-600' : item.status === TransactionStatus.REJECTED ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600';

                return (
                  <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-4 shadow-sm border ${bgColor}`}>
                        {isLoan ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-800 leading-tight">
                          {isLoan ? `Loan Request` : `${(item as Transaction).month} ${(item as Transaction).year}`}
                        </div>
                        <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${statusColor}`}>{getStatusLabel(item)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{formatCurrency(isLoan ? (item as LoanRequest).amount : (item as Transaction).totalPaid)}</div>
                      <div className="text-[8px] font-black uppercase text-slate-300 tracking-widest mt-0.5">{isLoan ? (item as LoanRequest).requestedDate : (item as Transaction).date}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'transparency' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[28px] mb-2">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Trustee Registry</h4>
            <p className="text-[10px] text-indigo-400 font-medium leading-relaxed italic">Collective visibility into the group fund ensures complete integrity. All balances are verified against bank records.</p>
          </div>
          
          <div className="space-y-3">
            {members.map((m, idx) => (
              <div 
                key={m.id} 
                className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col animate-in slide-in-from-right-4 duration-500"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 mr-4">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 leading-none">
                        {m.name} {m.id === user.id && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg ml-1">YOU</span>}
                      </div>
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-2">
                        Trustee Member
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-green-600 leading-tight">{formatCurrency(m.totalContribution)}</div>
                    <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${m.currentLoanBalance > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                      Debt: {formatCurrency(m.currentLoanBalance)}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50/50 rounded-xl p-3 flex justify-between items-center border border-slate-50">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Growth Contribution (Interest)</span>
                   <span className="text-[10px] font-black text-indigo-500">{formatCurrency(m.totalInterestPaid)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} onSubmit={(data) => { onPayment(data); setShowPaymentModal(false); }} principal={user.currentLoanBalance} interest={interestDue} />}
      {showLoanModal && <LoanRequestModal onClose={() => setShowLoanModal(false)} onSubmit={(amount) => { onLoanRequest(amount); setShowLoanModal(false); }} availableBalance={stats.availableBalance} />}
      {showAuditModal && <AuditReportModal onClose={() => setShowAuditModal(false)} stats={stats} />}
    </div>
  );
};

export default MemberDashboard;
