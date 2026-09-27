'use client';

import React, { useState } from 'react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { AuthSession } from '@/lib/storage';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Eye, 
  Download, 
  Share2, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Search, 
  MapPin, 
  User, 
  Key, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  X,
  CreditCard,
  Building2,
  Compass,
  Film
} from 'lucide-react';

interface HomePublicPortfolioProps {
  folders: ProjectFolder[];
  session: AuthSession | null;
  isAdmin: boolean;
  onPreviewFile: (file: ProjectFile, folder?: ProjectFolder) => void;
  onOpenVisitingCard: (folder: ProjectFolder) => void;
  onShareWhatsApp: (folder: ProjectFolder) => void;
  onClientAuthenticated?: (folder: ProjectFolder) => void;
}

export const HomePublicPortfolio: React.FC<HomePublicPortfolioProps> = ({
  folders,
  session,
  isAdmin,
  onPreviewFile,
  onOpenVisitingCard,
  onShareWhatsApp,
  onClientAuthenticated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Auth Modal State for Protected Download / Share
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    folder: ProjectFolder | null;
    file: ProjectFile | null;
    action: 'download' | 'share';
  }>({
    isOpen: false,
    folder: null,
    file: null,
    action: 'download'
  });

  const [inputMobile, setInputMobile] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Filter Folders
  const filteredFolders = folders.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      f.folderName.toLowerCase().includes(q) || 
      f.clientName.toLowerCase().includes(q) || 
      f.clientMobile.includes(q) ||
      (f.projectLocation && f.projectLocation.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'All' || f.projectCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Check if current user is authorized for a given folder
  const isUserAuthorizedForFolder = (folder: ProjectFolder): boolean => {
    if (isAdmin) return true;
    if (session?.role === 'client' && session.mobile === folder.clientMobile) return true;
    return false;
  };

  // Handle Download Click
  const handleDownloadClick = (folder: ProjectFolder, file: ProjectFile) => {
    if (isUserAuthorizedForFolder(folder)) {
      // Direct Download
      const a = document.createElement('a');
      a.href = file.fileUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Require User ID & Password
      setAuthModalState({
        isOpen: true,
        folder,
        file,
        action: 'download'
      });
      setInputMobile(folder.clientMobile);
      setInputPassword('');
      setAuthError('');
      setAuthSuccessMsg('');
    }
  };

  // Handle Share Click
  const handleShareClick = (folder: ProjectFolder, file?: ProjectFile) => {
    if (isUserAuthorizedForFolder(folder)) {
      onShareWhatsApp(folder);
    } else {
      setAuthModalState({
        isOpen: true,
        folder,
        file: file || null,
        action: 'share'
      });
      setInputMobile(folder.clientMobile);
      setInputPassword('');
      setAuthError('');
      setAuthSuccessMsg('');
    }
  };

  // Handle Auth Verification Submission
  const handleVerifyAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const { folder, file, action } = authModalState;
    if (!folder) return;

    const trimmedMobile = inputMobile.replace(/\D/g, '');
    const folderMobile = folder.clientMobile.replace(/\D/g, '');

    if (trimmedMobile === folderMobile && inputPassword.trim() === folder.customPassword.trim()) {
      setAuthSuccessMsg('Credentials verified successfully! Access granted.');
      
      if (onClientAuthenticated) {
        onClientAuthenticated(folder);
      }

      setTimeout(() => {
        setAuthModalState({ isOpen: false, folder: null, file: null, action: 'download' });

        if (action === 'download' && file) {
          const a = document.createElement('a');
          a.href = file.fileUrl;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (action === 'share') {
          onShareWhatsApp(folder);
        }
      }, 600);
    } else {
      setAuthError('Incorrect User ID (Mobile) or Password. Please check your credentials.');
    }
  };

  return (
    <section className="space-y-6 py-6">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600">
              Public Portfolio
            </span>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> View-Only Access Enabled
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Architectural Project Vaults & Blueprints
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Browse all residential and commercial project drawings in public View-Only mode. High-resolution downloads and direct client sharing are securely locked behind User ID and Password verification.
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vault or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
          />
        </div>
      </div>

      {/* Folders & Files Public Grid */}
      {filteredFolders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFolders.map((folder) => {
            const isAuthorized = isUserAuthorizedForFolder(folder);
            const coverImg = folder.coverImageUrl || folder.files?.find(f => f.fileUrl?.startsWith('data:image') || f.type === '3d-render')?.fileUrl;

            return (
              <div
                key={folder.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-5 sm:p-6 space-y-4 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                {/* Folder Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B3B7B] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                        {folder.folderName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Client: {folder.clientName}
                        </span>
                        {folder.projectLocation && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {folder.projectLocation}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auth Status Badge */}
                  <div>
                    {isAuthorized ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <Unlock className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        <Lock className="w-3 h-3" /> View Only
                      </span>
                    )}
                  </div>
                </div>

                {/* Attached Files List (View Only + Protected Download/Share) */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Vault Drawings & Attachments ({folder.files?.length || 0})
                  </span>

                  {folder.files && folder.files.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {folder.files.map((file) => {
                        const isVid = file.type === 'video' || file.category?.includes('Video');
                        const isImg = file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image');

                        return (
                          <div
                            key={file.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#0B3B7B] dark:text-blue-400 flex items-center justify-center shrink-0">
                                {isVid ? <Film className="w-4 h-4 text-red-500" /> : isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {file.category} · {file.fileSize || 'Standard'}
                                </span>
                              </div>
                            </div>

                            {/* Actions Strip */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* 1. Public View Button (Free Access) */}
                              <button
                                type="button"
                                onClick={() => onPreviewFile(file, folder)}
                                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0B3B7B] dark:text-blue-300 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition"
                                title="View Blueprint / 3D Render"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </button>

                              {/* 2. Download Button (Protected) */}
                              <button
                                type="button"
                                onClick={() => handleDownloadClick(folder, file)}
                                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                                  isAuthorized
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40 hover:bg-amber-100'
                                }`}
                                title={isAuthorized ? "Download Drawing" : "User ID & Password Required to Download"}
                              >
                                {!isAuthorized && <Lock className="w-3 h-3 text-amber-500" />}
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Download</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                      No files uploaded in this vault yet.
                    </div>
                  )}
                </div>

                {/* Footer Strip */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onOpenVisitingCard(folder)}
                    className="text-[#0B3B7B] dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Project QR Card</span>
                  </button>

                  <button
                    onClick={() => handleShareClick(folder)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                      isAuthorized
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {!isAuthorized && <Lock className="w-3 h-3 text-amber-500" />}
                    <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Share Vault</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Folder className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            No project vaults match your search
          </h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search keywords or clear your filter.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER ID & PASSWORD VERIFICATION MODAL FOR PROTECTED DOWNLOAD & SHARE */}
      {/* ========================================================================= */}
      {authModalState.isOpen && authModalState.folder && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-5">
            
            {/* Close button */}
            <button
              onClick={() => setAuthModalState({ isOpen: false, folder: null, file: null, action: 'download' })}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Client Authentication Required
                </h3>
                <p className="text-xs text-slate-500">
                  {authModalState.action === 'download' ? 'Enter credentials to download drawing' : 'Enter credentials to share project vault'}
                </p>
              </div>
            </div>

            {/* Project Vault Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                📁 {authModalState.folder.folderName}
              </div>
              <div className="text-slate-500">
                Client: {authModalState.folder.clientName}
              </div>
              {authModalState.file && (
                <div className="text-[#0B3B7B] dark:text-blue-400 font-semibold pt-1">
                  File: {authModalState.file.name} ({authModalState.file.fileSize})
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  User ID (Mobile Number) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={inputMobile}
                    onChange={(e) => setInputMobile(e.target.value)}
                    placeholder="e.g. 9847123456"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vault Custom Password *
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter vault password"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0B3B7B] hover:bg-[#07244C] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & {authModalState.action === 'download' ? 'Download' : 'Share'}</span>
              </button>
            </form>

            <div className="text-center">
              <p className="text-[11px] text-slate-400">
                Credentials are on your official Vasthusilpy Project Card. Helpline: 9747995961
              </p>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
