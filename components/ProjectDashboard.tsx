'use client';

import React, { useState, useRef } from 'react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { DashboardTab } from './AppSidebar';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  Plus, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Star, 
  Share2, 
  MoreVertical, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  Check, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Phone, 
  Layers, 
  HardDrive, 
  ExternalLink,
  Lock,
  Calendar,
  Sparkles,
  Users,
  Compass,
  CreditCard,
  Printer,
  Copy,
  FolderLock,
  ShieldCheck,
  Shield,
  HelpCircle,
  Building2,
  MapPin,
  Mail,
  Info
} from 'lucide-react';
import { COMPANY_INFO } from '@/lib/sample-data';

interface ProjectDashboardProps {
  folders: ProjectFolder[];
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  isAdmin: boolean;
  onOpenFolder: (folder: ProjectFolder) => void;
  onOpenVisitingCard: (folder: ProjectFolder) => void;
  onEditFolder?: (folder: ProjectFolder) => void;
  onDeleteFolder?: (folder: ProjectFolder) => void;
  onOpenCreateFolder: () => void;
  onShareWhatsApp: (folder: ProjectFolder) => void;
  onEditFile?: (folder: ProjectFolder, file: ProjectFile) => void;
  onDeleteFile?: (folderId: string, fileId: string, fileName: string) => void;
  onUploadFile?: (folderId: string, fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => Promise<void>;
  onUploadBatchFiles?: (folderId: string, files: Array<Omit<ProjectFile, 'id' | 'uploadedAt'>>) => Promise<void>;
  onPreviewFile?: (file: ProjectFile, folder?: ProjectFolder) => void;
  onOpenDriveSync?: () => void;
  onOpenAIVasthu?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  folders,
  activeTab,
  onSelectTab,
  isAdmin,
  onOpenFolder,
  onOpenVisitingCard,
  onEditFolder,
  onDeleteFolder,
  onOpenCreateFolder,
  onShareWhatsApp,
  onEditFile,
  onDeleteFile,
  onUploadFile,
  onUploadBatchFiles,
  onPreviewFile,
  onOpenDriveSync,
  onOpenAIVasthu
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [copiedFolderId, setCopiedFolderId] = useState<string | null>(null);
  
  // Dedicated Upload Center State
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string>(folders[0]?.id || '');
  const [uploadProgressItems, setUploadProgressItems] = useState<Array<{
    id: string;
    name: string;
    size: string;
    progress: number;
    status: 'uploading' | 'completed';
    type: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flatten all files for global queries and recent list
  const allFilesWithFolder: Array<{ file: ProjectFile; folder: ProjectFolder }> = [];
  folders.forEach((folder) => {
    if (folder.files && Array.isArray(folder.files)) {
      folder.files.forEach((file) => {
        allFilesWithFolder.push({ file, folder });
      });
    }
  });

  // Calculate statistics matching the categories
  const pictureFiles = allFilesWithFolder.filter(({ file }) => file.type === '3d-render' || file.type === 'photo' || file.category?.includes('3D') || file.fileUrl?.startsWith('data:image') || file.fileUrl?.startsWith('http'));
  const documentFiles = allFilesWithFolder.filter(({ file }) => file.type === 'blueprint' || file.type === 'document' || file.category?.includes('Plan') || file.category?.includes('CAD'));
  const videoFiles = allFilesWithFolder.filter(({ file }) => file.type === 'video' || file.type === 'permit' || file.category?.includes('Video') || file.category?.includes('Permit'));

  // Filtered files based on search & category
  const filteredFiles = allFilesWithFolder.filter(({ file, folder }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      file.name.toLowerCase().includes(q) || 
      file.category?.toLowerCase().includes(q) || 
      folder.folderName.toLowerCase().includes(q) || 
      folder.clientName.toLowerCase().includes(q);

    const matchesCategory = selectedCategoryFilter === 'All' || 
      (selectedCategoryFilter === 'Pictures' && (file.type === '3d-render' || file.type === 'photo' || file.category?.includes('3D'))) ||
      (selectedCategoryFilter === 'Documents' && (file.type === 'blueprint' || file.type === 'document' || file.category?.includes('Plan') || file.category?.includes('CAD'))) ||
      (selectedCategoryFilter === 'Videos' && (file.type === 'video' || file.type === 'permit' || file.category?.includes('Permit') || file.category?.includes('Video')));

    return matchesQuery && matchesCategory;
  });

  // Filtered Folders based on search
  const filteredFolders = folders.filter((folder) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || 
      folder.folderName.toLowerCase().includes(q) || 
      folder.clientName.toLowerCase().includes(q) || 
      folder.clientMobile.includes(q) ||
      (folder.projectLocation && folder.projectLocation.toLowerCase().includes(q));
  });

  // Get File Type Icon Style matching colored square icons
  const getFileIconBadge = (file: ProjectFile) => {
    if (file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image')) {
      return {
        bg: 'bg-[#5B63E6]',
        icon: <ImageIcon className="w-5 h-5 text-white" />,
        typeLabel: 'PNG / Image'
      };
    } else if (file.type === 'video' || file.category?.includes('Video')) {
      return {
        bg: 'bg-[#E85D75]',
        icon: <Video className="w-5 h-5 text-white" />,
        typeLabel: 'AVI / Video'
      };
    } else {
      return {
        bg: 'bg-[#0FA3B1]',
        icon: <FileText className="w-5 h-5 text-white" />,
        typeLabel: file.name.endsWith('.dwg') ? 'CAD file' : file.name.endsWith('.pdf') ? 'PDF file' : 'DOCx file'
      };
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = (f: ProjectFolder) => {
    const text = `📁 Vasthusilpy Client Vault: ${f.folderName}\n📱 User ID: ${f.clientMobile}\n🔑 Password: ${f.customPassword}`;
    navigator.clipboard.writeText(text);
    setCopiedFolderId(f.id);
    setTimeout(() => setCopiedFolderId(null), 2500);
  };

  // Handle Drag & Drop / File selection in Upload Center
  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetFolder = folders.find(f => f.id === uploadTargetFolderId) || folders[0];
    if (!targetFolder) {
      alert('Please create a project vault first to upload drawings and files.');
      return;
    }

    const fileArray = Array.from(files);
    const newProgressItems = fileArray.map((f, i) => ({
      id: 'prog_' + Date.now() + '_' + i,
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
      progress: 40,
      status: 'uploading' as const,
      type: f.type
    }));

    setUploadProgressItems((prev) => [...newProgressItems, ...prev]);

    // Format files for instant batch upload
    const formattedFiles: Array<Omit<ProjectFile, 'id' | 'uploadedAt'>> = fileArray.map((f) => {
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type.includes('pdf');
      const sizeStr = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      const detectedType = isImg ? '3d-render' : isPdf ? 'blueprint' : 'document';
      const category = isImg ? '3D Elevation / Photo' : isPdf ? 'Building Plan' : 'Document';

      return {
        name: f.name,
        type: detectedType,
        category,
        fileUrl: URL.createObjectURL(f),
        fileSize: sizeStr,
        uploadedBy: isAdmin ? 'Admin (Vasthusilpy)' : targetFolder.clientName
      };
    });

    // Instant Batch Upload
    if (onUploadBatchFiles) {
      onUploadBatchFiles(targetFolder.id, formattedFiles);
    } else if (onUploadFile) {
      formattedFiles.forEach(item => onUploadFile(targetFolder.id, item));
    }

    // Complete progress immediately
    setTimeout(() => {
      setUploadProgressItems((prev) =>
        prev.map(item => ({ ...item, progress: 100, status: 'completed' }))
      );
    }, 300);

    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#EEF4FB] dark:bg-[#0B1528] overflow-y-auto">
      
      {/* Top Search Bar (matching exact pill design) */}
      <div className="p-4 sm:p-6 pb-2">
        <div className="relative w-full max-w-4xl mx-auto">
          <Search className="absolute left-5 top-3.5 w-5 h-5 text-[#93C5FD] dark:text-blue-400" />
          <input
            type="text"
            placeholder="Search blueprints, 3D designs, client vaults, permits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-13 pr-6 py-3.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border-0 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-[#93C5FD] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1D70E2] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: "MY CLOUD" MASTER VAULT DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'my-cloud' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left 8-9 Columns: Categories, Folders Grid, Recent Files List */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* 1. CATEGORIES SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#0B3B7B] dark:text-white tracking-tight">
                    Categories
                  </h2>
                  {selectedCategoryFilter !== 'All' && (
                    <button
                      onClick={() => setSelectedCategoryFilter('All')}
                      className="text-xs text-[#1D70E2] dark:text-blue-400 font-bold hover:underline"
                    >
                      Show All Categories
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  
                  {/* Category 1: Pictures / 3D Designs */}
                  <div 
                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Pictures' ? 'All' : 'Pictures')}
                    className={`relative p-4 rounded-3xl bg-[#5B63E6] text-white shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex flex-col justify-between h-28 ${
                      selectedCategoryFilter === 'Pictures' ? 'ring-4 ring-white' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Pictures & 3D</div>
                      <div className="text-xs text-indigo-100/90 font-medium">
                        {pictureFiles.length} files
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Documents / Blueprints */}
                  <div 
                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Documents' ? 'All' : 'Documents')}
                    className={`relative p-4 rounded-3xl bg-[#0FA3B1] text-white shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex flex-col justify-between h-28 ${
                      selectedCategoryFilter === 'Documents' ? 'ring-4 ring-white' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">CAD Plans & Blueprints</div>
                      <div className="text-xs text-cyan-100/90 font-medium">
                        {documentFiles.length} files
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Videos / 3D Walkthroughs */}
                  <div 
                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Videos' ? 'All' : 'Videos')}
                    className={`relative p-4 rounded-3xl bg-[#E85D75] text-white shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex flex-col justify-between h-28 ${
                      selectedCategoryFilter === 'Videos' ? 'ring-4 ring-white' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">3D Video Walkthroughs</div>
                      <div className="text-xs text-rose-100/90 font-medium">
                        {videoFiles.length} files
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2. PROJECT FOLDERS & VAULTS GRID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#0B3B7B] dark:text-white tracking-tight">
                    Project Vaults & Folders ({filteredFolders.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectTab('shared-files')}
                      className="text-xs text-[#1D70E2] dark:text-blue-400 font-bold hover:underline"
                    >
                      View Shared List
                    </button>
                    {isAdmin && (
                      <button
                        onClick={onOpenCreateFolder}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Vault</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFolders.map((folder) => {
                    const coverImg = folder.coverImageUrl || folder.files?.find(f => f.fileUrl?.startsWith('data:image') || f.type === '3d-render')?.fileUrl;
                    return (
                      <div
                        key={folder.id}
                        className="group bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all duration-200 flex flex-col justify-between relative cursor-pointer"
                        onClick={() => onOpenFolder(folder)}
                      >
                        {/* Cover Image or Blueprint Banner */}
                        <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 overflow-hidden relative mb-3">
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={folder.folderName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-blue-300/80 p-4 text-center">
                              <Building2 className="w-8 h-8 mb-1 opacity-70" />
                              <span className="text-[11px] font-bold text-blue-200">Architectural Vault</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                            {folder.files?.length || 0} Files
                          </div>
                        </div>

                        {/* Folder Info */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {folder.folderName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>Client:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {folder.clientName}
                            </span>
                          </div>
                          {folder.projectLocation && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="truncate">{folder.projectLocation}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenVisitingCard(folder);
                            }}
                            className="inline-flex items-center gap-1 text-[#0B3B7B] dark:text-blue-400 font-bold hover:underline"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Visiting Card</span>
                          </button>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onShareWhatsApp(folder)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && onEditFolder && (
                              <button
                                type="button"
                                onClick={() => onEditFolder(folder)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                title="Edit Vault"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isAdmin && onDeleteFolder && (
                              <button
                                type="button"
                                onClick={() => onDeleteFolder(folder)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition"
                                title="Delete Vault"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. RECENT FILES LIST */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#0B3B7B] dark:text-white tracking-tight">
                    Recent Files & CAD Drawings ({filteredFiles.length})
                  </h2>
                  <button
                    onClick={() => onSelectTab('all-files')}
                    className="text-xs text-[#1D70E2] dark:text-blue-400 font-bold hover:underline"
                  >
                    View All Files
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredFiles.slice(0, 8).map(({ file, folder }) => {
                    const badge = getFileIconBadge(file);
                    return (
                      <div
                        key={file.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 transition flex items-center justify-between gap-3"
                      >
                        <div 
                          onClick={() => onPreviewFile && onPreviewFile(file, folder)}
                          className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-xl ${badge.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                            {badge.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {file.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {folder.folderName} · {folder.clientName}
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-6 text-xs text-slate-400 font-semibold">
                          <span className="w-24 text-left">{badge.typeLabel}</span>
                          <span className="w-16 font-mono text-slate-500">{file.fileSize}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onPreviewFile && onPreviewFile(file, folder)}
                            className="p-2 rounded-xl text-slate-500 hover:text-[#1D70E2] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Preview File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && onDeleteFile && (
                            <button
                              type="button"
                              onClick={() => onDeleteFile(folder.id, file.id, file.name)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                              title="Delete File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right 4 Columns: Upload Widget, Storage Meter, Shared Folders */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* 1. Add New Files Box */}
              <div 
                onClick={() => onSelectTab('upload-center')}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md border border-dashed border-blue-200 dark:border-slate-800 transition cursor-pointer text-center space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1D70E2] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="font-black text-sm text-[#0B3B7B] dark:text-white">
                  Add new files
                </h3>
                <p className="text-[11px] text-slate-400">
                  Drop blueprints, 3D renders, or client documents for instant upload
                </p>
              </div>

              {/* 2. Your Storage Meter Box */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0B3B7B] dark:text-white">Your storage</span>
                  <span className="font-black text-[#1D70E2]">100% Active</span>
                </div>
                
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1D70E2] to-[#5B63E6] rounded-full w-[65%]" />
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  {allFilesWithFolder.length} Vault files preserved across {folders.length} client projects
                </div>
              </div>

              {/* 3. Your Shared Folders Box */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-xs text-[#0B3B7B] dark:text-white">
                  Your shared folders
                </h3>

                <div className="space-y-2">
                  {folders.slice(0, 5).map((f, i) => {
                    const pastelStyles = [
                      'bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/70 dark:text-emerald-300',
                      'bg-[#EDE9FE] text-[#5B21B6] dark:bg-purple-950/70 dark:text-purple-300',
                      'bg-[#FFE4E6] text-[#9F1239] dark:bg-rose-950/70 dark:text-rose-300',
                      'bg-[#E0F2FE] text-[#0369A1] dark:bg-sky-950/70 dark:text-sky-300'
                    ];
                    return (
                      <div
                        key={f.id}
                        onClick={() => onOpenFolder(f)}
                        className={`p-3 rounded-2xl ${pastelStyles[i % pastelStyles.length]} flex items-center justify-between cursor-pointer hover:opacity-90 transition`}
                      >
                        <div className="font-bold text-xs truncate max-w-[170px]">
                          {f.folderName}
                        </div>
                        
                        <div className="w-6 h-6 rounded-full bg-white/80 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center shadow-sm shrink-0 uppercase">
                          {f.clientName.slice(0, 2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isAdmin && (
                  <button
                    onClick={onOpenCreateFolder}
                    className="w-full py-2 rounded-xl text-xs font-bold text-[#1D70E2] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition text-center block"
                  >
                    + Add more vaults
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: "SHARED FILES" */}
      {/* ========================================================================= */}
      {activeTab === 'shared-files' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#0B3B7B] dark:text-white tracking-tight">
              Client Shared Vaults ({folders.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {folders.map((f, i) => {
                const lineColors = ['border-blue-500', 'border-rose-400', 'border-purple-500', 'border-emerald-400'];
                return (
                  <div
                    key={f.id}
                    onClick={() => onOpenFolder(f)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 transition cursor-pointer flex flex-col justify-between h-32"
                  >
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#0B3B7B] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                        {f.clientName.slice(0, 1)}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                        V
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {f.folderName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {f.files?.length || 0} files
                      </div>
                      <div className={`mt-2 border-b-2 ${lineColors[i % lineColors.length]} w-8`} />
                    </div>
                  </div>
                );
              })}

              {isAdmin && (
                <div
                  onClick={onOpenCreateFolder}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#1D70E2] transition cursor-pointer flex items-center justify-center h-32 text-slate-400 hover:text-[#1D70E2]"
                >
                  <Plus className="w-8 h-8 text-[#1D70E2]" />
                </div>
              )}
            </div>

            {/* Shared Recently List */}
            <div className="space-y-3 pt-4">
              <h3 className="text-base font-bold text-[#0B3B7B] dark:text-white">
                Shared Files Log
              </h3>

              <div className="space-y-2">
                {allFilesWithFolder.map(({ file, folder }) => {
                  const badge = getFileIconBadge(file);
                  return (
                    <div
                      key={file.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 transition flex items-center justify-between gap-3"
                    >
                      <div 
                        onClick={() => onPreviewFile && onPreviewFile(file, folder)}
                        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-xl ${badge.bg} flex items-center justify-center shrink-0`}>
                          {badge.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {folder.folderName} · {folder.clientName}
                          </div>
                        </div>
                      </div>

                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center uppercase">
                        {folder.clientName.slice(0, 2)}
                      </div>

                      <div className="hidden sm:flex items-center gap-6 text-xs text-slate-400 font-semibold">
                        <span className="w-24 text-left">{badge.typeLabel}</span>
                        <span className="w-16 font-mono text-slate-500">{file.fileSize}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onShareWhatsApp(folder)}
                          className="p-2 rounded-xl text-slate-500 hover:text-[#1D70E2] transition"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenFolder(folder)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: "ALL DOCUMENTS" / ALL FILES */}
      {/* ========================================================================= */}
      {activeTab === 'all-files' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B3B7B] dark:text-white tracking-tight">
                All Documents & Blueprints ({filteredFiles.length})
              </h2>
              <p className="text-xs text-slate-500">
                Explore CAD drawings, 3D renders, permits, and Vasthu notes
              </p>
            </div>
            <button
              onClick={() => onSelectTab('upload-center')}
              className="px-4 py-2 rounded-2xl bg-[#0B3B7B] hover:bg-blue-900 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map(({ file, folder }) => {
              const badge = getFileIconBadge(file);
              const isImg = file.fileUrl?.startsWith('data:image') || file.type === '3d-render';
              return (
                <div
                  key={file.id}
                  onClick={() => onPreviewFile && onPreviewFile(file, folder)}
                  className="group p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative mb-2 flex items-center justify-center">
                    {isImg ? (
                      <img
                        src={file.fileUrl}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-slate-400">
                        <div className={`w-12 h-12 rounded-2xl ${badge.bg} flex items-center justify-center text-white mb-2 shadow-md`}>
                          {badge.icon}
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{badge.typeLabel}</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono text-white">
                      {file.fileSize}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Vault: {folder.folderName} ({folder.clientName})
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPreviewFile) onPreviewFile(file, folder);
                      }}
                      className="text-[#1D70E2] dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: "UPLOAD CENTER" */}
      {/* ========================================================================= */}
      {activeTab === 'upload-center' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFilesChosen}
            className="hidden"
          />

          <div className="p-8 sm:p-12 rounded-[32px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#0B3B7B] dark:text-white">
              Instant File & Blueprint Uploader
            </h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1D70E2] flex items-center justify-center mx-auto cursor-pointer hover:scale-110 transition shadow-inner"
            >
              <UploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Drag & drop your CAD drawings, 3D models or permits here
              </h3>
              <p className="text-xs text-slate-400 font-medium">Instant upload, zero waiting time</p>
            </div>

            {folders.length > 0 && (
              <div className="max-w-xs mx-auto text-left">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Destination Project Vault:</label>
                <select
                  value={uploadTargetFolderId}
                  onChange={(e) => setUploadTargetFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.folderName} ({f.clientName})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-2xl bg-[#0B3B7B] hover:bg-blue-900 text-white font-bold text-xs transition shadow-md"
              >
                Choose files from computer
              </button>
            </div>
          </div>

          {uploadProgressItems.length > 0 && (
            <div className="p-6 sm:p-8 rounded-[32px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B3B7B] dark:text-white">
                <Clock className="w-4 h-4 text-[#1D70E2]" />
                <span>Uploaded Files Log</span>
              </div>

              <div className="space-y-3">
                {uploadProgressItems.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0FA3B1] text-white flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                        <span className="truncate max-w-[200px]">{item.name}</span>
                        <span className="text-[#1D70E2] font-mono">{item.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1D70E2] rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: "VISITING CARDS" HUB */}
      {/* ========================================================================= */}
      {activeTab === 'visiting-cards' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B3B7B] dark:text-white tracking-tight">
                Client Visiting Cards Hub ({folders.length})
              </h2>
              <p className="text-xs text-slate-500">
                Official Vasthusilpy project vault credentials cards with direct QR code access
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={onOpenCreateFolder}
                className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Issue New Card</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {folders.map((folder) => {
              const directLink = typeof window !== 'undefined' 
                ? `${window.location.origin}?clientMobile=${encodeURIComponent(folder.clientMobile)}&folderId=${encodeURIComponent(folder.id)}`
                : `https://vasthusilpy.com?clientMobile=${folder.clientMobile}`;

              return (
                <div
                  key={folder.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4 relative overflow-hidden"
                >
                  {/* Card Visual Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B3B7B] via-[#082852] to-[#07244C] text-white space-y-3 relative shadow-inner">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-black tracking-widest text-red-400 uppercase">
                          VASTHUSILPY ARCHITECTS
                        </div>
                        <h4 className="font-extrabold text-base text-white truncate max-w-[180px]">
                          {folder.clientName}
                        </h4>
                        <p className="text-[11px] text-blue-200 truncate">
                          {folder.folderName}
                        </p>
                      </div>
                      
                      <div className="p-1 bg-white rounded-lg shrink-0 shadow">
                        <QRCodeSVG value={directLink} size={48} level="M" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between text-[11px] font-mono text-blue-200">
                      <span>ID: {folder.clientMobile}</span>
                      <span>PIN: {folder.customPassword}</span>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onOpenVisitingCard(folder)}
                      className="py-2 px-3 rounded-xl bg-[#0B3B7B] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onShareWhatsApp(folder)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleCopyCredentials(folder)}
                      className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      {copiedFolderId === folder.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFolderId === folder.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: "VASTHU & SERVICES" */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B3B7B] dark:text-white">
                Vasthu & Architectural Services
              </h2>
              <p className="text-xs text-slate-500">
                Kerala Panchayath Building Rules (KMBR) Compliant Plans & Vasthu Consultation
              </p>
            </div>
            {onOpenAIVasthu && (
              <button
                onClick={onOpenAIVasthu}
                className="px-4 py-2 rounded-2xl bg-[#5B63E6] hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Vasthu Consultation</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">📐 Precision Building Plans</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete 2D structural drafting, site layouts, plumbing, electrical, and section drawings ready for Panchayath & Municipality approval.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">🏛️ Authentic Vasthu Consultation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scientific plot alignment, Brahmasthanam calculation, water body positioning, and room orientation according to traditional Thachu Shastra.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">🎨 Photorealistic 3D Visualizations</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                4K exterior elevation renderings, interior design concepts, modern and traditional Kerala architectural styles.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">📜 Building Permits & Land Survey</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Contour mapping, digital boundary plotting, property valuation certificates, and end-to-end permit sanctioning support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: "AI VASTHU CHECK" */}
      {/* ========================================================================= */}
      {activeTab === 'ai-vasthu' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="p-8 sm:p-12 rounded-[32px] bg-gradient-to-br from-[#0B3B7B] via-[#082852] to-[#07244C] text-white shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-amber-300 border border-white/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-black text-white">
                AI Vasthu Shastra Compliance Engine
              </h2>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Check your floor plan for North-East (Eshanya) Pooja room alignment, South-East (Agni) Kitchen orientation, South-West (Niruthi) Master Bedroom positioning, and Brahmasthanam energy clearance.
              </p>
            </div>

            {onOpenAIVasthu && (
              <button
                onClick={onOpenAIVasthu}
                className="px-8 py-3.5 rounded-2xl bg-white text-[#0B3B7B] font-extrabold text-sm shadow-xl hover:bg-blue-50 transition transform hover:scale-105 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Launch Interactive Vasthu Advisor</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 8: "GOOGLE DRIVE SYNC" */}
      {/* ========================================================================= */}
      {activeTab === 'drive-sync' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <HardDrive className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#0B3B7B] dark:text-white">
                  Google Drive Cloud Vault
                </h2>
                <p className="text-xs text-slate-500">
                  Permanent cloud mirror in folder <strong>VasthuWeb</strong> for all client files
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>• Automatically connects to Google Drive via client OAuth integration.</p>
              <p>• Generates dedicated sub-folders for each client project vault.</p>
              <p>• Ensures zero data loss even if browser cache or localStorage is cleared.</p>
            </div>

            {onOpenDriveSync && (
              <button
                onClick={onOpenDriveSync}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm inline-flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                <span>Open Google Drive Sync Manager</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 9: "SETTINGS" */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
          <h2 className="text-xl sm:text-2xl font-black text-[#0B3B7B] dark:text-white">
            Workspace Settings & Admin Security
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Security Profile */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-[#0B3B7B] dark:text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Admin Credentials & 2FA</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <p><strong>Chief Architect:</strong> {COMPANY_INFO.architect}</p>
                <p><strong>Registered Mobile:</strong> <span className="font-mono">{COMPANY_INFO.primaryPhone}</span></p>
                <p><strong>Security Mode:</strong> Time-Based OTP (TOTP Authenticator) & Direct PIN</p>
              </div>
            </div>

            {/* Office Information */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-[#0B3B7B] dark:text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Office Location</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <p><strong>Firm:</strong> {COMPANY_INFO.name}</p>
                <p><strong>Address:</strong> {COMPANY_INFO.address}</p>
                <p><strong>Email:</strong> {COMPANY_INFO.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
