
import React, { useState } from 'react';
import { User, Role } from '../types';
import { formatCurrency } from '../logic';

interface ProfileOverlayProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdateProfile: (updates: { name: string, mobileNumber: string }) => Promise<void>;
}

const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ user, onClose, onLogout, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedMobile, setEditedMobile] = useState(user.mobileNumber);
  const [isSaving, setIsSaving] = useState(false);

  // Mock settings state
  const [settings, setSettings] = useState({
    biometrics: true,
    whatsappAlerts: true
  });

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateProfile({
      name: editedName,
      mobileNumber: editedMobile
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-xs bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
        <div className="p-8 pt-16">
          <div className="text-center mb-10 relative">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-0 right-0 p-2 bg-slate-50 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                )}
              </svg>
            </button>

            <div className="w-24 h-24 rounded-[40px] bg-indigo-600 text-white flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl shadow-indigo-200">
              {user.name.charAt(0)}
            </div>

            {isEditing ? (
              <div className="space-y-3 px-2">
                <input 
                  type="text" 
                  value={editedName} 
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full text-center font-black text-slate-900 bg-slate-50 border-none rounded-xl py-2 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Full Name"
                />
                <input 
                  type="tel" 
                  maxLength={10}
                  value={editedMobile} 
                  onChange={(e) => setEditedMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-xl py-2 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Mobile"
                />
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl mt-2 shadow-lg shadow-indigo-100 disabled:bg-slate-300"
                >
                  {isSaving ? 'Processing...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{user.name}</h2>
                <div className="mt-3 flex justify-center">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === Role.ADMIN ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {user.role} Trustee
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Summary</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Tenure</span>
                  <span className="text-xs font-black text-slate-900">Joined {user.joinedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Growth Share</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{formatCurrency(user.totalInterestPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Security</span>
                  <span className="text-xs font-black text-green-600 uppercase tracking-widest">Verified</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
               <div className="w-full bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest block">Biometric Security</span>
                    <span className="text-[8px] text-slate-400">Lock app with FaceID/TouchID</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({...s, biometrics: !s.biometrics}))}
                    className={`w-10 h-6 rounded-full transition-all relative ${settings.biometrics ? 'bg-green-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.biometrics ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>
               <div className="w-full bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest block">WhatsApp Alerts</span>
                    <span className="text-[8px] text-slate-400">Get instant receipt copies</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({...s, whatsappAlerts: !s.whatsappAlerts}))}
                    className={`w-10 h-6 rounded-full transition-all relative ${settings.whatsappAlerts ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.whatsappAlerts ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>
            </div>

            <div className="pt-10">
              <button 
                onClick={onLogout}
                className="w-full py-5 rounded-[28px] border-2 border-red-50 text-red-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all active:scale-95"
              >
                Terminate Session
              </button>
              <p className="text-[8px] text-center text-slate-300 font-bold uppercase mt-6 tracking-widest">SocietyPay v2.6.0 • Active Ledger</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverlay;
