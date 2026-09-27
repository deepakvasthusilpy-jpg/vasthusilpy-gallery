'use client';

import React, { useState } from 'react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { 
  X, 
  FolderPlus, 
  User, 
  Phone, 
  Lock, 
  FileText, 
  Sparkles, 
  Image as ImageIcon,
  Key,
  ShieldCheck,
  Palette,
  UploadCloud,
  File,
  CheckCircle2,
  Trash2,
  Star,
  Eye,
  Plus
} from 'lucide-react';

interface SelectedAttachment {
  id: string;
  name: string;
  type: ProjectFile['type'];
  fileUrl: string;
  fileSize: string;
  isCover: boolean;
  category: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (newFolder: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'chatMessages'> & { files?: ProjectFile[] }) => Promise<void>;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder
}) => {
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [folderName, setFolderName] = useState('');
  const [notes, setNotes] = useState('');
  const [cardTheme, setCardTheme] = useState<ProjectFolder['cardTheme']>('signature-red');
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-generate strong default password based on client name
  const generatePassword = () => {
    const cleanName = clientName.trim().toLowerCase().replace(/[^a-z]/g, '') || 'vasthu';
    const num = Math.floor(1000 + Math.random() * 9000);
    setCustomPassword(`${cleanName}@${num}`);
  };

  // Auto-suggest folder name from client name
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    if (!folderName || folderName.startsWith(clientName.trim())) {
      setFolderName(`${val.trim()} Project Vault`);
    }
  };

  // Handle multiple file attachments selection
  const handleMultipleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type.includes('pdf');
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      let detectedType: ProjectFile['type'] = 'document';
      let category = 'Document';

      if (isImg) {
        detectedType = '3d-render';
        category = '3D Elevation / Photo';
      } else if (isPdf) {
        detectedType = 'blueprint';
        category = 'Building Plan';
      } else if (file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
        detectedType = 'blueprint';
        category = 'CAD Drawing';
      }

      // Generate instant object URL for 0ms preview latency
      const objectUrl = URL.createObjectURL(file);
      const newAttId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      setAttachments((prev) => {
        const hasCover = prev.some((a) => a.isCover);
        const isCover = !hasCover && isImg; // Auto-set first image as cover
        const newAtt: SelectedAttachment = {
          id: newAttId,
          name: file.name,
          type: detectedType,
          fileUrl: objectUrl,
          fileSize: sizeStr,
          isCover,
          category
        };
        return [...prev, newAtt];
      });

      // Also read as data URL in background if needed for offline storage
      const reader = new FileReader();
      reader.onload = (ev) => {
        const resultUrl = (ev.target?.result as string) || '';
        if (resultUrl) {
          setAttachments((prev) =>
            prev.map((item) => (item.id === newAttId ? { ...item, fileUrl: resultUrl } : item))
          );
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value to allow re-selecting same files if needed
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      // If deleted attachment was cover, assign cover to next image if available
      if (prev.find((a) => a.id === id)?.isCover && filtered.length > 0) {
        const nextImg = filtered.find((a) => a.fileUrl.startsWith('data:image') || a.fileUrl.startsWith('http') || a.fileUrl.startsWith('blob:'));
        if (nextImg) nextImg.isCover = true;
      }
      return filtered;
    });
  };

  const handleSetCover = (id: string) => {
    setAttachments((prev) =>
      prev.map((a) => ({
        ...a,
        isCover: a.id === id
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientMobile.trim() || !customPassword.trim()) return;

    const coverItem = attachments.find((a) => a.isCover);
    const coverUrl = coverItem?.fileUrl || attachments.find((a) => a.fileUrl.startsWith('data:image') || a.fileUrl.startsWith('http') || a.fileUrl.startsWith('blob:'))?.fileUrl || undefined;

    const formattedFiles: ProjectFile[] = attachments.map((a) => ({
      id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: a.name,
      type: a.type,
      category: a.category,
      fileUrl: a.fileUrl,
      fileSize: a.fileSize,
      uploadedAt: new Date().toISOString(),
      uploadedBy: `Admin (Vasthusilpy)`,
      isCover: a.isCover
    }));

    // Trigger instant creation without blocking modal close
    onCreateFolder({
      folderName: folderName.trim() || `${clientName.trim()} Project Vault`,
      clientName: clientName.trim(),
      clientMobile: clientMobile.trim(),
      customPassword: customPassword.trim(),
      coverImageUrl: coverUrl,
      notes: notes.trim(),
      cardTheme: cardTheme || 'signature-red',
      driveSynced: true,
      files: formattedFiles
    }).catch((err) => console.warn('Folder creation background error:', err));

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create New Client Project Folder Vault</h2>
              <p className="text-xs text-red-100">
                Setup client login credentials & select multiple attachments to upload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Client Credentials Section (Required) */}
          <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Client Login Credentials (Required)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Client Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={clientName}
                    onChange={(e) => handleClientNameChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (User ID for Login) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="e.g. 9847123456"
                    value={clientMobile}
                    onChange={(e) => setClientMobile(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customized Password for Client Portal Access *
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> Auto-Suggest Password
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. suresh@vasthu"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Admin can easily reset this password anytime if the client forgets it.
              </p>
            </div>
          </div>

          {/* 2. Project Folder Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Folder Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Suresh Kumar Project Vault"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* 3. MULTIPLE ATTACHMENTS UPLOAD (Images, Blueprints, Plans, PDFs) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-red-600" />
                  Select Multiple Attachments to Upload (Optional)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select multiple photos, 3D renderings, CAD drawings, PDFs or documents
                </p>
              </div>
              {attachments.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                  {attachments.length} {attachments.length === 1 ? 'file selected' : 'files selected'}
                </span>
              )}
            </div>

            {/* File Upload Button / Drop Area */}
            <div className="relative">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-red-300 dark:border-red-900/60 hover:border-red-500 rounded-2xl p-4 bg-white dark:bg-slate-900 cursor-pointer transition text-center group">
                <UploadCloud className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Click or Drag & Drop to Select Multiple Files
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Images (JPG, PNG, WEBP), Blueprints (PDF), CAD (DWG), Documents
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleMultipleFilesPicked}
                  className="hidden"
                />
              </label>
            </div>

            {/* List of Selected Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                  <span>Selected Files Queue</span>
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-2 text-xs"
                    >
                      {/* Left: Preview thumbnail or icon */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {att.fileUrl.startsWith('data:image') || att.fileUrl.startsWith('http') ? (
                          <img
                            src={att.fileUrl}
                            alt={att.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0 border border-red-200 dark:border-red-900">
                            <File className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
                            {att.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{att.fileSize}</span>
                            <span>•</span>
                            <span className="capitalize">{att.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (Set Cover + Remove) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(att.fileUrl.startsWith('data:image') || att.fileUrl.startsWith('http')) && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(att.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                              att.isCover
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600'
                            }`}
                          >
                            <Star className="w-3 h-3" />
                            <span>{att.isCover ? 'Cover Photo' : 'Make Cover'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Notes & Specifications (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Notes / Specifications (Optional):
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 4BHK elevation with modern stone facade, East-facing Pooja room according to Vasthu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 5. Visiting Card Default Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Visiting Card Style:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'monochrome-color-preview', name: 'Monochrome + Color', desc: 'B&W card with color house render' },
                { id: 'signature-red', name: 'Signature Red & White', desc: 'Official Vasthusilpy branding' },
                { id: 'professional-corporate', name: 'Corporate Slate', desc: 'Executive graphite' },
                { id: 'luxury-slate', name: 'Modern Slate', desc: 'Clean architectural' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCardTheme(t.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    cardTheme === t.id
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/40 ring-1 ring-red-600'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !clientName.trim() || !clientMobile.trim() || !customPassword.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Vault...' : `Create Folder Vault (${attachments.length} Attachments)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
