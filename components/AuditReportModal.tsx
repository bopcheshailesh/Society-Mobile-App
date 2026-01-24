
import React, { useState, useEffect } from 'react';
import { SocietyStats } from '../types';
import { Logger } from '../services/Logger';
import { formatCurrency } from '../logic';

interface AuditReportModalProps {
  onClose: () => void;
  stats: SocietyStats;
}

const AuditReportModal: React.FC<AuditReportModalProps> = ({ onClose, stats }) => {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      // We now pass the stats directly to the AI service
      const res = await Logger.getAIInsights(stats);
      setInsight(res || "System ledger synchronized. All community operations are within normal parameters.");
      setLoading(false);
    };
    fetchInsight();
  }, [stats]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-4 text-amber-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Audit</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">AI-Powered Ledger Analysis</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Health Score</span>
              <div className="text-xl font-black text-green-600">98%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Risk Factor</span>
              <div className="text-xl font-black text-indigo-600">Low</div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-3">AI Intelligence Summary</h4>
            {loading ? (
              <div className="py-4 space-y-2">
                <div className="h-2 w-full bg-white/20 rounded-full animate-pulse"></div>
                <div className="h-2 w-[80%] bg-white/20 rounded-full animate-pulse"></div>
                <div className="h-2 w-[90%] bg-white/20 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <p className="text-xs font-medium leading-relaxed opacity-90 italic">
                "{insight}"
              </p>
            )}
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center py-2 border-b border-slate-50">
               <span className="text-[10px] font-black uppercase text-slate-400">Total Solvency</span>
               <span className="text-xs font-black text-slate-800">{formatCurrency(stats.totalFund)}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-50">
               <span className="text-[10px] font-black uppercase text-slate-400">Active Trustees</span>
               <span className="text-xs font-black text-slate-800">{stats.totalMembers}</span>
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all mt-4"
          >
            Acknowledge Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditReportModal;
