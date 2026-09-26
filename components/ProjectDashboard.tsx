'use client';

import React, { useState } from 'react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { FolderCard } from './FolderCard';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  LayoutGrid, 
  List, 
  Files, 
  Search, 
  FolderPlus, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  QrCode, 
  Share2, 
  Plus, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  FileSpreadsheet, 
  RotateCcw,
  ArrowUpDown,
  Filter,
  Layers,
  KeyRound,
  Lock,
  Upload
} from 'lucide-react';

interface ProjectDashboardProps {
  folders: ProjectFolder[];
  isAdmin: boolean;
  onOpenFolder: (folder: ProjectFolder) => void;
  onOpenVisitingCard: (folder: ProjectFolder) => void;
  onEditFolder?: (folder: ProjectFolder) => void;
  onDeleteFolder?: (folder: ProjectFolder) => void;
  onOpenCreateFolder: () => void;
  onResetVault?: () => void;
  onShareWhatsApp: (folder: ProjectFolder) => void;
  onEditFile?: (folder: ProjectFolder, file: ProjectFile) => void;
  onDeleteFile?: (folderId: string, fileId: string, fileName: string) => void;
  onUploadFile?: (folderId: string, fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => Promise<void>;
  onPreviewFile?: (file: ProjectFile) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  folders,
  isAdmin,
  onOpenFolder,
  onOpenVisitingCard,
  onEditFolder,
  onDeleteFolder,
  onOpenCreateFolder,
  onResetVault,
  onShareWhatsApp,
  onEditFile,
  onDeleteFile,
  onUploadFile,
  onPreviewFile
}) => {
  // Arrangement View Modes
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'files'>('grid');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'files'>('newest');

  // Direct quick file upload state for table view
  const [quickUploadFolderId, setQuickUploadFolderId] = useState<string | null>(null);

  // Compute Metrics
  const totalFolders = folders.length;
  const allFiles: Array<{ file: ProjectFile; folder: ProjectFolder }> = [];
  folders.forEach((f) => {
    if (f.files && Array.isArray(f.files)) {
      f.files.forEach((file) => {
        allFiles.push({ file, folder: f });
      });
    }
  });

  const totalFiles = allFiles.length;
  const totalBlueprints = allFiles.filter(item => item.file.type === 'blueprint' || item.file.category === 'Building Plans' || item.file.category === 'Building Permit').length;
  const totalRenders = allFiles.filter(item => item.file.type === '3d-render' || item.file.type === 'photo' || item.file.category === '3D Design').length;
  const completedProjects = folders.filter(f => f.status === 'Completed' || f.status === 'Approved').length;

  // Filter & Sort Folders
  const filteredFolders = folders.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      f.folderName.toLowerCase().includes(q) ||
      f.clientName.toLowerCase().includes(q) ||
      f.clientMobile.includes(q) ||
      (f.projectLocation && f.projectLocation.toLowerCase().includes(q)) ||
      (f.files && f.files.some(file => file.name.toLowerCase().includes(q) || file.category.toLowerCase().includes(q)));

    const matchesCategory = selectedCategory === 'All' || f.projectCategory === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || f.status === selectedStatus;

    return matchesQuery && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'name') return a.clientName.localeCompare(b.clientName);
    if (sortBy === 'files') return (b.files?.length || 0) - (a.files?.length || 0);
    return 0;
  });

  // Filter Files for the "Files Manager" View
  const filteredFiles = allFiles.filter(({ file, folder }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      file.name.toLowerCase().includes(q) ||
      file.category.toLowerCase().includes(q) ||
      folder.folderName.toLowerCase().includes(q) ||
      folder.clientName.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory || folder.projectCategory === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  // Export Dashboard to CSV
  const handleExportCSV = () => {
    if (folders.length === 0) return;
    const headers = ['Folder Name', 'Client Name', 'Client Mobile', 'Password', 'Category', 'Status', 'Location', 'Area', 'Files Count', 'Created At'];
    const rows = folders.map(f => [
      `"${f.folderName.replace(/"/g, '""')}"`,
      `"${f.clientName.replace(/"/g, '""')}"`,
      `"${f.clientMobile}"`,
      `"${f.customPassword}"`,
      `"${f.projectCategory}"`,
      `"${f.status}"`,
      `"${(f.projectLocation || '').replace(/"/g, '""')}"`,
      `"${(f.estimatedArea || '').replace(/"/g, '""')}"`,
      f.files?.length || 0,
      `"${new Date(f.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VASTHUSILPY_Vault_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category Badge Color
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '3D Design':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Building Plans':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Vasthu Consultation':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Building Permit':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Land Survey':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800';
    }
  };

  // Status Badge Color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
      case 'Vasthu Verified':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Under Review':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. EXECUTIVE METRICS DASHBOARD STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Folders */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Client Vaults
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {totalFolders}
              </span>
              <span className="text-xs text-red-600 font-semibold">Active</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600">
            <Folder className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Blueprints */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Building Blueprints
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {totalBlueprints}
              </span>
              <span className="text-xs text-slate-400">CAD/Permits</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total 3D Designs */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              3D Designs & Renders
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {totalRenders}
              </span>
              <span className="text-xs text-slate-400">Elevations</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Attached Files */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Vault Files
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {totalFiles}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">{completedProjects} Approved</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <Files className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

      </div>

      {/* 2. DASHBOARD CONTROLS & ARRANGEMENT BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Top Header: Title, Arrangement Switcher & Primary Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Vault Workspace
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-xs font-bold">
              {viewMode === 'files' ? `${filteredFiles.length} Files` : `${filteredFolders.length} Folders`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Arrangement Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Arrange as Cards Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Arrange as Detailed Table"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Folder Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('files')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'files'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Arrange All Files Across Vaults"
              >
                <Files className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All Files Manager</span>
              </button>
            </div>

            {/* Export CSV Button */}
            {folders.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
                title="Download CSV records of all folders"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Export CSV</span>
              </button>
            )}

            {/* Create New Folder Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenCreateFolder}
                className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <FolderPlus className="w-4 h-4" />
                <span>New Folder</span>
              </button>
            )}

            {/* Reset Slate Button */}
            {isAdmin && folders.length > 0 && onResetVault && (
              <button
                type="button"
                onClick={onResetVault}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 transition border border-slate-200 dark:border-slate-700"
                title="Reset to clean slate (purge test data)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Live Search */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={viewMode === 'files' ? "Search files by name, category, or parent folder..." : "Search by Client Name, Mobile, Folder, Location..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Complete Villa Package">Complete Villa Package</option>
              <option value="Building Plans">Building Plans</option>
              <option value="3D Design">3D Design</option>
              <option value="Vasthu Consultation">Vasthu Consultation</option>
              <option value="Building Permit">Building Permit</option>
              <option value="Land Survey">Land Survey</option>
              <option value="Valuation Certificate">Valuation Certificate</option>
              <option value="Video Rendering Works">Video Rendering Works</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Vasthu Verified">Vasthu Verified</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Client Name (A-Z)</option>
              <option value="files">Sort: Most Files</option>
            </select>
          </div>

        </div>

      </div>

      {/* 3. ARRANGED CONTENT AREA */}

      {/* VIEW 1: GRID CARDS ARRANGEMENT */}
      {viewMode === 'grid' && (
        <div>
          {filteredFolders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  isAdmin={isAdmin}
                  onOpenFolder={(f) => onOpenFolder(f)}
                  onOpenVisitingCard={(f) => onOpenVisitingCard(f)}
                  onEditFolder={isAdmin && onEditFolder ? (f) => onEditFolder(f) : undefined}
                  onResetPassword={isAdmin ? (f) => onOpenFolder(f) : undefined}
                  onDeleteFolder={isAdmin && onDeleteFolder ? () => onDeleteFolder(folder) : undefined}
                  onShareWhatsApp={onShareWhatsApp}
                />
              ))}
            </div>
          ) : (
            <EmptyDashboardState
              searchQuery={searchQuery}
              isAdmin={isAdmin}
              onClearSearch={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedStatus('All'); }}
              onOpenCreateFolder={onOpenCreateFolder}
            />
          )}
        </div>
      )}

      {/* VIEW 2: HIGH-DENSITY TABLE ARRANGEMENT */}
      {viewMode === 'table' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {filteredFolders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Project Folder</th>
                    <th className="py-3.5 px-4 font-bold">Client & Mobile</th>
                    <th className="py-3.5 px-4 font-bold">Attachments</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredFolders.map((folder) => (
                    <tr 
                      key={folder.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Folder Name & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => onOpenFolder(folder)}
                          className="flex items-center gap-3 cursor-pointer group-hover:text-red-600 transition"
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            {folder.coverImageUrl ? (
                              <img src={folder.coverImageUrl} alt={folder.folderName} className="w-full h-full object-cover" />
                            ) : (
                              <Folder className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                              {folder.folderName}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Updated: {new Date(folder.updatedAt || folder.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client Name & Mobile */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {folder.clientName}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                          <Phone className="w-3 h-3 text-red-500" />
                          <span>{folder.clientMobile}</span>
                        </div>
                      </td>

                      {/* Files Count */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenFolder(folder)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition"
                          title="Open folder files"
                        >
                          <Files className="w-3.5 h-3.5 text-red-500" />
                          <span className="font-bold">{folder.files?.length || 0}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${getStatusBadgeClass(folder.status)}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{folder.status}</span>
                        </span>
                      </td>

                      {/* Actions: View, Edit, Delete, Card, WhatsApp */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Folder */}
                          <button
                            type="button"
                            onClick={() => onOpenFolder(folder)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white hover:bg-red-600 transition"
                            title="View Folder Vault"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Visiting Card */}
                          <button
                            type="button"
                            onClick={() => onOpenVisitingCard(folder)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-800 transition"
                            title="Generate QR Visiting Card"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Share */}
                          <button
                            type="button"
                            onClick={() => onShareWhatsApp(folder)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-600 transition"
                            title="Share Credentials via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Edit Folder (Admin Only) */}
                          {isAdmin && onEditFolder && (
                            <button
                              type="button"
                              onClick={() => onEditFolder(folder)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-white hover:bg-blue-600 transition"
                              title="Edit Folder Specifications"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Folder (Admin Only) */}
                          {isAdmin && onDeleteFolder && (
                            <button
                              type="button"
                              onClick={() => onDeleteFolder(folder)}
                              className="p-1.5 rounded-lg text-red-600 hover:text-white hover:bg-red-600 transition"
                              title="Delete Folder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyDashboardState
              searchQuery={searchQuery}
              isAdmin={isAdmin}
              onClearSearch={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedStatus('All'); }}
              onOpenCreateFolder={onOpenCreateFolder}
            />
          )}
        </div>
      )}

      {/* VIEW 3: CENTRALIZED ALL-FILES MANAGER ARRANGEMENT */}
      {viewMode === 'files' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Showing all files uploaded across client vaults ({filteredFiles.length} files)
            </span>
          </div>

          {filteredFiles.length > 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Attachment</th>
                      <th className="py-3.5 px-4 font-bold">Category</th>
                      <th className="py-3.5 px-4 font-bold">Parent Vault Folder</th>
                      <th className="py-3.5 px-4 font-bold">Size</th>
                      <th className="py-3.5 px-4 font-bold">Uploaded</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions (View / Edit / Delete)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredFiles.map(({ file, folder }) => (
                      <tr 
                        key={file.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* File Thumbnail & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => onPreviewFile && onPreviewFile(file)}
                              className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition"
                            >
                              {file.fileUrl.startsWith('data:image') || file.type === '3d-render' || file.type === 'photo' || file.type === 'blueprint' ? (
                                <img src={file.fileUrl} alt={file.name} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div>
                              <div 
                                onClick={() => onPreviewFile && onPreviewFile(file)}
                                className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-red-600 transition"
                              >
                                {file.name}
                              </div>
                              {file.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {file.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(file.category)}`}>
                            {file.category}
                          </span>
                        </td>

                        {/* Parent Folder */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => onOpenFolder(folder)}
                            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-left line-clamp-1"
                          >
                            📁 {folder.folderName}
                          </button>
                        </td>

                        {/* File Size */}
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {file.fileSize}
                        </td>

                        {/* Upload Date */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </td>

                        {/* Actions: View, Edit, Delete, Download */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View File */}
                            <button
                              type="button"
                              onClick={() => onPreviewFile && onPreviewFile(file)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-800 transition"
                              title="Preview Attachment"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Download File */}
                            <a
                              href={file.fileUrl}
                              download={file.name}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-800 transition"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>

                            {/* Edit File (Admin Only) */}
                            {isAdmin && onEditFile && (
                              <button
                                type="button"
                                onClick={() => onEditFile(folder, file)}
                                className="p-1.5 rounded-lg text-blue-600 hover:text-white hover:bg-blue-600 transition"
                                title="Edit File Specifications"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete File (Admin Only) */}
                            {isAdmin && onDeleteFile && (
                              <button
                                type="button"
                                onClick={() => onDeleteFile(folder.id, file.id, file.name)}
                                className="p-1.5 rounded-lg text-red-600 hover:text-white hover:bg-red-600 transition"
                                title="Delete File From Vault"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
              <Files className="w-12 h-12 mx-auto text-slate-400" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No files found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No drawings or attachments match your search filter. Open a folder to upload blueprints or 3D designs.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

// Sub-component: Clean Empty State
const EmptyDashboardState: React.FC<{
  searchQuery: string;
  isAdmin: boolean;
  onClearSearch: () => void;
  onOpenCreateFolder: () => void;
}> = ({ searchQuery, isAdmin, onClearSearch, onOpenCreateFolder }) => {
  return (
    <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto shadow-inner">
        <FolderPlus className="w-8 h-8" />
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="font-black text-lg text-slate-900 dark:text-white">
          {searchQuery ? 'No matching project folders found' : 'Your Architectural Vault is Ready'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {searchQuery 
            ? 'Try clearing your search query or reset category filter.'
            : 'All placeholder data has been cleared. Click below to create your first client project folder, blueprints, and 3D elevation drawings.'}
        </p>
      </div>
      
      {searchQuery ? (
        <button
          type="button"
          onClick={onClearSearch}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          Clear Filters
        </button>
      ) : (
        isAdmin && (
          <button
            type="button"
            onClick={onOpenCreateFolder}
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create First Client Folder</span>
          </button>
        )
      )}
    </div>
  );
};
