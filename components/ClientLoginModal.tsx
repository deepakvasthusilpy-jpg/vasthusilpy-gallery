'use client';

import React, { useState } from 'react';
import { ProjectFolder } from '@/lib/types';
import { verifyClientLogin, ADMIN_CONFIG } from '@/lib/auth';
import { 
  X, 
  Phone, 
  Lock, 
  FolderLock, 
  AlertCircle, 
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

interface ClientLoginModalProps {
  isOpen: boolean;
  folders: ProjectFolder[];
  onClose: () => void;
  onLoginSuccess: (folder: ProjectFolder) => void;
}

export const ClientLoginModal: React.FC<ClientLoginModalProps> = ({
  isOpen,
  folders,
  onClose,
  onLoginSuccess
}) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = verifyClientLogin(mobile, password, folders);
    if (result.success && result.folder) {
      onLoginSuccess(result.folder);
      onClose();
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const handleSelectDemoClient = (folder: ProjectFolder) => {
    setMobile(folder.clientMobile);
    setPassword(folder.customPassword);
    onLoginSuccess(folder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-5 bg-[#153e2d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <FolderLock className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Client Project Vault Login</h2>
              <p className="text-xs text-emerald-100/80">Access 3D designs, plans & permits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Mobile Number (User ID)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9847123456"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customized Vault Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[#153e2d] dark:text-emerald-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#153e2d] hover:bg-[#1a4a37] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <FolderLock className="w-4 h-4" />
              <span>Open Project Vault</span>
            </button>
          </form>

          {/* Quick client select if vaults exist */}
          {folders.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                Existing Client Vaults ({folders.length}):
              </label>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectDemoClient(f)}
                    className="w-full text-left p-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs flex items-center justify-between transition border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {f.clientName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {f.clientMobile}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forgot password dialog */}
      {showForgot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-xs w-full space-y-3">
            <div className="flex items-center gap-2 text-[#153e2d] dark:text-emerald-400">
              <Key className="w-4 h-4" />
              <h4 className="font-bold text-sm">Need Password Help?</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your password is on your Vasthusilpy visiting card. For assistance, contact Chief Architect:
            </p>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-[#153e2d] dark:text-emerald-400 text-center">
              +91 9747995961
            </div>
            <button
              onClick={() => setShowForgot(false)}
              className="w-full py-2 bg-[#153e2d] text-white text-xs font-bold rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
