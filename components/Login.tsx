
import React from 'react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const users: User[] = [
    { id: 'm1', name: 'Amit Shah', role: Role.ADMIN, totalContribution: 24000, currentLoanBalance: 10000, joinedDate: '2022-01-01' },
    { id: 'm2', name: 'Rajesh Kumar', role: Role.MEMBER, totalContribution: 20000, currentLoanBalance: 0, joinedDate: '2022-03-15' },
    { id: 'm3', name: 'Priya Verma', role: Role.MEMBER, totalContribution: 18000, currentLoanBalance: 25000, joinedDate: '2022-04-10' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c0 1.554-.312 3.034-.877 4.378m-3.21 2.503a5.5 5.5 0 115.196 5.196" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Select your profile to enter</p>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-2xl transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  {user.name[0]}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.role}</div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest">A Closed Financial Society Product</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
