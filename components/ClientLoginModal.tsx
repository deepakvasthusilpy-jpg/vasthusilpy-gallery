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
  Key,
  ShieldCheck,
  FolderOpen,
  Plus,
  User,
  MapPin,
  Tag,
  CheckCircle2,
  FolderPlus
} from 'lucide-react';

interface ClientLoginModalProps {
  isOpen: boolean;
  folders: ProjectFolder[];
  onClose: () => void;
  onLoginSuccess: (folder: ProjectFolder) => void;
  onCreateFolder?: (folderData: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'chatMessages'>) => Promise<ProjectFolder | void>;
}

export const ClientLoginModal: React.FC<ClientLoginModalProps> = ({
  isOpen,
  folders,
  onClose,
  onLoginSuccess,
  onCreateFolder
}) => {
  const [activeMode, setActiveMode] = useState<'signin' | 'register'>('signin');
  
  // Sign In State
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  // Register New Client Folder State
  const [newClientName, setNewClientName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategory, setNewCategory] = useState('Residential 2D/3D');
  const [newLocation, setNewLocation] = useState('Keralassery, Palakkad');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isOpen) return null;

  // Handle Client Sign In
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = verifyClientLogin(mobile, password, folders);
    if (result.success && result.folder) {
      onLoginSuccess(result.folder);
      onClose();
    } else {
      setError(result.error || 'Invalid client mobile number or password.');
    }
  };

  // Handle Create New Client Folder & Login
  const handleRegisterFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = newMobile.trim();
    if (!newFolderName.trim() || !newClientName.trim() || !cleanMobile || !newPassword.trim()) {
      setError('Please fill in all required fields (Client Name, Folder Name, Mobile Number, and Password).');
      return;
    }

    // Check if mobile already exists in folders
    const existing = folders.find(f => f.clientMobile.replace(/\D/g, '') === cleanMobile.replace(/\D/g, ''));
    if (existing) {
      setError(`A project vault already exists for mobile ${cleanMobile}. Please sign in directly or use a different number.`);
      return;
    }

    setIsRegistering(true);

    try {
      const folderPayload: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'chatMessages'> = {
        folderName: newFolderName.trim(),
        clientName: newClientName.trim(),
        clientMobile: cleanMobile,
        customPassword: newPassword.trim(),
        projectCategory: newCategory,
        projectLocation: newLocation.trim(),
        files: []
      };

      let createdFolder: ProjectFolder;
      if (onCreateFolder) {
        const res = await onCreateFolder(folderPayload);
        if (res && res.id) {
          createdFolder = res;
        } else {
          createdFolder = {
            ...folderPayload,
            id: 'f_' + Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviews: [],
            chatMessages: []
          };
        }
      } else {
        createdFolder = {
          ...folderPayload,
          id: 'f_' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reviews: [],
          chatMessages: []
        };
      }

      onLoginSuccess(createdFolder);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create vault. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSelectDemoClient = (folder: ProjectFolder) => {
    setMobile(folder.clientMobile);
    setPassword(folder.customPassword);
    onLoginSuccess(folder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0B3B7B] to-[#07244C] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
              <FolderLock className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Client Project Vault</h2>
              <p className="text-xs text-blue-200/80">Vasthusilpy Architectural Cloud Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-4 sm:p-6 pb-0">
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => { setActiveMode('signin'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeMode === 'signin'
                  ? 'bg-[#0B3B7B] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              <span>Sign In to Vault</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('register'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeMode === 'register'
                  ? 'bg-[#0B3B7B] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create New Client Vault</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* ========================================================================= */}
          {/* 1. SIGN IN MODE */}
          {/* ========================================================================= */}
          {activeMode === 'signin' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  User ID (Registered Mobile Number)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9847123456"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vault Custom Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-[#1D70E2] dark:text-blue-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#0B3B7B] hover:bg-[#07244C] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <FolderLock className="w-4 h-4" />
                <span>Sign In to Vault</span>
              </button>

              {/* Quick Select Client Demo Folders */}
              {folders.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">Existing Client Vaults ({folders.length}):</span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectDemoClient(f)}
                        className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs flex items-center justify-between transition border border-slate-100 dark:border-slate-700"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{f.clientName}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{f.folderName}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">{f.clientMobile}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* ========================================================================= */
            /* 2. REGISTER / CREATE FOLDER MODE */
            /* ========================================================================= */
            <form onSubmit={handleRegisterFolder} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Client Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Client Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                      required
                    />
                  </div>
                </div>

                {/* Project / Folder Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project / Folder Name *
                  </label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g. Modern Villa Project"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* User ID: Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    User ID (Client Mobile) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      placeholder="e.g. 9847123456"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                      required
                    />
                  </div>
                </div>

                {/* Custom Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Set Custom Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Set client password"
                      className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Residential 2D/3D">Residential 2D/3D</option>
                    <option value="Modern Villa">Modern Villa</option>
                    <option value="Commercial Complex">Commercial Complex</option>
                    <option value="Traditional Kerala House">Traditional Kerala House</option>
                    <option value="Landscape & Courtyard">Landscape & Courtyard</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Keralassery, Palakkad"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRegistering ? 'Creating Vault...' : 'Create Vault & Sign In'}</span>
              </button>
            </form>
          )}

        </div>

        {/* Forgot Password Modal Helper */}
        {showForgot && (
          <div className="absolute inset-0 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between animate-in fade-in z-20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0B3B7B] dark:text-blue-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recover Vault Password</h3>
                  <p className="text-xs text-slate-400">Chief Architect Helpline</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your password is on your official <strong>Vasthusilpy Project Visiting Card</strong>. You can contact Chief Architect Deepak C for instant verification:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200">Vasthusilpy Office:</div>
                <div className="font-mono text-[#0B3B7B] dark:text-blue-400 font-bold">9567627277 / 9747995961</div>
                <div className="text-[11px] text-slate-400">Keralassery, Palakkad - 678641</div>
              </div>
            </div>

            <button
              onClick={() => setShowForgot(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B3B7B] text-white text-xs font-bold"
            >
              Back to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
