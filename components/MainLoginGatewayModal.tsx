'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProjectFolder } from '@/lib/types';
import { 
  ADMIN_CONFIG, 
  getAdminOTPAuthURI, 
  verifyAdminLogin, 
  verifyClientLogin 
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
  ArrowUpRight
} from 'lucide-react';

interface MainLoginGatewayModalProps {
  isOpen: boolean;
  initialRole?: 'admin' | 'client';
  folders: ProjectFolder[];
  isLockedGateway?: boolean;
  onClose?: () => void;
  onAdminLoginSuccess: (mobile: string, name: string) => void;
  onClientLoginSuccess: (folder: ProjectFolder) => void;
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
  onExploreGuest
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'client'>(initialRole);
  
  // Admin State
  const [adminMobile, setAdminMobile] = useState(ADMIN_CONFIG.mobile);
  const [adminTotp, setAdminTotp] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // TOTP QR Code Setup Flow States
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Client State
  const [clientMobile, setClientMobile] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [showClientPass, setShowClientPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [clientError, setClientError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  // Handle Admin Submit (Strictly with TOTP Code)
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

  // Handle Client Submit (Mobile + Password)
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    const result = verifyClientLogin(clientMobile, clientPassword, folders);
    if (result.success && result.folder) {
      onClientLoginSuccess(result.folder);
      if (onClose) onClose();
    } else {
      setClientError(result.error || 'Invalid client mobile or password.');
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

      {/* Main Split-Card Modal (Reference Theme) */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SIGN IN FORM (WHITE / LIGHT THEME) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white dark:bg-slate-900">
          
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
                Sign in
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
                      ? 'bg-[#153e2d] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FolderLock className="w-3.5 h-3.5" />
                  <span>Client Vault Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setAdminError('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedRole === 'admin'
                      ? 'bg-[#153e2d] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chief Architect (TOTP)</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. CLIENT LOGIN FORM (MOBILE + PASSWORD) */}
            {/* ========================================================================= */}
            {selectedRole === 'client' ? (
              <form onSubmit={handleClientSubmit} className="mt-6 space-y-4">
                
                {/* Mobile Number Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={clientMobile}
                      onChange={(e) => setClientMobile(e.target.value)}
                      placeholder="e.g. 9847123456"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d] transition"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Vault Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showClientPass ? 'text' : 'password'}
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d] transition"
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
                      className="w-4 h-4 rounded text-[#153e2d] focus:ring-[#153e2d] border-slate-300 dark:border-slate-600"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-[#153e2d] dark:text-emerald-400 hover:underline"
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
                  className="w-full py-3.5 px-6 rounded-xl bg-[#153e2d] hover:bg-[#1a4a37] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-[#153e2d]/25 transition flex items-center justify-center gap-2"
                >
                  <FolderLock className="w-4 h-4" />
                  <span>Sign in</span>
                </button>

                {/* Client Folder Quick Selector (if folders exist) */}
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
              /* 2. CHIEF ARCHITECT / ADMIN LOGIN FORM (STRICT TOTP AUTHENTICATOR) */
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d] transition"
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
                      className="text-xs font-semibold text-[#153e2d] dark:text-emerald-400 hover:underline flex items-center gap-1"
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d] transition"
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
                  className="w-full py-3.5 px-6 rounded-xl bg-[#153e2d] hover:bg-[#1a4a37] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-[#153e2d]/25 transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify TOTP & Sign in</span>
                </button>
              </form>
            )}
          </div>

          {/* Bottom Row Helper (Explore Guest Mode) */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            {onExploreGuest ? (
              <button
                type="button"
                onClick={onExploreGuest}
                className="text-slate-600 dark:text-slate-400 hover:text-[#153e2d] dark:hover:text-emerald-400 font-semibold flex items-center gap-1.5 transition"
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
        {/* RIGHT COLUMN: DEEP FOREST GREEN ARCHITECTURAL HERO (REFERENCE THEME) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#153e2d] via-[#103324] to-[#0a2016] text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Organic Background Glow Circles (From reference design) */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-700/10 blur-3xl pointer-events-none" />

          {/* Top Row: Support Badge with Headset (From reference design) */}
          <div className="flex items-center justify-end relative z-10">
            <a
              href="tel:+919747995961"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/15 transition shadow-sm"
            >
              <Headset className="w-3.5 h-3.5 text-emerald-300" />
              <span>Support</span>
            </a>
          </div>

          {/* Center Floating Glassmorphism Card (From reference design) */}
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

                {/* Floating Architectural Card Graphic */}
                <div className="relative w-28 h-20 rounded-xl bg-gradient-to-br from-[#153e2d] via-[#1c533d] to-[#0a2016] p-2 text-white shadow-lg flex flex-col justify-between border border-emerald-400/30 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black tracking-widest text-emerald-300">VASTHUSILPY</span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  </div>
                  <div className="text-[7px] font-mono text-emerald-200/80">
                    7812 2139 •••• 5961
                  </div>
                  <div className="flex items-center justify-between text-[6px] text-emerald-100">
                    <span>PALAKKAD</span>
                    <span>2026</span>
                  </div>
                </div>
              </div>

              {/* Floating Metric Badge Strip (Like the Earnings Badge in ref) */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#153e2d] dark:text-emerald-400">
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
                  className="px-3.5 py-1.5 rounded-full bg-[#153e2d] hover:bg-[#1a4a37] text-white text-xs font-bold transition shadow-sm"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copy & Pagination Dots (From reference design) */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Traditional Wisdom. Modern Architecture.
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed font-light">
              Master Chief Architect Deepak C seamlessly integrates Vedic Vasthu Vidya with high-precision structural CAD engineering, municipal sanctions, and photorealistic 3D elevations.
            </p>
            
            {/* Carousel Indicator Dots */}
            <div className="flex items-center gap-1.5 pt-2">
              <span className="w-5 h-1.5 rounded-full bg-emerald-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TOTP QR CODE SETUP MODAL (DIRECT QR CODE FOR AUTHENTICATOR APPS) */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              aria-label="Close QR Setup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Direct Authenticator QR Code View */}
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

              {/* Live QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block mx-auto">
                <QRCodeSVG
                  value={getAdminOTPAuthURI()}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Secret Key in Text with Copy Button */}
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

              {/* Instructions */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 text-left space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <p>1. Open Authenticator on your mobile device.</p>
                <p>2. Tap &apos;+&apos; and choose &apos;Scan a QR code&apos;.</p>
                <p>3. Enter the generated 6-digit code on the login screen to sign in.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#153e2d] hover:bg-[#1a4a37] text-white font-bold text-xs transition"
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
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#153e2d]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Client Password Assistance</h4>
                <p className="text-xs text-slate-500">Contact Chief Architect</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your customized client vault password is printed on your official <strong>Vasthusilpy Project Card</strong>. If you have forgotten or misplaced it, contact the administration directly for instant reset:
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Chief Architect Helpline:</div>
              <a href="tel:+919747995961" className="text-[#153e2d] dark:text-emerald-400 font-mono font-bold block">
                +91 9747995961 / +91 9567627277
              </a>
              <div className="text-[11px] text-slate-500">Location: Keralassery, Palakkad, Kerala</div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full py-2.5 rounded-xl bg-[#153e2d] text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
