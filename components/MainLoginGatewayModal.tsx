'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProjectFolder } from '@/lib/types';
import { 
  ADMIN_CONFIG, 
  getAdminOTPAuthURI, 
  verifyAdminLogin 
} from '@/lib/auth';
import { BrandLogo } from './BrandLogo';
import { 
  X, 
  ShieldCheck, 
  Phone, 
  Lock, 
  KeyRound, 
  FolderLock, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Key, 
  Copy, 
  Check, 
  QrCode,
  Eye, 
  EyeOff, 
  Headset, 
  BarChart3, 
  Sparkles, 
  Layers, 
  FileCheck, 
  Compass, 
  ArrowUpRight,
  FolderPlus,
  User,
  MapPin,
  FolderOpen,
  Plus
} from 'lucide-react';

interface MainLoginGatewayModalProps {
  isOpen: boolean;
  initialRole?: 'admin' | 'client';
  folders: ProjectFolder[];
  isLockedGateway?: boolean;
  onClose?: () => void;
  onAdminLoginSuccess: (mobile: string, name: string) => void;
  onClientLoginSuccess: (folder: ProjectFolder) => void;
  onCreateFolder?: (folderData: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'chatMessages'>) => Promise<ProjectFolder | void>;
  onExploreGuest?: () => void;
}

export const MainLoginGatewayModal: React.FC<MainLoginGatewayModalProps> = ({
  isOpen,
  initialRole = 'client',
  folders = [],
  isLockedGateway = false,
  onClose,
  onAdminLoginSuccess,
  onClientLoginSuccess,
  onCreateFolder,
  onExploreGuest
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'client'>(initialRole);
  const [clientSubTab, setClientSubTab] = useState<'signin' | 'create'>('signin');
  
  // Admin State
  const [adminMobile, setAdminMobile] = useState(ADMIN_CONFIG.mobile);
  const [adminTotp, setAdminTotp] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // TOTP QR Code Setup Flow States
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Client Sign In State
  const [clientMobile, setClientMobile] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [showClientPass, setShowClientPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [clientError, setClientError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Client Create New Vault State
  const [newClientName, setNewClientName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategory, setNewCategory] = useState('Residential 2D/3D');
  const [newLocation, setNewLocation] = useState('Keralassery, Palakkad');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  // Handle Admin Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const result = verifyAdminLogin(adminMobile, adminTotp);
    if (result.success) {
      onAdminLoginSuccess(adminMobile, ADMIN_CONFIG.adminName);
      if (onClose) onClose();
    } else {
      setAdminError(result.error || 'Invalid TOTP code. Please check your Authenticator app.');
    }
  };

  // Copy Base32 Secret Key
  const handleCopySecret = () => {
    navigator.clipboard.writeText(ADMIN_CONFIG.totpSecretBase32);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Handle Client Sign In
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    const trimmedMobile = clientMobile.trim();
    const targetFolder = folders.find(
      f => f.clientMobile.replace(/\D/g, '') === trimmedMobile.replace(/\D/g, '') &&
           f.customPassword === clientPassword.trim()
    );

    if (targetFolder) {
      onClientLoginSuccess(targetFolder);
      if (onClose) onClose();
    } else {
      setClientError('Invalid client mobile number or password. Please verify your credentials or create a new vault.');
    }
  };

  // Handle Create New Client Vault
  const handleCreateNewClientVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    const cleanMobile = newMobile.trim();
    if (!newFolderName.trim() || !newClientName.trim() || !cleanMobile || !newPassword.trim()) {
      setClientError('Please provide all required fields: Client Name, Project Name, Mobile (User ID), and Custom Password.');
      return;
    }

    const existing = folders.find(f => f.clientMobile.replace(/\D/g, '') === cleanMobile.replace(/\D/g, ''));
    if (existing) {
      setClientError(`A project vault already exists with mobile ${cleanMobile}. Please sign in to access it.`);
      return;
    }

    setIsCreating(true);
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

      onClientLoginSuccess(createdFolder);
      if (onClose) onClose();
    } catch (err: any) {
      setClientError(err?.message || 'Failed to create vault. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectClient = (f: ProjectFolder) => {
    setClientMobile(f.clientMobile);
    setClientPassword(f.customPassword);
    onClientLoginSuccess(f);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      
      {/* Background Architectural Subtle Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Main Split-Card Modal */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SIGN IN / REGISTER FORM */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white dark:bg-slate-900 overflow-y-auto">
          
          <div>
            {/* Top Brand Logo & Close Button Row */}
            <div className="flex items-center justify-between">
              <BrandLogo size="md" />
              {onClose && !isLockedGateway && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Close Gateway"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Headline Title */}
            <div className="mt-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {selectedRole === 'client' ? (clientSubTab === 'create' ? 'Create Client Vault' : 'Client Vault Sign in') : 'Chief Architect Portal'}
              </h1>
              
              {/* Role Toggle Switcher (Client vs Admin) */}
              <div className="mt-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/60 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('client');
                    setClientError('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedRole === 'client'
                      ? 'bg-[#0B3B7B] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FolderLock className="w-3.5 h-3.5" />
                  <span>Client Vault</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setAdminError('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedRole === 'admin'
                      ? 'bg-[#0B3B7B] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chief Architect (TOTP)</span>
                </button>
              </div>

              {/* Client Mode Sub-Tabs (Sign in vs Create New Vault) */}
              {selectedRole === 'client' && (
                <div className="mt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => { setClientSubTab('signin'); setClientError(''); }}
                    className={`text-xs font-bold pb-1 transition border-b-2 ${
                      clientSubTab === 'signin'
                        ? 'border-[#0B3B7B] text-[#0B3B7B] dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Existing Vault Login
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => { setClientSubTab('create'); setClientError(''); }}
                    className={`text-xs font-bold pb-1 transition border-b-2 flex items-center gap-1 ${
                      clientSubTab === 'create'
                        ? 'border-[#0B3B7B] text-[#0B3B7B] dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Plus className="w-3 h-3 text-emerald-500" />
                    <span>Create New Client Vault</span>
                  </button>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 1. CLIENT SIGN IN / CREATE FORM */}
            {/* ========================================================================= */}
            {selectedRole === 'client' ? (
              clientSubTab === 'signin' ? (
                <form onSubmit={handleClientSubmit} className="mt-4 space-y-4">
                  
                  {/* Mobile Number Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered Mobile Number (User ID)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={clientMobile}
                        onChange={(e) => setClientMobile(e.target.value)}
                        placeholder="e.g. 9847123456"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2] transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vault Custom Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showClientPass ? 'text' : 'password'}
                        value={clientPassword}
                        onChange={(e) => setClientPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2] transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowClientPass(!showClientPass)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Toggle password visibility"
                      >
                        {showClientPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0B3B7B] focus:ring-[#1D70E2] border-slate-300 dark:border-slate-600"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold text-[#1D70E2] dark:text-blue-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Error Message */}
                  {clientError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{clientError}</span>
                    </div>
                  )}

                  {/* Primary CTA Sign In Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-[#0B3B7B] hover:bg-[#082852] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-900/25 transition flex items-center justify-center gap-2"
                  >
                    <FolderLock className="w-4 h-4" />
                    <span>Sign in to Vault</span>
                  </button>

                  {/* Client Folder Quick Selector */}
                  {folders.length > 0 && (
                    <div className="pt-2">
                      <details className="text-xs group">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 select-none font-semibold flex items-center justify-between py-1">
                          <span>Select Existing Client Vault ({folders.length})</span>
                          <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-2 max-h-28 overflow-y-auto space-y-1.5 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          {folders.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleSelectClient(f)}
                              className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs flex items-center justify-between transition border border-slate-100 dark:border-slate-700"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                  {f.clientName}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate block">
                                  {f.folderName}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                {f.clientMobile}
                              </span>
                            </button>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </form>
              ) : (
                /* ========================================================================= */
                /* CREATE NEW CLIENT VAULT FORM */
                /* ========================================================================= */
                <form onSubmit={handleCreateNewClientVault} className="mt-4 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                          required
                        />
                      </div>
                    </div>

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
                          placeholder="e.g. Contemporary Villa"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        User ID (Mobile Number) *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          value={newMobile}
                          onChange={(e) => setNewMobile(e.target.value)}
                          placeholder="e.g. 9847123456"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                          required
                        />
                      </div>
                    </div>

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
                          placeholder="Set password"
                          className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
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
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Project Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Residential 2D/3D">Residential 2D/3D</option>
                        <option value="Modern Villa">Modern Villa</option>
                        <option value="Commercial Complex">Commercial Complex</option>
                        <option value="Traditional Kerala House">Traditional Kerala House</option>
                        <option value="Landscape & Courtyard">Landscape & Courtyard</option>
                      </select>
                    </div>

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
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {clientError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{clientError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-900/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>{isCreating ? 'Creating Vault...' : 'Create Vault & Sign In'}</span>
                  </button>
                </form>
              )
            ) : (
              /* ========================================================================= */
              /* 2. CHIEF ARCHITECT / ADMIN LOGIN FORM */
              /* ========================================================================= */
              <form onSubmit={handleAdminSubmit} className="mt-6 space-y-4">
                
                {/* Admin Registered Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Admin Registered Mobile
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={adminMobile}
                      onChange={(e) => setAdminMobile(e.target.value)}
                      placeholder="9747995961"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2] transition"
                      required
                    />
                  </div>
                </div>

                {/* 6-Digit TOTP Code Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      6-Digit TOTP Authenticator Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="text-xs font-semibold text-[#1D70E2] dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Setup 2FA / Scan QR</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={adminTotp}
                      onChange={(e) => setAdminTotp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code from Authenticator App"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2] transition"
                      required
                      autoComplete="one-time-code"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Open Google Authenticator or Microsoft Authenticator on your phone to get your live code.
                  </p>
                </div>

                {/* Error Message */}
                {adminError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                {/* Primary CTA Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0B3B7B] hover:bg-[#082852] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-900/25 transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify TOTP & Sign in</span>
                </button>
              </form>
            )}
          </div>

          {/* Bottom Row Helper */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            {onExploreGuest ? (
              <button
                type="button"
                onClick={onExploreGuest}
                className="text-slate-600 dark:text-slate-400 hover:text-[#0B3B7B] dark:hover:text-blue-400 font-semibold flex items-center gap-1.5 transition"
              >
                <span>Browse Public Portfolio & Services</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span>Vasthusilpy Architectural Portal</span>
            )}
            <span className="font-mono text-[11px]">Palakkad HQ</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: DEEP NAVY BLUE ARCHITECTURAL HERO */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B3B7B] via-[#0C3E84] to-[#07244C] text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

          {/* Top Row: Support Badge */}
          <div className="flex items-center justify-end relative z-10">
            <a
              href="tel:+919747995961"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/15 transition shadow-sm"
            >
              <Headset className="w-3.5 h-3.5 text-blue-300" />
              <span>Support</span>
            </a>
          </div>

          {/* Center Floating Glassmorphism Card */}
          <div className="my-6 relative z-10">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30 text-slate-900 dark:text-white relative overflow-hidden">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Vasthusilpy Digital Vault
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug max-w-[190px]">
                    256-bit encrypted architectural cloud storage for your private blueprints & 3D elevations.
                  </p>
                </div>

                <div className="relative w-28 h-20 rounded-xl bg-gradient-to-br from-[#0B3B7B] via-[#1D70E2] to-[#07244C] p-2 text-white shadow-lg flex flex-col justify-between border border-blue-400/30 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black tracking-widest text-blue-200">VASTHUSILPY</span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  </div>
                  <div className="text-[7px] font-mono text-blue-100/90">
                    7812 2139 •••• 5961
                  </div>
                  <div className="flex items-center justify-between text-[6px] text-blue-200">
                    <span>PALAKKAD</span>
                    <span>2026</span>
                  </div>
                </div>
              </div>

              {/* Floating Metric Badge Strip */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0B3B7B] dark:text-blue-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Vault Security</span>
                    <span className="block text-xs font-extrabold text-slate-900 dark:text-white">100% Vasthu Compliant</span>
                  </div>
                </div>

                <a
                  href="#services"
                  onClick={() => {
                    if (onExploreGuest) onExploreGuest();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#0B3B7B] hover:bg-[#082852] text-white text-xs font-bold transition shadow-sm"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copy */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Traditional Wisdom. Modern Architecture.
            </h2>
            <p className="text-xs text-blue-100/80 leading-relaxed font-light">
              Master Chief Architect Deepak C seamlessly integrates Vedic Vasthu Vidya with high-precision structural CAD engineering, municipal sanctions, and photorealistic 3D elevations.
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TOTP QR CODE SETUP MODAL */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              aria-label="Close QR Setup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#153e2d] dark:text-emerald-400">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Scan with Authenticator App
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, Authy, or Apple Passwords on your phone.
              </p>

              <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block mx-auto">
                <QRCodeSVG
                  value={getAdminOTPAuthURI()}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Manual Entry Secret Key:</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-[#153e2d] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                  {ADMIN_CONFIG.totpSecretBase32}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#0B3B7B] text-white font-bold text-xs transition"
              >
                Done, Return to Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FORGOT PASSWORD HELPER MODAL */}
      {/* ========================================================================= */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0B3B7B]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Client Password Assistance</h4>
                <p className="text-xs text-slate-500">Contact Chief Architect</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your customized client vault password is printed on your official <strong>Vasthusilpy Project Card</strong>. If you have forgotten or misplaced it, contact administration:
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Chief Architect Helpline:</div>
              <a href="tel:+919747995961" className="text-[#0B3B7B] dark:text-blue-400 font-mono font-bold block">
                +91 9747995961 / +91 9567627277
              </a>
              <div className="text-[11px] text-slate-500">Location: Keralassery, Palakkad, Kerala</div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B3B7B] text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
