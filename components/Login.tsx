
import React, { useState } from 'react';
import { User } from '../types';
import { SocietyService } from '../db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.trim();
    if (cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit number.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const members = await SocietyService.getMembers();
      // Ensure strict string comparison on normalized inputs
      const user = members.find(m => String(m.mobileNumber).trim() === cleanMobile);
      
      if (user) {
        setTimeout(() => onLogin(user), 800);
      } else {
        setError("Mobile number not registered.");
        setLoading(false);
      }
    } catch (e) {
      setError("Database error. Please check your Supabase connection.");
      setLoading(false);
    }
  };

  const SQL_FIX = `
-- 1. ENABLE MOBILE LOGIN
ALTER TABLE members ADD COLUMN IF NOT EXISTS mobile_number TEXT UNIQUE;

-- 2. SEED TEST USERS
INSERT INTO members (id, name, mobile_number, role, total_contribution, current_loan_balance, joined_date)
VALUES 
('admin_1', 'Society Admin', '9999999999', 'ADMIN', 0, 0, CURRENT_DATE),
('test_m_1', 'Test Member', '8888888888', 'MEMBER', 5000, 0, CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET mobile_number = EXCLUDED.mobile_number;
  `.trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="bg-indigo-100 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c0 1.554-.312 3.034-.877 4.378m-3.21 2.503a5.5 5.5 0 115.196 5.196" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">SocietyPay</h2>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest text-[10px] font-black">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Registered Mobile</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black">+91</span>
              <input 
                type="tel" 
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                placeholder="0000000000"
                className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all text-lg font-black tracking-[0.2em] text-slate-800 placeholder:text-slate-200"
              />
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center mt-2 animate-in slide-in-from-top-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || mobile.length < 10}
            className="w-full bg-indigo-600 disabled:bg-slate-200 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-sm uppercase tracking-widest">Secure Sign In</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center flex flex-col items-center">
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] mb-4">Bank-Grade Privacy</p>
          <div className="space-y-2">
            <p className="text-[8px] font-bold text-slate-400">Use your registered mobile number to access your account.</p>
            <button 
              onClick={() => setShowSql(!showSql)}
              className="text-[8px] font-black text-slate-200 uppercase hover:text-slate-400 transition-colors"
            >
              {showSql ? "Hide System Config" : "System Config (SQL)"}
            </button>
          </div>
          
          {showSql && (
            <div className="mt-4 bg-slate-50 p-4 rounded-2xl w-full text-left animate-in slide-in-from-top-4">
               <pre className="text-[7px] font-mono text-indigo-400 overflow-x-auto whitespace-pre-wrap">{SQL_FIX}</pre>
               <button 
                onClick={() => {navigator.clipboard.writeText(SQL_FIX); alert("Copied!");}}
                className="w-full mt-2 bg-white border border-slate-100 py-2 rounded-xl text-[8px] font-black uppercase text-slate-400"
               >
                 Copy SQL Script
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
