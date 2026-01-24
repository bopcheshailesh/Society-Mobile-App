
import React, { useState } from 'react';
import { User, Role } from '../types';

interface AddMemberModalProps {
  onClose: () => void;
  onAdd: (user: User) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [initialSavings, setInitialSavings] = useState('0');
  const [initialLoan, setInitialLoan] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || mobile.length < 10) return;

    const newUser: User = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      name,
      mobileNumber: mobile,
      role: Role.MEMBER,
      totalContribution: parseFloat(initialSavings) || 0,
      currentLoanBalance: parseFloat(initialLoan) || 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    onAdd(newUser);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Onboard Member</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Direct Bank-to-Ledger Import</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
              <input 
                type="tel" 
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Total Savings</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">₹</span>
                <input 
                  type="number" 
                  value={initialSavings}
                  onChange={(e) => setInitialSavings(e.target.value)}
                  className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-xs font-black text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Active Loan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">₹</span>
                <input 
                  type="number" 
                  value={initialLoan}
                  onChange={(e) => setInitialLoan(e.target.value)}
                  className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-xs font-black text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Cancel</button>
            <button type="submit" className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-widest active:scale-95 transition-all">Create Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
