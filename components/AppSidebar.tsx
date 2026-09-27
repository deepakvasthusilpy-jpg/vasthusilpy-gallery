'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  Folder, 
  Users, 
  Star, 
  UploadCloud, 
  Settings, 
  LogOut, 
  LogIn, 
  Compass, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  HardDrive,
  Sparkles,
  UserCheck,
  Building2,
  Lock,
  Layers,
  FileText,
  CreditCard,
  FolderOpen,
  HelpCircle,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { AuthSession } from '@/lib/storage';
import { COMPANY_INFO } from '@/lib/sample-data';

export type DashboardTab = 
  | 'my-cloud' 
  | 'shared-files' 
  | 'all-files' 
  | 'upload-center' 
  | 'visiting-cards' 
  | 'services' 
  | 'ai-vasthu' 
  | 'drive-sync' 
  | 'settings';

interface AppSidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  session: AuthSession | null;
  isAdmin: boolean;
  onOpenGateway: (role?: 'admin' | 'client') => void;
  onLogout: () => void;
  onOpenCreateFolder: () => void;
  onOpenDriveSync: () => void;
  onOpenAIVasthu: () => void;
  totalVaultsCount: number;
  totalFilesCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  session,
  isAdmin,
  onOpenGateway,
  onLogout,
  onOpenCreateFolder,
  onOpenDriveSync,
  onOpenAIVasthu,
  totalVaultsCount,
  totalFilesCount,
  theme,
  onToggleTheme
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // When user hovers over collapsed dock, auto expand smoothly
  const effectivelyExpanded = !isCollapsed || isHovered;

  const primaryNavItems = [
    {
      id: 'my-cloud' as DashboardTab,
      label: 'My Cloud',
      icon: Cloud,
      count: totalVaultsCount,
      tag: 'Hub',
      description: 'Master Vault Hub'
    },
    {
      id: 'shared-files' as DashboardTab,
      label: 'Shared Files',
      icon: Users,
      count: totalVaultsCount,
      tag: 'Client',
      description: 'Client Shared Vaults'
    },
    {
      id: 'all-files' as DashboardTab,
      label: 'All Documents',
      icon: FileText,
      count: totalFilesCount,
      tag: 'Files',
      description: 'CAD Plans, 3D Renders & Permits'
    },
    {
      id: 'upload-center' as DashboardTab,
      label: 'Upload Center',
      icon: UploadCloud,
      count: undefined,
      tag: 'Instant',
      description: 'Drag & Drop Instant Vault Uploader'
    },
    {
      id: 'visiting-cards' as DashboardTab,
      label: 'Visiting Cards',
      icon: CreditCard,
      count: totalVaultsCount,
      tag: 'Card',
      description: 'Client Project QR Cards'
    }
  ];

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col justify-between shrink-0 bg-[#0B3B7B] dark:bg-[#07244C] text-white transition-all duration-300 ease-in-out z-30 shadow-2xl border-r border-blue-900/60 select-none ${
        effectivelyExpanded ? 'w-64 sm:w-72' : 'w-20'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: USER / BRAND PROFILE DOCK */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 flex flex-col items-center border-b border-blue-900/50 relative">
        
        {/* Toggle Collapse Button on right edge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-[#0B3B7B] dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-110 transition z-40"
          title={effectivelyExpanded ? "Collapse Sidebar" : "Pin Sidebar"}
        >
          {effectivelyExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* User / Company Avatar */}
        <div 
          className="relative group cursor-pointer" 
          onClick={() => !session && onOpenGateway('admin')}
          title={session ? `${session.name} (${session.role})` : 'Click to Login'}
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-400 via-indigo-300 to-sky-200 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#082852] flex items-center justify-center overflow-hidden border border-white/40">
              {session?.name ? (
                <span className="text-base font-black text-white uppercase tracking-wider">
                  {session.name.slice(0, 2)}
                </span>
              ) : (
                <div className="flex flex-col items-center justify-center text-blue-200">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
          {/* Active Status Indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0B3B7B] rounded-full shadow-sm" />
        </div>

        {/* User Info (Visible when expanded) */}
        {effectivelyExpanded && (
          <div className="mt-3 text-center w-full px-2 animate-in fade-in duration-200">
            <div className="font-bold text-sm text-white tracking-wide truncate">
              {session ? session.name : COMPANY_INFO.name}
            </div>
            <div className="text-[11px] text-blue-200/90 font-medium flex items-center justify-center gap-1 mt-0.5">
              {session?.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/25 text-red-200 border border-red-400/30 text-[10px] font-bold inline-flex items-center gap-1">
                  <Shield className="w-3 h-3 text-red-300" /> Admin (9747995961)
                </span>
              ) : session?.role === 'client' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-300" /> Client Portal
                </span>
              ) : (
                <span className="text-blue-200 text-[11px] font-medium">
                  Keralassery, Palakkad
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE NAVIGATION ITEMS */}
      {/* ========================================================================= */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        
        {/* Primary Workspace Section */}
        <div className="space-y-1">
          {effectivelyExpanded && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/60">
              Workspace & Vaults
            </div>
          )}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-semibold text-xs tracking-wide transition-all ${
                  isActive
                    ? 'bg-white text-[#0B3B7B] shadow-lg font-bold scale-[1.01]'
                    : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                } ${!effectivelyExpanded ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0B3B7B]' : 'text-blue-200'}`} />
                {effectivelyExpanded && (
                  <div className="flex-1 flex items-center justify-between text-left min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ml-1 shrink-0 ${
                        isActive ? 'bg-blue-100 text-[#0B3B7B]' : 'bg-white/15 text-white'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dedicated Fast Vault Creation Shortcut */}
        <div className="pt-3 mt-3 border-t border-blue-900/40 space-y-1.5">
          <button
            onClick={onOpenCreateFolder}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/40 transition hover:scale-[1.02] ${
              !effectivelyExpanded ? 'justify-center px-0' : ''
            }`}
            title="Create New Project Vault"
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            {effectivelyExpanded && <span className="truncate">+ New Project Vault</span>}
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: SETTINGS, THEME & LOGOUT */}
      {/* ========================================================================= */}
      <div className="p-3 border-t border-blue-900/50 space-y-1">
        
        {/* Settings Tab */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition ${
            activeTab === 'settings'
              ? 'bg-white text-[#0B3B7B] font-bold shadow-md'
              : 'text-blue-200 hover:bg-white/10 hover:text-white'
          } ${!effectivelyExpanded ? 'justify-center px-0' : ''}`}
          title="Settings & Security"
        >
          <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-[#0B3B7B]' : 'text-blue-300'}`} />
          {effectivelyExpanded && <span className="truncate">Settings & Admin</span>}
        </button>

        {/* Theme Switcher Quick Toggle */}
        {onToggleTheme && effectivelyExpanded && (
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 hover:bg-white/10 transition"
          >
            <span className="flex items-center gap-2.5">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-blue-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
              <span>Theme Mode</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white uppercase">
              {theme}
            </span>
          </button>
        )}

        {/* Log In / Log Out */}
        {session ? (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-100 transition ${
              !effectivelyExpanded ? 'justify-center px-0' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400" />
            {effectivelyExpanded && <span className="truncate">Log out</span>}
          </button>
        ) : (
          <button
            onClick={() => onOpenGateway('client')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 transition ${
              !effectivelyExpanded ? 'justify-center px-0' : ''
            }`}
            title="Login Gateway"
          >
            <LogIn className="w-4 h-4 shrink-0 text-emerald-400" />
            {effectivelyExpanded && <span className="truncate">Sign in</span>}
          </button>
        )}
      </div>

    </aside>
  );
};
