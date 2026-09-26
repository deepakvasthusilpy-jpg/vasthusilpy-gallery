'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ADMIN_CONFIG, 
  getAdminOTPAuthURI, 
  verifyAdminLogin 
} from '@/lib/auth';
import { 
  X, 
  ShieldCheck, 
  Phone, 
  KeyRound, 
  Lock, 
  AlertCircle,
  Copy,
  Check,
  QrCode
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (mobile: string, name: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mobile, setMobile] = useState(ADMIN_CONFIG.mobile);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  
  // 2FA Setup QR states
  const [showQrSetup, setShowQrSetup] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = verifyAdminLogin(mobile, totpCode);
    if (result.success) {
      onLoginSuccess(mobile, ADMIN_CONFIG.adminName);
      onClose();
    } else {
      setError(result.error || 'Authentication failed. Please verify your 6-digit TOTP code.');
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(ADMIN_CONFIG.totpSecretBase32);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-5 bg-[#153e2d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chief Architect Admin Sign In</h2>
              <p className="text-xs text-emerald-100/80">Vasthusilpy Master 2FA Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!showQrSetup ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9747995961"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    6-Digit TOTP Authenticator Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQrSetup(true)}
                    className="text-xs font-semibold text-[#153e2d] dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR Code</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit TOTP code"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono tracking-widest text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153e2d]"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter the code from Google Authenticator or Microsoft Authenticator.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#153e2d] hover:bg-[#1a4a37] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify TOTP & Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            /* QR Setup view inside modal (Direct scan, no password) */
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  2FA Authenticator Setup
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQrSetup(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  Back to Sign In
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>:
              </p>

              <div className="p-3 bg-white rounded-2xl inline-block border border-slate-200 shadow-inner">
                <QRCodeSVG value={getAdminOTPAuthURI()} size={170} level="H" />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-left text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-slate-500 text-[10px] mb-1">
                  <span>Secret Key:</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-[#153e2d] dark:text-emerald-400 font-bold flex items-center gap-1"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {ADMIN_CONFIG.totpSecretBase32}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrSetup(false)}
                className="w-full py-2.5 rounded-xl bg-[#153e2d] text-white text-xs font-bold shadow transition"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
