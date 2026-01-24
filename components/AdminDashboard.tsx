
import React, { useState, useEffect } from 'react';
import { SocietyStats, LoanRequest, Transaction, TransactionStatus, User, Role } from '../types';
import { formatCurrency } from '../logic';
import { Logger, LogEntry } from '../services/Logger';
import { DB_CONFIG } from '../config';
import { SocietyService } from '../db';

interface AdminDashboardProps {
  stats: SocietyStats;
  requests: LoanRequest[];
  transactions: Transaction[];
  members: User[];
  onApproveLoan: (id: string) => void;
  onApprovePayment: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, requests, transactions, members, onApproveLoan, onApprovePayment }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'requests' | 'members' | 'history' | 'health'>('payments');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("Analyzing society trends...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const pendingLoans = requests.filter(r => r.status === TransactionStatus.PENDING);
  const pendingPayments = transactions.filter(t => t.status === TransactionStatus.PENDING);
  const confirmedTransactions = transactions.filter(t => t.status === TransactionStatus.APPROVED);

  useEffect(() => {
    if (activeTab === 'health' || activeTab === 'history') {
      setLogs(Logger.getRecentLogs());
      fetchInsight();
    }
  }, [activeTab]);

  const fetchInsight = async () => {
    setIsAnalyzing(true);
    const insight = await Logger.getAIInsights();
    setAiInsight(insight);
    setIsAnalyzing(false);
  };

  const calculatedFund = members.reduce((sum, m) => sum + m.totalContribution, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Summary Header */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Pool Value</h3>
            <div className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalFund)}</div>
          </div>
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 font-bold text-[10px] uppercase">
            {members.length} Total Members
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
          <div>
            <div className="text-slate-400 text-[9px] uppercase font-bold mb-0.5">Bank Balance</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(stats.availableBalance)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[9px] uppercase font-bold mb-0.5">Active Loans</div>
            <div className="text-lg font-bold text-amber-600">{formatCurrency(stats.totalLoaned)}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-2 z-30 backdrop-blur-md overflow-x-auto no-scrollbar">
        {['payments', 'requests', 'members', 'history', 'health'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-none px-4 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            {tab === 'payments' ? `Logs (${pendingPayments.length})` : 
             tab === 'requests' ? `Loans (${pendingLoans.length})` : 
             tab === 'members' ? 'People' : tab}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {pendingPayments.length === 0 ? <EmptyState title="All bank transfers verified!" /> : 
              pendingPayments.map(tx => (
                <div key={tx.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">{tx.userName.charAt(0)}</div>
                      <div>
                        <h5 className="font-bold text-slate-800 leading-tight">{tx.userName}</h5>
                        <p className="text-[10px] text-slate-400 uppercase font-medium">{tx.month} {tx.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-green-600 leading-none">{formatCurrency(tx.totalPaid)}</div>
                      <p className="text-[8px] text-slate-400 uppercase font-black mt-1">Contrib + Repay</p>
                    </div>
                  </div>
                  <button onClick={() => onApprovePayment(tx.id)} className="w-full bg-slate-900 text-white text-[10px] font-black uppercase py-4 rounded-2xl tracking-widest active:scale-[0.98] transition-transform">Match Bank Transfer</button>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 px-6 py-4 bg-slate-50 font-black text-[9px] text-slate-400 uppercase border-b">
              <span className="col-span-2">Member Profile</span>
              <span className="text-right">Total Cont.</span>
              <span className="text-right">Loan</span>
            </div>
            <div className="divide-y divide-slate-50">
              {members.map(m => (
                <div key={m.id} className="grid grid-cols-4 px-6 py-4 text-xs items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-2">
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Joined: {m.joinedDate}</div>
                  </div>
                  <span className="text-right font-black text-indigo-600">{formatCurrency(m.totalContribution)}</span>
                  <span className={`text-right font-black ${m.currentLoanBalance > 0 ? 'text-red-500' : 'text-slate-300'}`}>{formatCurrency(m.currentLoanBalance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verified Audit Trail</h4>
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto no-scrollbar">
                {confirmedTransactions.length === 0 ? <div className="p-10 text-center text-slate-300 text-xs italic">No historical records found.</div> : 
                  confirmedTransactions.map(tx => (
                    <div key={tx.id} className="px-6 py-4 flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{tx.userName}</span>
                        <span className="text-[10px] text-slate-400">{tx.month} {tx.year} • Confirmed</span>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">{formatCurrency(tx.totalPaid)}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Ref: {tx.id.toUpperCase()}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
               <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center mb-4 text-indigo-400">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                <h5 className="text-[10px] font-black uppercase tracking-widest">Financial Auditor AI</h5>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 italic">{isAnalyzing ? "Processing 3-year history cluster..." : aiInsight}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Ledger Integrity</span>
                <div className={`text-xs font-bold ${Math.abs(calculatedFund - stats.totalFund) < 1 ? 'text-green-600' : 'text-red-500'}`}>
                   {Math.abs(calculatedFund - stats.totalFund) < 1 ? 'Healthy Balance' : 'Mismatch Found'}
                </div>
                <p className="text-[8px] text-slate-400 mt-1 uppercase">Sum of Member Savings vs Stats</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">DB Status</span>
                <div className="text-xs font-bold text-green-600">Connected</div>
                <p className="text-[8px] text-slate-400 mt-1 uppercase">Supabase Realtime</p>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center font-black text-[10px] text-slate-400 uppercase tracking-widest">
                 <span>Debug Logs</span>
                 <div className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>Live</div>
               </div>
               <div className="max-h-[250px] overflow-y-auto no-scrollbar divide-y divide-slate-50">
                 {logs.map((log, i) => (
                   <div key={i} className="px-6 py-3 flex justify-between items-center text-[9px] font-mono">
                     <span className={`${log.level === 'ERROR' ? 'text-red-500' : 'text-slate-400'}`}>{log.level}</span>
                     <span className="text-slate-600 truncate max-w-[120px]">{log.message}</span>
                     <span className="text-slate-300">{log.duration?.toFixed(0)}ms</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
           <div className="space-y-4">
             {pendingLoans.length === 0 ? <EmptyState title="No active loan applications." /> : 
               pendingLoans.map(req => (
                 <div key={req.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-black text-slate-800 text-sm">{req.userName}</h5>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Loan Request • {req.requestedDate}</p>
                      </div>
                      <div className="text-lg font-black text-blue-600">{formatCurrency(req.amount)}</div>
                    </div>
                    <button onClick={() => onApproveLoan(req.id)} className="w-full bg-blue-600 text-white text-[10px] font-black uppercase py-4 rounded-2xl tracking-widest shadow-xl shadow-blue-50 active:scale-95 transition-all">Approve Disbursement</button>
                 </div>
               ))
             }
           </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{title: string}> = ({title}) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
    <div className="bg-slate-100 p-6 rounded-full mb-4">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
    </div>
    <p className="font-black text-[10px] uppercase tracking-widest text-center px-10 leading-loose">{title}</p>
  </div>
);

export default AdminDashboard;
