
import React, { useState, useEffect, useMemo } from 'react';
import { SocietyStats, LoanRequest, Transaction, TransactionStatus, User, Role } from '../types';
import { formatCurrency } from '../logic';
import { Logger, LogEntry } from '../services/Logger';
import AddMemberModal from './AddMemberModal';

interface AdminDashboardProps {
  stats: SocietyStats;
  requests: LoanRequest[];
  transactions: Transaction[];
  members: User[];
  onApproveLoan: (id: string) => void;
  onRejectLoan: (id: string) => void;
  onApprovePayment: (id: string) => void;
  onRejectPayment: (id: string) => void;
  onAddMember: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  stats, 
  requests, 
  transactions, 
  members, 
  onApproveLoan, 
  onRejectLoan,
  onApprovePayment, 
  onRejectPayment,
  onAddMember 
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'requests' | 'members' | 'history' | 'health'>('payments');
  const [showAddModal, setShowAddModal] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const pendingLoans = requests.filter(r => r.status === TransactionStatus.PENDING);
  const pendingPayments = transactions.filter(t => t.status === TransactionStatus.PENDING);
  
  const historyEntries = useMemo(() => {
    const combined = [
      ...transactions.map(t => ({ ...t, historyType: 'PAYMENT' })),
      ...requests.map(r => ({ ...r, historyType: 'LOAN' }))
    ]
    .filter(item => item.status !== TransactionStatus.PENDING)
    .sort((a,b) => b.id.localeCompare(a.id));
    return combined;
  }, [transactions, requests]);

  useEffect(() => {
    setLogs(Logger.getRecentLogs());
  }, [activeTab]);

  // Helper to resolve the latest name from the member list
  const resolveCurrentName = (userId: string, fallbackName: string) => {
    const member = members.find(m => m.id === userId);
    return member ? member.name : fallbackName;
  };

  const getStatusLabel = (item: any) => {
    if (item.status === TransactionStatus.REJECTED) return 'REJECTED';
    if (item.status === TransactionStatus.APPROVED) {
      return item.historyType === 'PAYMENT' ? 'ACKNOWLEDGED' : 'APPROVED';
    }
    return item.status;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-2 z-30 backdrop-blur-md overflow-x-auto no-scrollbar border border-white/50 shadow-lg">
        {['payments', 'requests', 'members', 'history', 'health'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-none px-4 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 opacity-60'}`}
          >
            {tab === 'payments' ? `Transfers (${pendingPayments.length})` : 
             tab === 'requests' ? `Claims (${pendingLoans.length})` : 
             tab}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {pendingPayments.length === 0 ? <EmptyState title="All bank transfers verified." /> : 
              pendingPayments.map(tx => (
                <div key={tx.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-black text-slate-800 leading-tight">
                        {resolveCurrentName(tx.userId, tx.userName)}
                      </h5>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{tx.month} {tx.year}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-green-600">{formatCurrency(tx.totalPaid)}</div>
                      <p className="text-[8px] text-slate-400 uppercase font-black">Waiting Sync</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onRejectPayment(tx.id)} className="flex-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase py-4 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors">Reject</button>
                    <button onClick={() => onApprovePayment(tx.id)} className="flex-[2] bg-slate-900 text-white text-[9px] font-black uppercase py-4 rounded-2xl tracking-widest active:scale-[0.98]">Confirm Receipt</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'requests' && (
           <div className="space-y-4">
             {pendingLoans.length === 0 ? <EmptyState title="No active loan claims." /> : 
               pendingLoans.map(req => {
                 const isPoolInsufficient = req.amount > stats.availableBalance;
                 return (
                   <div key={req.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h5 className="font-black text-slate-800 text-sm tracking-tight">
                            {resolveCurrentName(req.userId, req.userName)}
                          </h5>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Loan Claim • {req.requestedDate}</p>
                        </div>
                        <div className="text-xl font-black text-blue-600">{formatCurrency(req.amount)}</div>
                      </div>
                      <div className="flex space-x-3">
                        <button onClick={() => onRejectLoan(req.id)} className="flex-1 bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase py-4 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors">Dismiss</button>
                        <button 
                          onClick={() => onApproveLoan(req.id)} 
                          disabled={isPoolInsufficient}
                          className="flex-[2] bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 text-white text-[9px] font-black uppercase py-4 rounded-2xl tracking-widest shadow-xl shadow-blue-50 active:scale-95 transition-all"
                        >
                          Disburse Funds
                        </button>
                      </div>
                   </div>
                 );
               })
             }
           </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trustee Directory</h4>
              <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-100 active:scale-95 transition-all">Add Trustee</button>
            </div>
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-50">
                {members.map(m => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                       <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 mr-3">{m.name.charAt(0)}</div>
                       <div>
                         <div className="font-black text-slate-800 text-sm">{m.name}</div>
                         <div className="text-[9px] text-slate-400 font-black uppercase tracking-tight">Growth Contribution: {formatCurrency(m.totalInterestPaid)}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-black text-green-600">{formatCurrency(m.totalContribution)}</div>
                       <div className={`text-[9px] font-black uppercase ${m.currentLoanBalance > 0 ? 'text-red-500' : 'text-slate-300'}`}>Loan: {formatCurrency(m.currentLoanBalance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verified Audit Trail</h4>
            <div className="space-y-3">
              {historyEntries.length === 0 ? <EmptyState title="No entries in finalized ledger." /> : 
                historyEntries.map((item: any) => (
                  <div key={item.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="font-black text-slate-800 text-xs">
                        {resolveCurrentName(item.userId, item.userName)}
                      </div>
                      <div className="text-[8px] font-black uppercase text-slate-400">{item.month || 'Disbursement'} {item.year || ''} • {item.date || item.requestedDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{formatCurrency(item.amount || item.totalPaid)}</div>
                      <div className={`text-[8px] font-black uppercase ${item.status === TransactionStatus.APPROVED ? 'text-green-500' : 'text-red-500'}`}>
                        {getStatusLabel(item)}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
             <div className="bg-slate-900 p-8 rounded-[32px] text-white">
                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2">Audit Sentinel</p>
                <p className="text-xs italic text-slate-300 opacity-80 leading-relaxed font-medium">The ledger is synchronized and consistent across all community nodes. Security protocols active.</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[28px] border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">DB Link</span><div className="text-xs font-black text-green-600 uppercase">Live & Secure</div></div>
                <div className="bg-white p-5 rounded-[28px] border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">System Events</span><div className="text-xs font-black text-indigo-600 uppercase">{logs.length} Operations</div></div>
             </div>
          </div>
        )}
      </div>

      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} onAdd={(u) => { onAddMember(u); setShowAddModal(false); }} />}
    </div>
  );
};

const EmptyState: React.FC<{title: string}> = ({title}) => (
  <div className="flex flex-col items-center justify-center py-24 text-slate-200">
    <div className="bg-slate-50 p-6 rounded-full mb-4 shadow-inner"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
    <p className="font-black text-[10px] uppercase tracking-widest">{title}</p>
  </div>
);

export default AdminDashboard;
