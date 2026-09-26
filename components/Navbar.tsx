'use client';

import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { AuthSession } from '@/lib/storage';
import { ActivityNotification } from '@/lib/types';
import { 
  Sun, 
  Moon, 
  Bell, 
  Shield, 
  User, 
  LogOut, 
  Database, 
  Sparkles, 
  Phone, 
  CheckCheck,
  FolderLock,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  session: AuthSession | null;
  onOpenGateway?: (role?: 'admin' | 'client') => void;
  onOpenAdminLogin: () => void;
  onOpenClientLogin: () => void;
  onLogout: () => void;
  onOpenDataVault: () => void;
  onOpenAIAssistant?: () => void;
  notifications: ActivityNotification[];
  onClearNotifications?: () => void;
  activeTab: 'folders' | 'services' | 'about';
  setActiveTab: (tab: 'folders' | 'services' | 'about') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  toggleTheme,
  session,
  onOpenGateway,
  onOpenAdminLogin,
  onOpenClientLogin,
  onLogout,
  onOpenDataVault,
  onOpenAIAssistant,
  notifications,
  onClearNotifications,
  activeTab,
  setActiveTab
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => setActiveTab('folders')}
            className="cursor-pointer select-none"
          >
            <BrandLogo size="md" />
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('folders')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'folders'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Project Vaults
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'services'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'about'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Company Info
            </button>
          </nav>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Google Cloud Data Vault Button */}
            <button
              onClick={onOpenDataVault}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
              title="Sync with 'VASTHUSILPY - DATA VAULT' Google Cloud Storage"
            >
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Data Vault</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Live Activity Feed</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 font-semibold">
                        Real-time
                      </span>
                    </div>
                    {onClearNotifications && (
                      <button 
                        onClick={onClearNotifications}
                        className="text-[11px] text-slate-500 hover:text-red-600"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 mt-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No activity recorded yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 px-1 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {n.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400">
                            <span>By: {n.actor}</span>
                            {n.folderName && <span>• {n.folderName}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Session Management & Main Gateway Button */}
            {session ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenGateway ? onOpenGateway(session.role === 'admin' ? 'admin' : 'client') : onOpenAdminLogin()}
                  className="hidden sm:flex flex-col text-right hover:opacity-80 transition cursor-pointer p-1 rounded-xl"
                  title="Click to manage access or switch role"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                    {session.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Shield className="w-3.5 h-3.5" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <User className="w-3.5 h-3.5" /> {session.name}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">{session.mobile}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-slate-200 dark:border-slate-800"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenGateway ? onOpenGateway('client') : onOpenClientLogin()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#153e2d] hover:bg-[#1a4a37] text-white shadow-md shadow-[#153e2d]/20 transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setActiveTab('folders'); setMobileMenuOpen(false); }}
                className={`p-2 rounded-lg text-xs font-semibold text-center ${
                  activeTab === 'folders' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Project Vaults
              </button>
              <button
                onClick={() => { setActiveTab('services'); setMobileMenuOpen(false); }}
                className={`p-2 rounded-lg text-xs font-semibold text-center ${
                  activeTab === 'services' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => { setActiveTab('about'); setMobileMenuOpen(false); }}
                className={`p-2 rounded-lg text-xs font-semibold text-center ${
                  activeTab === 'about' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Company Info
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800 text-xs">
              <button 
                onClick={() => { onOpenDataVault(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"
              >
                <Database className="w-3.5 h-3.5" /> Data Vault Sync
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
