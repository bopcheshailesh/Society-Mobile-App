
import React, { useState } from 'react';
import { formatCurrency, getMaxLoanAmount } from '../logic';

interface LoanRequestModalProps {
  onClose: () => void;
  onSubmit: (amount: number) => void;
  availableBalance: number;
}

const LoanRequestModal: React.FC<LoanRequestModalProps> = ({ onClose, onSubmit, availableBalance }) => {
  const [amount, setAmount] = useState<number>(0);
  const maxEligible = getMaxLoanAmount(availableBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Request Loan</h2>
          <p className="text-slate-500 text-sm mt-1">Funds are disbursed from the society pool</p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
              <span>Enter Amount</span>
              <span className="text-blue-600">Max: {formatCurrency(maxEligible)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xl">₹</span>
              <input 
                type="number"
                inputMode="decimal"
                autoFocus
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-2xl font-black text-slate-800"
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Monthly Interest (1%)</span>
              <span className="font-bold text-slate-700">{formatCurrency(amount * 0.01)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Approval Time</span>
              <span className="font-bold text-slate-700">~24 Hours</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-bold text-slate-400"
          >
            Cancel
          </button>
          <button 
            disabled={amount <= 0 || amount > maxEligible}
            onClick={() => onSubmit(amount)}
            className="flex-[2] bg-blue-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanRequestModal;
