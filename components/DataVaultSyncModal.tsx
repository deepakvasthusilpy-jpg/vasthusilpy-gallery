'use client';

import React, { useState, useEffect } from 'react';
import { ProjectFolder } from '@/lib/types';
import { createDataVaultBackup, restoreDataVaultBackup } from '@/lib/storage';
import { 
  signInWithGoogleDrive, 
  signOutGoogleDrive, 
  getGoogleDriveAccessToken, 
  subscribeToGoogleDriveAuth, 
  syncAllFoldersToGoogleDrive,
  backupAllWebsiteDataToGoogleDrive,
  getOrCreateRootVaultFolder,
  GoogleDriveState
} from '@/lib/googleDrive';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  FolderArchive, 
  ShieldCheck, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Server,
  ExternalLink,
  LogOut,
  Sparkles,
  Cloud
} from 'lucide-react';

interface DataVaultSyncModalProps {
  isOpen: boolean;
  folders: ProjectFolder[];
  onClose: () => void;
  onSyncComplete: () => void;
}

export const DataVaultSyncModal: React.FC<DataVaultSyncModalProps> = ({
  isOpen,
  folders,
  onClose,
  onSyncComplete
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncProgressMessage, setSyncProgressMessage] = useState('');
  const [syncProgressPercentage, setSyncProgressPercentage] = useState(0);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [driveState, setDriveState] = useState<GoogleDriveState>({
    isConnected: false,
    user: null,
    rootFolderId: null,
    rootFolderUrl: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeToGoogleDriveAuth((state) => {
      setDriveState(state);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  // Calculate total files
  let totalFiles = 0;
  let syncedFilesCount = 0;
  let syncedFoldersCount = 0;

  folders.forEach((f) => {
    if (f.driveSynced || f.driveFolderId) syncedFoldersCount++;
    if (f.files) {
      totalFiles += f.files.length;
      f.files.forEach((file) => {
        if (file.driveFileId) syncedFilesCount++;
      });
    }
  });

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    try {
      const res = await signInWithGoogleDrive();
      if (res?.accessToken) {
        // Fetch root folder URL
        try {
          const root = await getOrCreateRootVaultFolder(res.accessToken);
          setDriveState((prev) => ({
            ...prev,
            rootFolderId: root.id,
            rootFolderUrl: root.webViewLink
          }));
        } catch (e) {}
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Google Drive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectDrive = async () => {
    await signOutGoogleDrive();
  };

  const handleSyncToDrive = async () => {
    const token = getGoogleDriveAccessToken();
    if (!token) {
      await handleConnectDrive();
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage('');
    setSyncProgressPercentage(5);

    try {
      await backupAllWebsiteDataToGoogleDrive(token, folders, (msg, cur, tot) => {
        setSyncProgressMessage(msg);
        setSyncProgressPercentage(Math.round((cur / Math.max(tot, 1)) * 100));
      });

      setSyncStatus('success');
      setSyncProgressMessage('All website data & project archives are safely stored in Google Drive folder "VasthuWeb"!');
      onSyncComplete();
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message || 'Error occurred while backing up website data to Google Drive');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBackup = () => {
    const backup = createDataVaultBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VASTHUWEB_FULL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const count = await restoreDataVaultBackup(json);
        setRestoreMessage(`Successfully restored ${count} project folders from VasthuWeb archive!`);
        onSyncComplete();
      } catch (err: any) {
        setRestoreMessage(`Restore error: ${err.message || 'Invalid backup JSON file'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Database className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>Google Drive Data Vault</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  Permanent Storage
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Drive Backup Directory: <strong>&quot;VasthuWeb&quot;</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* User Confirmation & Info Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <span className="font-bold">Permanent Drive Preservation:</span> All data on this website (client project folders, architectural drawings, 3D renderings, permits, chat messages, and audio records) is permanently saved and backed up to your Google Drive in the folder <strong>&quot;VasthuWeb&quot;</strong>. Data will remain securely stored in your Google Drive and will not be removed until you explicitly delete it on the website.
            </div>
          </div>

          {/* Google Account Connection Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            {driveState.isConnected && driveState.user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-md">
                  {driveState.user.displayName ? driveState.user.displayName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{driveState.user.displayName || 'Google Account'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                      Connected
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {driveState.user.email}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Google Drive Disconnected
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Connect your Google account to auto-save and backup all website data to &quot;VasthuWeb&quot;
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {driveState.isConnected ? (
                <>
                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>Open Drive Folder</span>
                  </a>
                  <button
                    onClick={handleDisconnectDrive}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Disconnect Google Drive"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                /* Official Sign In with Google styling */
                <button
                  onClick={handleConnectDrive}
                  disabled={isConnecting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2.5 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Storage Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
              <FolderArchive className="w-5 h-5 mx-auto text-red-500 mb-1" />
              <span className="text-xl font-black text-slate-900 dark:text-white">{folders.length}</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Project Folders</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
              <FileCheck className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <span className="text-xl font-black text-slate-900 dark:text-white">{totalFiles}</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Vault Files</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
              <Cloud className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block pt-1">
                {syncedFoldersCount}/{folders.length || 1}
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Drive Synced</span>
            </div>
          </div>

          {/* Sync Trigger Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200/60 dark:border-blue-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Backup All Website Data to &quot;VasthuWeb&quot; Folder</span>
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Creates full website JSON database backup & syncs all blueprints, 3D designs, permits, chat history, and files into your Google Drive folder &quot;VasthuWeb&quot;.
                </p>
              </div>

              <button
                onClick={handleSyncToDrive}
                disabled={isSyncing}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Backing Up...' : 'Backup All Data to Drive'}</span>
              </button>
            </div>

            {isSyncing && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                  <span className="truncate">{syncProgressMessage || 'Synchronizing files to VasthuWeb...'}</span>
                  <span>{syncProgressPercentage}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {syncStatus === 'success' && !isSyncing && (
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All website data and client project vaults are safely stored in Google Drive folder &quot;VasthuWeb&quot;!</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Backup & Restore Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            
            {/* Export JSON Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Download Offline Backup</span>
              </h5>
              <p className="text-[11px] text-slate-500">
                Save an encrypted JSON snapshot of all client folders, passwords, and file records.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs shadow-sm hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Archive (.JSON)</span>
              </button>
            </div>

            {/* Restore JSON Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-purple-500" />
                <span>Restore Offline Backup</span>
              </h5>
              <p className="text-[11px] text-slate-500">
                Import previously saved Data Vault JSON to instantly restore project files.
              </p>
              <label className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Select Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFilePicked}
                  className="hidden"
                />
              </label>
            </div>

          </div>

          {restoreMessage && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span>{restoreMessage}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
