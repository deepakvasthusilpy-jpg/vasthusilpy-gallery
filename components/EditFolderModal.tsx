'use client';

import React, { useState, useEffect } from 'react';
import { ProjectFolder } from '@/lib/types';
import { 
  X, 
  Edit3, 
  User, 
  Phone, 
  Lock, 
  Layers, 
  MapPin, 
  FileText, 
  Sparkles, 
  Image as ImageIcon,
  Key,
  ShieldCheck,
  Palette,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface EditFolderModalProps {
  folder: ProjectFolder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFolder: (folderId: string, updates: Partial<ProjectFolder>) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
}

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  folder,
  isOpen,
  onClose,
  onUpdateFolder,
  onDeleteFolder
}) => {
  const [folderName, setFolderName] = useState(folder?.folderName || '');
  const [clientName, setClientName] = useState(folder?.clientName || '');
  const [clientMobile, setClientMobile] = useState(folder?.clientMobile || '');
  const [customPassword, setCustomPassword] = useState(folder?.customPassword || '');
  const [notes, setNotes] = useState(folder?.notes || '');
  const [coverImageUrl, setCoverImageUrl] = useState(folder?.coverImageUrl || '');
  const [cardTheme, setCardTheme] = useState<ProjectFolder['cardTheme']>(folder?.cardTheme || 'signature-red');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !folder) return null;

  const generatePassword = () => {
    const cleanName = clientName.trim().toLowerCase().replace(/[^a-z]/g, '') || 'vasthu';
    const num = Math.floor(1000 + Math.random() * 9000);
    setCustomPassword(`${cleanName}@${num}`);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setCoverImageUrl(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientMobile.trim() || !customPassword.trim()) return;

    onUpdateFolder(folder.id, {
      folderName: folderName.trim() || `${clientName.trim()} Project Vault`,
      clientName: clientName.trim(),
      clientMobile: clientMobile.trim(),
      customPassword: customPassword.trim(),
      notes: notes.trim(),
      coverImageUrl: coverImageUrl.trim() || undefined,
      cardTheme
    }).catch((err) => console.warn('Update folder error:', err));
    
    onClose();
  };

  const handleDelete = async () => {
    if (!onDeleteFolder) return;
    setIsDeleting(true);
    await onDeleteFolder(folder.id);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Edit Project Folder
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Update client credentials, project specifications, and vault settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner if toggled */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 dark:bg-red-950/80 border-b border-red-200 dark:border-red-800 flex items-start justify-between gap-3 text-red-900 dark:text-red-200 animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-950 dark:text-red-100">Permanently delete this folder?</h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  All blueprints, attachments, reviews, and client chat logs in <strong>&quot;{folder.folderName}&quot;</strong> will be deleted. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Folder'}
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Section: Client Credentials */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Client Vault Credentials (Mobile Login)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Client User ID) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={clientMobile}
                    onChange={(e) => setClientMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Customized Password with Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customized Password *
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> Auto-Suggest Password
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="e.g. suresh@2026"
                  className="w-full pl-9 pr-24 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Project Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Folder Name *
              </label>
              <input
                type="text"
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Suresh Kumar - 4BHK Contemporary Villa"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client ID (Mobile)
              </label>
              <input
                type="text"
                disabled
                value={clientMobile}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Specifications & Vasthu Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key dimensions, Vasthu orientations, materials, and notes..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Visiting Card Theme Selection */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-red-600" />
              Visiting Card Theme
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'monochrome-color-preview', name: 'Monochrome + Color Preview', desc: 'B&W card with color house render' },
                { id: 'professional-corporate', name: 'Corporate Slate', desc: 'Executive graphite & silver' },
                { id: 'signature-red', name: 'Signature Red & White', desc: 'Official Vasthusilpy branding' },
                { id: 'luxury-slate', name: 'Modern Slate', desc: 'Clean architectural look' },
                { id: 'blueprint-cyan', name: 'Technical Blueprint', desc: 'Drafting grid & cyan' },
                { id: 'kerala-teak', name: 'Kerala Teak Traditional', desc: 'Traditional warm wood tones' },
                { id: 'dark-gold', name: 'Obsidian & Gold', desc: 'Premium luxury finish' }
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setCardTheme(theme.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    cardTheme === theme.id
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/40 shadow-sm ring-1 ring-red-600'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {theme.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {theme.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Cover Preview Image (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Folder Attachment Preview Image (Optional)
              </label>
              {coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Remove Cover Image
                </button>
              )}
            </div>

            {coverImageUrl ? (
              <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="Paste direct image URL (optional)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700">
                    <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>Upload Local File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFilePicked}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            {onDeleteFolder && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold transition flex items-center gap-1.5 border border-red-200 dark:border-red-800"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Folder</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
