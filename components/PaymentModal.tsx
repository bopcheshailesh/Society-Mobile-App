
import React, { useState, useMemo } from 'react';
import { MONTHLY_CONTRIBUTION, formatCurrency } from '../logic';

interface PaymentModalProps {
  onClose: () => void;
  onSubmit: (data: { contribution: number; interestPaid: number; principalRepayment: number; totalPaid: number }) => void;
  principal: number;
  interest: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSubmit, principal, interest }) => {
  const [repaymentInput, setRepaymentInput] = useState<string>('0');
  
  const repayment = useMemo(() => {
    const val = parseFloat(repaymentInput) || 0;
    return Math.min(principal, Math.max(0, val));
  }, [repaymentInput, principal]);

  const total = MONTHLY_CONTRIBUTION + interest + repayment;

  const handleConfirm = () => {
    onSubmit({
      contribution: MONTHLY_CONTRIBUTION,
      interestPaid: interest,
      principalRepayment: repayment,
      totalPaid: total
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8"></div>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Log Monthly Payment</h2>
          <p className="text-slate-500 text-sm">Everything except principal is auto-calculated</p>
        </div>
        
        <div className="space-y-3 mb-8">
          {/* Fixed Contribution */}
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">1. Mandatory Savings</span>
              <div className="text-sm font-semibold text-slate-700">Monthly Contribution</div>
            </div>
            <span className="font-bold text-slate-800">{formatCurrency(MONTHLY_CONTRIBUTION)}</span>
          </div>
          
          {/* Interest */}
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">2. Loan Interest (1%)</span>
              <div className="text-[10px] text-slate-500 italic">On {formatCurrency(principal)} principal</div>
            </div>
            <span className="font-bold text-red-500">{formatCurrency(interest)}</span>
          </div>

          {/* Principal Input */}
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 ring-2 ring-indigo-200/50">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-indigo-900 uppercase">3. Principal Repayment</label>
              <span className="text-[10px] font-bold text-indigo-400">Balance: {formatCurrency(principal)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-600 text-lg">₹</span>
              <input 
                type="number"
                inputMode="decimal"
                value={repaymentInput}
                onChange={(e) => setRepaymentInput(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 rounded-xl border-none focus:ring-0 font-black text-xl text-slate-800 bg-white shadow-inner"
              />
            </div>
            <div className="flex space-x-2 mt-3">
              <button 
                onClick={() => setRepaymentInput('0')}
                className="px-3 py-1 bg-white text-[10px] font-bold text-indigo-600 rounded-lg border border-indigo-100 uppercase"
              >
                Zero
              </button>
              <button 
                onClick={() => setRepaymentInput((principal / 2).toString())}
                className="px-3 py-1 bg-white text-[10px] font-bold text-indigo-600 rounded-lg border border-indigo-100 uppercase"
              >
                Half
              </button>
              <button 
                onClick={() => setRepaymentInput(principal.toString())}
                className="px-3 py-1 bg-white text-[10px] font-bold text-indigo-600 rounded-lg border border-indigo-100 uppercase"
              >
                Full
              </button>
            </div>
          </div>
        </div>

        {/* Final Total */}
        <div className="bg-slate-900 rounded-2xl p-5 mb-8 flex justify-between items-center shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total to Transfer</span>
            <div className="text-xs text-white/60">Pay this exact amount to Bank</div>
          </div>
          <span className="text-2xl font-black text-green-400">{formatCurrency(total)}</span>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-bold text-slate-400 text-sm hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all text-sm"
          >
            Log Payment & Close
          </button>
        </div>
        
        <div className="mt-6 flex items-start bg-amber-50 p-3 rounded-xl border border-amber-100">
          <svg className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          <p className="text-[10px] text-amber-700 leading-tight">
            Note: This will log your transaction in the activity feed. Admin will verify once funds reflect in the society bank account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
