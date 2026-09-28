'use client';

import React, { useState } from 'react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { 
  X, 
  FolderPlus, 
  User, 
  Phone, 
  Lock, 
  Sparkles, 
  Image as ImageIcon,
  Key,
  ShieldCheck,
  UploadCloud,
  File,
  CheckCircle2,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Plus,
  Radio,
  MapPin,
  Tag,
  Check,
  Building2,
  Video,
  Copy,
  Info
} from 'lucide-react';
import { addMultipleFolderFilesToMediaStream } from '@/lib/mediaStreamStorage';

interface SelectedAttachment {
  id: string;
  name: string;
  type: ProjectFile['type'];
  fileUrl: string;
  fileSize: string;
  isCover: boolean;
  category: string;
  addToStream?: boolean;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (newFolder: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'chatMessages'> & { files?: ProjectFile[] }) => Promise<void>;
}

const QUICK_CATEGORIES = [
  '3D Elevation Design',
  'Building Plans & CAD',
  '3D Video Walkthrough',
  'Vasthu Consultation',
  'Land Survey',
  'Building Permit',
  'Complete Villa Package'
];

const QUICK_LOCATIONS = [
  'Keralassery, Palakkad',
  'Kongad, Palakkad',
  'Pathirippala, Palakkad',
  'Ottapalam, Palakkad',
  'Palakkad Town',
  'Mundur, Palakkad'
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder
}) => {
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [projectCategory, setProjectCategory] = useState<string>('3D Elevation Design');
  const [projectLocation, setProjectLocation] = useState<string>('Keralassery, Palakkad');
  const [notes, setNotes] = useState('');
  const [cardTheme, setCardTheme] = useState<ProjectFolder['cardTheme']>('signature-red');
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen) return null;

  // Auto-generate strong default password based on client name
  const generatePassword = (format: 'name-num' | 'name-year' | 'pin4' | 'random' = 'name-num') => {
    const cleanName = clientName.trim().toLowerCase().replace(/[^a-z]/g, '') || 'vasthu';
    if (format === 'name-year') {
      setCustomPassword(`${cleanName}@2026`);
    } else if (format === 'name-num') {
      const num = Math.floor(100 + Math.random() * 900);
      setCustomPassword(`${cleanName}@${num}`);
    } else if (format === 'pin4') {
      const pin = Math.floor(1000 + Math.random() * 9000);
      setCustomPassword(`${pin}`);
    } else {
      const rand = Math.floor(1000 + Math.random() * 9000);
      setCustomPassword(`VP@${rand}`);
    }
  };

  const copyPasswordToClipboard = () => {
    if (!customPassword) return;
    navigator.clipboard.writeText(customPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Handle multiple file attachments selection
  const handleMultipleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type.includes('pdf');
      const isVid = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      let detectedType: ProjectFile['type'] = 'document';
      let category = 'Document';

      if (isVid) {
        detectedType = 'video';
        category = '3D Video Walkthrough';
      } else if (isImg) {
        detectedType = '3d-render';
        category = '3D Elevation / Photo';
      } else if (isPdf) {
        detectedType = 'blueprint';
        category = 'Building Plan';
      } else if (file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
        detectedType = 'blueprint';
        category = 'CAD Drawing';
      }

      const objectUrl = URL.createObjectURL(file);
      const newAttId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      setAttachments((prev) => {
        const hasCover = prev.some((a) => a.isCover);
        const isCover = !hasCover && (isImg || isVid);
        const newAtt: SelectedAttachment = {
          id: newAttId,
          name: file.name,
          type: detectedType,
          fileUrl: objectUrl,
          fileSize: sizeStr,
          isCover,
          category,
          addToStream: isImg || isVid // Default photos/videos to broadcast on media stream
        };
        return [...prev, newAtt];
      });

      // Also read as base64 for persistent storage if needed
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

    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
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

  const handleToggleStream = (id: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, addToStream: !a.addToStream } : a))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedClient = clientName.trim();
    const trimmedMobile = clientMobile.trim();
    const trimmedPassword = customPassword.trim();

    if (!trimmedClient || !trimmedMobile || !trimmedPassword) return;

    setIsSubmitting(true);

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

    // Folder Name is set exactly to the Client Name!
    const folderPayload = {
      folderName: trimmedClient,
      clientName: trimmedClient,
      clientMobile: trimmedMobile,
      customPassword: trimmedPassword,
      projectCategory,
      projectLocation: projectLocation.trim(),
      coverImageUrl: coverUrl,
      notes: notes.trim(),
      cardTheme: cardTheme || 'signature-red',
      driveSynced: true,
      files: formattedFiles
    };

    onCreateFolder(folderPayload).catch((err) => console.warn('Folder creation error:', err));

    // If any attachments were flagged for media stream, sync them
    const streamAttachments = attachments.filter(a => a.addToStream);
    if (streamAttachments.length > 0) {
      const streamFiles: ProjectFile[] = streamAttachments.map(a => ({
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: a.name,
        type: a.type,
        category: a.category,
        fileUrl: a.fileUrl,
        fileSize: a.fileSize,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Admin (Vasthusilpy)',
        isCover: a.isCover
      }));
      addMultipleFolderFilesToMediaStream(streamFiles, { ...folderPayload, id: 'temp', createdAt: '', updatedAt: '', reviews: [], chatMessages: [] });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-600 via-red-700 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-md">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Create New Client Project Folder Vault</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-red-100/90 mt-0.5">
                The folder name is automatically set to the <strong>Client Name</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* 1. Client & Authentication Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>1. Client Information & Vault Access Credentials</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">* Required</span>
            </div>

            {/* Field: Client Full Name (Folder Name) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Client Full Name * (Created Folder Name)</span>
                {clientName.trim() && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Folder Name: &quot;{clientName.trim()}&quot;
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Suresh Kumar"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-xs"
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                This client name will be the title displayed on the project folder and visiting card.
              </p>
            </div>

            {/* Field: Mobile Number (User ID) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Mobile Number * (User ID)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="e.g. 9847123456"
                    value={clientMobile}
                    onChange={(e) => setClientMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Used by client to unlock folder & files</p>
              </div>

              {/* Field: Custom Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Custom Password *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => generatePassword('name-num')}
                      className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="e.g. suresh@123"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-xs"
                    required
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                    {customPassword && (
                      <button
                        type="button"
                        onClick={copyPasswordToClipboard}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="Copy Password"
                      >
                        {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      tabIndex={-1}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick password presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400">Quick 1-Click Suggestions:</span>
              <button
                type="button"
                onClick={() => generatePassword('name-num')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:border-red-400 transition cursor-pointer"
              >
                {clientName.trim().toLowerCase() || 'name'}@123
              </button>
              <button
                type="button"
                onClick={() => generatePassword('name-year')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:border-red-400 transition cursor-pointer"
              >
                {clientName.trim().toLowerCase() || 'name'}@2026
              </button>
              <button
                type="button"
                onClick={() => generatePassword('pin4')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:border-red-400 transition cursor-pointer"
              >
                4-Digit PIN
              </button>
            </div>
          </div>

          {/* 2. Project Details (Quick Chips) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-red-600" />
              <span>2. Project Category & Location</span>
            </div>

            {/* Category selection chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProjectCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      projectCategory === cat
                        ? 'bg-red-600 text-white font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Location selection chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Site Location</span>
                <span className="text-[10px] text-slate-400 font-normal">Palakkad District</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setProjectLocation(loc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      projectLocation === loc
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Keralassery, Palakkad"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project Notes & Specifications (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Contemporary 3BHK with traditional Vasthu courtyard, car porch, and modern elevation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* 3. MULTIPLE ATTACHMENTS UPLOAD (Blueprints, 3D Renders, Photos, Videos, PDFs) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <UploadCloud className="w-4 h-4 text-red-600" />
                  <span>3. Attachments, Drawings & 3D Cover Photo</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Select 3D elevations, CAD plans, permits, or walkthrough videos to include immediately
                </p>
              </div>
              {attachments.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                  {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
                </span>
              )}
            </div>

            {/* Drop Area */}
            <div className="relative">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-red-300 dark:border-red-900/60 hover:border-red-500 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 cursor-pointer transition text-center group">
                <UploadCloud className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to Select Multiple Photos, Plans, Blueprints & Videos
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Supports JPG, PNG, WEBP, PDF, DWG, DXF, MP4
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleMultipleFilesPicked}
                  className="hidden"
                />
              </label>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                  <span>Selected Files ({attachments.length})</span>
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="text-red-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-2 text-xs"
                    >
                      {/* Left: Thumbnail and info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {att.fileUrl.startsWith('data:image') || att.fileUrl.startsWith('http') || att.fileUrl.startsWith('blob:') ? (
                          <img
                            src={att.fileUrl}
                            alt={att.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0 border border-red-200 dark:border-red-900">
                            {att.type === 'video' ? <Video className="w-5 h-5" /> : <File className="w-5 h-5" />}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-[260px]">
                            {att.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{att.fileSize}</span>
                            <span>•</span>
                            <span className="capitalize">{att.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Cover Button */}
                        {(att.fileUrl.startsWith('data:image') || att.fileUrl.startsWith('http') || att.fileUrl.startsWith('blob:')) && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(att.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                              att.isCover
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Set as Folder Cover Photo"
                          >
                            <Star className="w-3 h-3" />
                            <span>{att.isCover ? 'Cover' : 'Make Cover'}</span>
                          </button>
                        )}

                        {/* Stream Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStream(att.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                            att.addToStream
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-50 hover:text-purple-600'
                          }`}
                          title="Broadcast in Public Media Stream Cinema"
                        >
                          <Radio className="w-3 h-3" />
                          <span>{att.addToStream ? 'In Stream' : '+ Stream'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                          title="Remove attachment"
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

          {/* 4. Live Summary Card */}
          {clientName.trim() && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Folder Name: <strong>&quot;{clientName.trim()}&quot;</strong> • User ID: <strong>{clientMobile.trim() || 'Pending Mobile No'}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                {attachments.length} {attachments.length === 1 ? 'file' : 'files'} attached
              </span>
            </div>
          )}

          {/* Form Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !clientName.trim() || !clientMobile.trim() || !customPassword.trim()}
              className="px-6 py-2.5 rounded-2xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? 'Creating Vault...' 
                  : clientName.trim() 
                    ? `Create Vault for "${clientName.trim()}"` 
                    : 'Create Project Vault'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
