
import React, { useState } from 'react';
import { SocietyStats, LoanRequest, Transaction, TransactionStatus, User, Role } from '../types';
import { formatCurrency, generateForecast } from '../logic';

interface AdminDashboardProps {
  stats: SocietyStats;
  requests: LoanRequest[];
  transactions: Transaction[];
  members: User[];
  onApproveLoan: (id: string) => void;
  onApprovePayment: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, requests, transactions, members, onApproveLoan, onApprovePayment }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'payments' | 'members'>('payments');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  const pendingLoans = requests.filter(r => r.status === TransactionStatus.PENDING);
  const pendingPayments = transactions.filter(t => t.status === TransactionStatus.PENDING);
  const forecasts = generateForecast(stats.availableBalance, stats.totalMembers, stats.totalLoaned);

  const getMemberTransactions = (userId: string) => {
    return transactions.filter(t => t.userId === userId);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Society Health Header */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Society Fund</h3>
            <div className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalFund)}</div>
          </div>
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 font-bold text-[10px] uppercase">
            {stats.totalMembers} Active Members
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
          <div>
            <div className="text-slate-400 text-[9px] uppercase font-bold mb-0.5">Available (Bank)</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(stats.availableBalance)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[9px] uppercase font-bold mb-0.5">Out on Loan</div>
            <div className="text-lg font-bold text-amber-600">{formatCurrency(stats.totalLoaned)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-0 z-20 backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'payments' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Verify Logs ({pendingPayments.length})
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'requests' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Loans ({pendingLoans.length})
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'members' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          All Members
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="px-1 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Audit Checklist</h4>
              <span className="text-[10px] text-slate-400 italic">Match with bank statement</span>
            </div>
            {pendingPayments.length === 0 ? (
              <EmptyState title="Bank matched! No pending logs." />
            ) : (
              pendingPayments.map(tx => (
                <div key={tx.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3 shadow-md">
                          {tx.userName.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 leading-tight">{tx.userName}</h5>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">{tx.month} {tx.year} Log</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-green-600 leading-none mb-1">{formatCurrency(tx.totalPaid)}</div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">Check Bank</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-3 grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-[8px] text-slate-400 uppercase font-black">Savings</div>
                        <div className="text-xs font-bold text-slate-600">{formatCurrency(tx.contribution)}</div>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <div className="text-[8px] text-slate-400 uppercase font-black">Interest</div>
                        <div className="text-xs font-bold text-slate-600">{formatCurrency(tx.interestPaid)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] text-slate-400 uppercase font-black">Principal</div>
                        <div className="text-xs font-bold text-slate-600">{formatCurrency(tx.principalRepayment)}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => onApprovePayment(tx.id)}
                      className="w-full bg-slate-900 text-white text-sm font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Funds Received
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingLoans.length === 0 ? (
              <EmptyState title="No active loan requests" />
            ) : (
              pendingLoans.map(req => (
                <div key={req.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-bold text-slate-800">{req.userName}</h5>
                      <p className="text-xs text-slate-400">Requested {req.requestedDate}</p>
                    </div>
                    <div className="text-xl font-black text-indigo-600">{formatCurrency(req.amount)}</div>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => onApproveLoan(req.id)}
                      className="flex-[2] bg-indigo-600 text-white text-sm font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                    >
                      Disburse Funds
                    </button>
                    <button className="flex-1 bg-slate-100 text-slate-500 text-sm font-bold py-4 rounded-2xl hover:bg-slate-200">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
               <div className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] grid grid-cols-3 px-6 py-4 border-b border-slate-100">
                 <div>Member</div>
                 <div className="text-right">Total Savings</div>
                 <div className="text-right">Loan Bal.</div>
               </div>
               <div className="divide-y divide-slate-100">
                 {members.map(member => (
                   <div key={member.id} className="transition-all">
                     <button 
                       onClick={() => setSelectedMemberId(selectedMemberId === member.id ? null : member.id)}
                       className={`w-full grid grid-cols-3 px-6 py-5 text-sm items-center hover:bg-slate-50 transition-colors ${selectedMemberId === member.id ? 'bg-indigo-50/30' : ''}`}
                     >
                       <div className="font-bold text-slate-800 text-left flex items-center">
                         <div className={`w-1.5 h-1.5 rounded-full mr-2 transition-all ${selectedMemberId === member.id ? 'bg-indigo-600 scale-125' : 'bg-transparent'}`}></div>
                         {member.name}
                       </div>
                       <div className="text-right text-slate-600 font-medium">{formatCurrency(member.totalContribution)}</div>
                       <div className={`text-right font-black ${member.currentLoanBalance > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                         {formatCurrency(member.currentLoanBalance)}
                       </div>
                     </button>
                     
                     {selectedMemberId === member.id && (
                       <div className="bg-indigo-50/10 px-6 py-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                         <div className="flex justify-between items-center mb-4">
                           <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Ledger</h6>
                           <span className="text-[9px] text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded-full uppercase">Verified Record</span>
                         </div>
                         
                         <div className="space-y-3">
                           {getMemberTransactions(member.id).length === 0 ? (
                             <div className="text-xs text-slate-400 py-6 text-center italic font-medium bg-white rounded-2xl border border-dashed border-slate-200">No transactions recorded yet.</div>
                           ) : (
                             getMemberTransactions(member.id).map(tx => (
                               <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                 <div className="flex justify-between items-center mb-3">
                                   <span className="text-sm font-bold text-slate-800">{tx.month} {tx.year}</span>
                                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${tx.status === TransactionStatus.APPROVED ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                     {tx.status}
                                   </span>
                                 </div>
                                 <div className="grid grid-cols-3 gap-3">
                                   <div>
                                     <div className="text-[8px] text-slate-400 uppercase font-black mb-1">Savings</div>
                                     <div className="text-xs font-bold text-slate-600">{formatCurrency(tx.contribution)}</div>
                                   </div>
                                   <div className="border-x border-slate-100 px-3">
                                     <div className="text-[8px] text-slate-400 uppercase font-black mb-1">Principal</div>
                                     <div className="text-xs font-bold text-slate-600">{formatCurrency(tx.principalRepayment)}</div>
                                   </div>
                                   <div className="pl-3">
                                     <div className="text-[8px] text-slate-400 uppercase font-black mb-1">Interest</div>
                                     <div className="text-xs font-bold text-slate-600">{formatCurrency(tx.interestPaid)}</div>
                                   </div>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{title: string}> = ({title}) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
    <div className="bg-slate-100 p-6 rounded-full mb-4">
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="font-bold text-sm uppercase tracking-wider">{title}</p>
  </div>
);

export default AdminDashboard;
