
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { SocietyService } from '../db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await SocietyService.getMembers();
      setMembers(data);
    } catch (e) {
      console.error("Failed to load profiles", e);
    } finally {
      setLoading(false);
    }
  };

  const SQL_FIX = `
-- COPY AND RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- 1. Create Tables
CREATE TABLE IF NOT EXISTS stats (id TEXT PRIMARY KEY DEFAULT 'global', total_members INTEGER, total_fund NUMERIC, total_loaned NUMERIC, available_balance NUMERIC, monthly_contribution_amount NUMERIC, interest_rate NUMERIC);
CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, name TEXT, role TEXT, total_contribution NUMERIC DEFAULT 0, current_loan_balance NUMERIC DEFAULT 0, joined_date DATE);
CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT, user_name TEXT, month TEXT, year INTEGER, contribution NUMERIC, principal_repayment NUMERIC, interest_paid NUMERIC, total_paid NUMERIC, status TEXT, date DATE);
CREATE TABLE IF NOT EXISTS loan_requests (id TEXT PRIMARY KEY, user_id TEXT, user_name TEXT, amount NUMERIC, status TEXT, requested_date DATE);

-- 2. Enable RLS
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Allow All" ON stats;
DROP POLICY IF EXISTS "Allow All" ON members;
DROP POLICY IF EXISTS "Allow All" ON transactions;
DROP POLICY IF EXISTS "Allow All" ON loan_requests;

-- 4. Create "Allow All" (Fixes INSERT/UPDATE errors)
CREATE POLICY "Allow All" ON stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON loan_requests FOR ALL USING (true) WITH CHECK (true);
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
          <p className="text-slate-400 text-sm font-medium mt-1">Select your secure profile</p>
        </div>

        <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
          {loading ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Ledger...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 space-y-6">
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <p className="text-sm text-amber-800 font-bold">Permissions Blocked</p>
                <p className="text-[10px] text-amber-600 mt-2 uppercase font-black leading-relaxed">The app cannot write to the database. You need to run a SQL fix in Supabase.</p>
              </div>
              
              {!showSql ? (
                <button 
                  onClick={() => setShowSql(true)}
                  className="w-full bg-slate-900 text-white text-[10px] font-black uppercase py-4 rounded-2xl tracking-widest"
                >
                  Get Fix-All SQL Script
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-slate-50 p-3 rounded-xl text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Run this in Supabase SQL Editor:</p>
                    <pre className="text-[8px] font-mono text-indigo-600 bg-white p-2 border border-slate-100 rounded-lg overflow-x-auto max-h-[150px]">{SQL_FIX}</pre>
                  </div>
                  <button 
                    onClick={() => {navigator.clipboard.writeText(SQL_FIX); alert("SQL Copied!")}}
                    className="w-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase py-2 rounded-xl"
                  >
                    Copy SQL
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-indigo-600 text-white text-[10px] font-black uppercase py-4 rounded-2xl shadow-xl shadow-indigo-100"
                  >
                    I Ran the SQL, Retry
                  </button>
                </div>
              )}
            </div>
          ) : (
            members.map((user) => (
              <button
                key={user.id}
                onClick={() => onLogin(user)}
                className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:scale-[1.02] border border-slate-100 rounded-3xl transition-all group active:scale-95"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg mr-4 shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
                    {user.name[0]}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800 text-base leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{user.role}</div>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100 text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">Bank-Grade Transparency</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
