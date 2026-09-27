'use client';

import React, { useState, useEffect } from 'react';
import { ProjectFolder, ActivityNotification, ProjectFile, FolderReview, FolderChatMessage } from '@/lib/types';
import { 
  getProjectFolders, 
  subscribeToProjectFolders, 
  saveProjectFolder, 
  updateProjectFolder,
  deleteProjectFolder, 
  clearAllProjectFolders,
  addFileToFolder, 
  addBatchFilesToFolder,
  updateFileInFolder,
  deleteFileFromFolder, 
  setFolderCoverImage, 
  resetClientPassword, 
  addFolderReview, 
  sendFolderChatMessage, 
  toggleMessageDoneStatus,
  getSavedAuthSession,
  saveAuthSession,
  clearAuthSession,
  AuthSession,
  initializeStorage
} from '@/lib/storage';
import { initGoogleDriveAuth } from '@/lib/googleDrive';
import { COMPANY_INFO } from '@/lib/sample-data';
import { Navbar } from '@/components/Navbar';
import { HeroAutoCarousel } from '@/components/HeroAutoCarousel';
import { HomePagePortfolio } from '@/components/HomePagePortfolio';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { AppSidebar, DashboardTab } from '@/components/AppSidebar';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { FolderDetailModal } from '@/components/FolderDetailModal';
import { VisitingCardModal } from '@/components/VisitingCardModal';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { EditFolderModal } from '@/components/EditFolderModal';
import { EditFileModal } from '@/components/EditFileModal';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import { ClientLoginModal } from '@/components/ClientLoginModal';
import { MainLoginGatewayModal } from '@/components/MainLoginGatewayModal';
import { PhotoDocEditorModal } from '@/components/PhotoDocEditorModal';
import { DataVaultSyncModal } from '@/components/DataVaultSyncModal';
import { AIVasthuModal } from '@/components/AIVasthuModal';
import { CompanyServicesSection } from '@/components/CompanyServicesSection';
import { Footer } from '@/components/Footer';
import { 
  Trash2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Download,
  X,
  Crop,
  RotateCw
} from 'lucide-react';

export default function Home() {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'folders' | 'services' | 'about'>('folders');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('my-cloud');

  // Modals & Action States
  const [activeFolderDetail, setActiveFolderDetail] = useState<ProjectFolder | null>(null);
  const [activeVisitingCard, setActiveVisitingCard] = useState<ProjectFolder | null>(null);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ProjectFolder | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // File action states directly from dashboard
  const [fileToEdit, setFileToEdit] = useState<{ folder: ProjectFolder; file: ProjectFile } | null>(null);
  const [directFileToDelete, setDirectFileToDelete] = useState<{ folderId: string; fileId: string; fileName: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isClientLoginOpen, setIsClientLoginOpen] = useState(false);
  const [isGatewayLoginOpen, setIsGatewayLoginOpen] = useState(false);
  const [gatewayInitialRole, setGatewayInitialRole] = useState<'admin' | 'client'>('admin');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isDataVaultOpen, setIsDataVaultOpen] = useState(false);
  const [isAIVasthuOpen, setIsAIVasthuOpen] = useState(false);

  // Photo & Doc Studio Editor state for Dashboard Preview
  const [editorFile, setEditorFile] = useState<{ file: ProjectFile; folder?: ProjectFolder } | null>(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);
  const [editorFolder, setEditorFolder] = useState<ProjectFolder | null>(null);

  const handleOpenGateway = (role: 'admin' | 'client' = 'admin') => {
    setGatewayInitialRole(role);
    setIsGatewayLoginOpen(true);
  };

  // Initialize and subscribe
  useEffect(() => {
    initializeStorage();

    const timer = setTimeout(() => {
      // Check saved auth session on client
      const saved = getSavedAuthSession();
      if (saved) {
        setSession(saved);
      }

      // Dark/Light theme initial check on client
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }, 0);

    const unsub = subscribeToProjectFolders((updatedFolders) => {
      setFolders(updatedFolders);
      
      // Update currently open folder detail if present
      setActiveFolderDetail((currentActive) => {
        if (!currentActive) return null;
        return updatedFolders.find((f) => f.id === currentActive.id) || currentActive;
      });
    });

    // Check URL query params for direct client QR access
    const params = new URLSearchParams(window.location.search);
    const urlMobile = params.get('clientMobile');
    const urlFolderId = params.get('folderId');

    if (urlFolderId || urlMobile) {
      getProjectFolders().then((fList) => {
        const target = fList.find((f) => f.id === urlFolderId || f.clientMobile === urlMobile);
        if (target) {
          setActiveFolderDetail(target);
        }
      });
    }

    // Initialize Google Drive Auth Listener
    const driveAuthUnsub = initGoogleDriveAuth();

    return () => {
      clearTimeout(timer);
      unsub();
      driveAuthUnsub();
    };
  }, []);

  // Theme switcher
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Auth Handlers
  const handleAdminLoginSuccess = (mobile: string, name: string) => {
    const newSession: AuthSession = {
      role: 'admin',
      mobile,
      name,
      loginTime: new Date().toISOString()
    };
    setSession(newSession);
    saveAuthSession(newSession);
    setIsGatewayLoginOpen(false);
    setIsGuestMode(false);
  };

  const handleClientLoginSuccess = (folder: ProjectFolder) => {
    const newSession: AuthSession = {
      role: 'client',
      mobile: folder.clientMobile,
      name: folder.clientName,
      folderId: folder.id,
      loginTime: new Date().toISOString()
    };
    setSession(newSession);
    saveAuthSession(newSession);
    setIsGatewayLoginOpen(false);
    setIsGuestMode(false);
    setActiveFolderDetail(folder);
  };

  const handleLogout = () => {
    setSession(null);
    clearAuthSession();
    setIsGuestMode(false);
    setIsGatewayLoginOpen(true);
  };

  // Role Determination:
  // When a client logs in via client portal, editing and deleting folders/files is hidden.
  // In creator/admin view, all actions are enabled.
  const isClient = session?.role === 'client';
  const isAdmin = session?.role === 'admin' || !isClient;

  // Folder Operations
  const handleCreateFolder = async (folderData: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'chatMessages'> & { files?: ProjectFile[] }) => {
    const newFolder: ProjectFolder = {
      ...folderData,
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: folderData.files || [],
      reviews: [],
      chatMessages: [
        {
          id: 'msg_welcome',
          senderName: 'Vasthusilpy Team',
          senderMobile: COMPANY_INFO.primaryAdminMobile,
          senderRole: 'admin',
          text: `Welcome ${folderData.clientName}! Your project vault is now active. All 3D elevations, architectural blueprints, and municipal permits will be uploaded here.`,
          createdAt: new Date().toISOString(),
          isDone: true
        }
      ]
    };

    // 1. Instant local state update (0ms UI latency)
    setFolders((prev) => [newFolder, ...prev]);
    setActiveVisitingCard(newFolder);

    // 2. Background persistence
    saveProjectFolder(newFolder).catch(err => console.warn('Background folder save error:', err));
  };

  const handleUpdateFolder = async (folderId: string, updates: Partial<ProjectFolder>) => {
    // 1. Immediately update local state
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f))
    );
    if (activeFolderDetail && activeFolderDetail.id === folderId) {
      setActiveFolderDetail((prev) => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
    setEditingFolder(null);

    // 2. Persist to storage & Firestore in background
    updateProjectFolder(folderId, updates).catch(err => console.warn('Background update folder error:', err));
  };

  const handleConfirmDeleteFolder = async (folderId: string) => {
    // 1. Immediately update React state
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolderDetail?.id === folderId) setActiveFolderDetail(null);
    if (editingFolder?.id === folderId) setEditingFolder(null);
    setFolderToDelete(null);

    // 2. Persist to storage & Firestore
    deleteProjectFolder(folderId).catch(err => console.warn('Background delete folder error:', err));
  };

  const handleClearAll = async () => {
    setFolders([]);
    setActiveFolderDetail(null);
    setEditingFolder(null);
    setFolderToDelete(null);
    setShowClearAllConfirm(false);
    await clearAllProjectFolders();
  };

  // File Operations
  const handleUploadFile = async (folderId: string, fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => {
    const tempFile: ProjectFile = {
      ...fileData,
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      uploadedAt: new Date().toISOString()
    };

    // Instant local update
    setActiveFolderDetail((prev) => {
      if (prev && prev.id === folderId) {
        const updatedFiles = [tempFile, ...(prev.files || [])];
        const cover = tempFile.isCover || !prev.coverImageUrl ? (tempFile.fileUrl.startsWith('http') || tempFile.fileUrl.startsWith('data:image') || tempFile.fileUrl.startsWith('blob:') ? tempFile.fileUrl : prev.coverImageUrl) : prev.coverImageUrl;
        return { ...prev, files: updatedFiles, coverImageUrl: cover };
      }
      return prev;
    });

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const updatedFiles = [tempFile, ...(f.files || [])];
          const cover = tempFile.isCover || !f.coverImageUrl ? (tempFile.fileUrl.startsWith('http') || tempFile.fileUrl.startsWith('data:image') || tempFile.fileUrl.startsWith('blob:') ? tempFile.fileUrl : f.coverImageUrl) : f.coverImageUrl;
          return { ...f, files: updatedFiles, coverImageUrl: cover };
        }
        return f;
      })
    );

    addFileToFolder(folderId, fileData).catch(err => console.warn('Background addFile error:', err));
  };

  // Instant Batch File Upload
  const handleUploadBatchFiles = async (folderId: string, filesData: Array<Omit<ProjectFile, 'id' | 'uploadedAt'>>) => {
    const tempFiles: ProjectFile[] = filesData.map((f, idx) => ({
      ...f,
      id: 'f_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
      uploadedAt: new Date().toISOString()
    }));

    // Instant local update
    setActiveFolderDetail((prev) => {
      if (prev && prev.id === folderId) {
        const updatedFiles = [...tempFiles, ...(prev.files || [])];
        const cover = tempFiles.find(tf => tf.isCover)?.fileUrl || (!prev.coverImageUrl ? tempFiles.find(tf => tf.fileUrl.startsWith('http') || tf.fileUrl.startsWith('data:image') || tf.fileUrl.startsWith('blob:'))?.fileUrl : prev.coverImageUrl);
        return { ...prev, files: updatedFiles, coverImageUrl: cover };
      }
      return prev;
    });

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const updatedFiles = [...tempFiles, ...(f.files || [])];
          const cover = tempFiles.find(tf => tf.isCover)?.fileUrl || (!f.coverImageUrl ? tempFiles.find(tf => tf.fileUrl.startsWith('http') || tf.fileUrl.startsWith('data:image') || tf.fileUrl.startsWith('blob:'))?.fileUrl : f.coverImageUrl);
          return { ...f, files: updatedFiles, coverImageUrl: cover };
        }
        return f;
      })
    );

    // Background persistence
    addBatchFilesToFolder(folderId, filesData).catch(err => console.warn('Background batch upload error:', err));
  };

  const handleUpdateFile = async (folderId: string, fileId: string, updates: Partial<ProjectFile>) => {
    setActiveFolderDetail((prev) => {
      if (prev && prev.id === folderId) {
        const updatedFiles = (prev.files || []).map((file) =>
          file.id === fileId ? { ...file, ...updates } : file
        );
        let cover = prev.coverImageUrl;
        if (updates.isCover) {
          cover = updates.fileUrl || cover;
        }
        return { ...prev, files: updatedFiles, coverImageUrl: cover };
      }
      return prev;
    });

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const updatedFiles = (f.files || []).map((file) =>
            file.id === fileId ? { ...file, ...updates } : file
          );
          let cover = f.coverImageUrl;
          if (updates.isCover) {
            cover = updates.fileUrl || cover;
          }
          return { ...f, files: updatedFiles, coverImageUrl: cover };
        }
        return f;
      })
    );

    await updateFileInFolder(folderId, fileId, updates);
  };

  const handleDeleteFile = async (folderId: string, fileId: string) => {
    setActiveFolderDetail((prev) => {
      if (prev && prev.id === folderId) {
        return {
          ...prev,
          files: (prev.files || []).filter((f) => f.id !== fileId)
        };
      }
      return prev;
    });

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            files: (f.files || []).filter((file) => file.id !== fileId)
          };
        }
        return f;
      })
    );

    await deleteFileFromFolder(folderId, fileId);
  };

  const handleSetCoverImage = async (folderId: string, imageUrl: string) => {
    setActiveFolderDetail((prev) => {
      if (prev && prev.id === folderId) {
        return {
          ...prev,
          coverImageUrl: imageUrl,
          files: (prev.files || []).map((file) => ({
            ...file,
            isCover: file.fileUrl === imageUrl
          }))
        };
      }
      return prev;
    });

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            coverImageUrl: imageUrl,
            files: (f.files || []).map((file) => ({
              ...file,
              isCover: file.fileUrl === imageUrl
            }))
          };
        }
        return f;
      })
    );

    await setFolderCoverImage(folderId, imageUrl);
  };

  const handleResetPassword = async (folderId: string, newPass: string) => {
    await resetClientPassword(folderId, newPass);
  };

  const handleAddReview = async (folderId: string, review: Omit<FolderReview, 'id' | 'createdAt' | 'verified'>) => {
    await addFolderReview(folderId, review);
  };

  const handleSendMessage = async (folderId: string, msg: Omit<FolderChatMessage, 'id' | 'createdAt'>) => {
    await sendFolderChatMessage(folderId, msg);
  };

  const handleToggleMessageDone = async (folderId: string, messageId: string, isDone: boolean) => {
    await toggleMessageDoneStatus(folderId, messageId, isDone);
  };

  const handleShareWhatsApp = (folder: ProjectFolder) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vasthusilpy.com';
    const link = `${baseUrl}?clientMobile=${encodeURIComponent(folder.clientMobile)}&folderId=${encodeURIComponent(folder.id)}`;
    const text = `🏢 *VASTHUSILPY, KERALASSERY*\n\n` +
      `Hello ${folder.clientName},\n` +
      `Your project vault *${folder.folderName}* is accessible online.\n\n` +
      `📱 *User ID:* ${folder.clientMobile}\n` +
      `🔑 *Password:* ${folder.customPassword}\n\n` +
      `🔗 *Access Portal:*\n${link}\n\n` +
      `📞 Vasthusilpy: 9567627277 / 9747995961`;

    const cleanNum = folder.clientMobile.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanNum}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const visibleFolders = isClient && session?.folderId ? folders.filter(f => f.id === session.folderId) : folders;
  const totalFilesCount = folders.reduce((sum, f) => sum + (f.files?.length || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#071120] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-red-500 selection:text-white">
      
      {/* Precision Blueprint Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-25 dark:opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] -z-10" />

      {/* Global Navbar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        session={session}
        onOpenGateway={handleOpenGateway}
        onOpenAdminLogin={() => handleOpenGateway('admin')}
        onOpenClientLogin={() => handleOpenGateway('client')}
        onLogout={handleLogout}
        onOpenDataVault={() => setIsDataVaultOpen(true)}
        onOpenAIAssistant={() => setIsAIVasthuOpen(true)}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Split Workspace Layout with Auto-Collapsible Left Side Dock */}
      <div className="flex-1 flex w-full min-h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Auto-Collapsible Dock */}
        <AppSidebar
          activeTab={dashboardTab}
          onSelectTab={(tab) => {
            setDashboardTab(tab);
            setActiveTab('folders');
            if (tab === 'ai-vasthu') setIsAIVasthuOpen(true);
            if (tab === 'drive-sync') setIsDataVaultOpen(true);
          }}
          session={session}
          isAdmin={isAdmin}
          onOpenGateway={handleOpenGateway}
          onLogout={handleLogout}
          onOpenCreateFolder={() => setIsCreateModalOpen(true)}
          onOpenDriveSync={() => setIsDataVaultOpen(true)}
          onOpenAIVasthu={() => setIsAIVasthuOpen(true)}
          totalVaultsCount={visibleFolders.length}
          totalFilesCount={totalFilesCount}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#EEF4FB] dark:bg-[#0B1528]">

          {/* TAB: SERVICES (From Top Nav) */}
          {activeTab === 'services' && (
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <CompanyServicesSection
                onOpenCreateFolder={() => setIsCreateModalOpen(true)}
                onOpenAIVasthu={() => setIsAIVasthuOpen(true)}
              />
            </main>
          )}

          {/* TAB: ABOUT / COMPANY INFO (From Top Nav) */}
          {activeTab === 'about' && (
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                <div className="max-w-3xl space-y-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 uppercase tracking-widest">
                    About Vasthusilpy
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    VASTHUSILPY PLANS 3D DESIGNS & VASTU CONSULTATION
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Based in <strong>Keralassery, Palakkad</strong>, Vasthusilpy specializes in cutting-edge residential and commercial architectural design, precision 2D CAD drafting, ultra-realistic 3D walkthrough rendering, and traditional Vasthu Shastra consultation.
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    We empower our clients with a dedicated cloud-synced project vault, enabling real-time access to building permits, structural drawings, and direct voice discussions with our architectural team.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-400 block">Chief Architect & Consultant:</span>
                    <span className="font-bold text-base text-slate-900 dark:text-white">Deepak C</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-400 block">Direct Contact:</span>
                    <span className="font-bold text-base text-slate-900 dark:text-white font-mono">9567627277 / 9747995961</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-400 block">Office Location:</span>
                    <span className="font-bold text-base text-slate-900 dark:text-white">Keralassery, Palakkad - 678641</span>
                  </div>
                </div>
              </div>

              <CompanyServicesSection />
            </main>
          )}

          {/* TAB: PROJECT FOLDERS & VAULTS (MAIN WORKSPACE) */}
          {activeTab === 'folders' && (
            <div className="flex-1 flex flex-col">
              
              {/* Hero Banner (Top Animated Media Showcase when on My Cloud) */}
              {dashboardTab === 'my-cloud' && (
                <div className="w-full px-3 sm:px-6 lg:px-8 pt-4 pb-4 space-y-6">
                  <HeroAutoCarousel
                    folders={folders}
                    isAdmin={isAdmin}
                    onOpenCreateFolder={() => setIsCreateModalOpen(true)}
                    onOpenGateway={handleOpenGateway}
                    onOpenClientLogin={() => handleOpenGateway('client')}
                    onOpenAdminLogin={() => handleOpenGateway('admin')}
                    onExploreFolders={() => {
                      const el = document.getElementById('public-portfolio-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onPreviewFile={(file) => setPreviewFile(file)}
                  />

                  {/* Public View-Only Portfolio Section with Screen-Size Media Stream and Password Gated Download & Share */}
                  <div id="public-portfolio-section" className="w-full min-h-[90vh]">
                    <HomePagePortfolio
                      folders={folders}
                      session={session}
                      isAdmin={isAdmin}
                      onPreviewFile={(file) => setPreviewFile(file)}
                      onOpenFolderDetail={(f) => setActiveFolderDetail(f)}
                      onOpenClientLogin={() => handleOpenGateway('client')}
                      onOpenAdminLogin={() => handleOpenGateway('admin')}
                      onShareFolder={(f) => handleShareWhatsApp(f)}
                    />
                  </div>
                </div>
              )}

              {/* Comprehensive Dashboard with Left Dock Tab Views */}
              <div id="project-dashboard-section" className="flex-1 flex flex-col">
                <ProjectDashboard
                  folders={visibleFolders}
                  activeTab={dashboardTab}
                  onSelectTab={(tab) => {
                    setDashboardTab(tab);
                    if (tab === 'ai-vasthu') setIsAIVasthuOpen(true);
                    if (tab === 'drive-sync') setIsDataVaultOpen(true);
                  }}
                  isAdmin={isAdmin}
                  onOpenFolder={(f) => setActiveFolderDetail(f)}
                  onOpenVisitingCard={(f) => setActiveVisitingCard(f)}
                  onEditFolder={isAdmin ? (f) => setEditingFolder(f) : undefined}
                  onDeleteFolder={isAdmin ? (f) => setFolderToDelete(f) : undefined}
                  onOpenCreateFolder={() => setIsCreateModalOpen(true)}
                  onShareWhatsApp={handleShareWhatsApp}
                  onEditFile={isAdmin ? (folder, file) => setFileToEdit({ folder, file }) : undefined}
                  onDeleteFile={isAdmin ? (folderId, fileId, fileName) => setDirectFileToDelete({ folderId, fileId, fileName }) : undefined}
                  onUploadFile={handleUploadFile}
                  onUploadBatchFiles={handleUploadBatchFiles}
                  onPreviewFile={(file) => setPreviewFile(file)}
                  onOpenDriveSync={() => setIsDataVaultOpen(true)}
                  onOpenAIVasthu={() => setIsAIVasthuOpen(true)}
                />
              </div>

              {/* Company Services Strip at Bottom of My Cloud */}
              {dashboardTab === 'my-cloud' && (
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <CompanyServicesSection
                    onOpenCreateFolder={() => setIsCreateModalOpen(true)}
                    onOpenAIVasthu={() => setIsAIVasthuOpen(true)}
                  />
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Global Modals */}

      {/* 1. Folder Detail Modal */}
      {activeFolderDetail && (
        <FolderDetailModal
          folder={activeFolderDetail}
          isOpen={!!activeFolderDetail}
          isAdmin={isAdmin}
          onClose={() => setActiveFolderDetail(null)}
          onUploadFile={handleUploadFile}
          onUploadBatchFiles={handleUploadBatchFiles}
          onUpdateFile={handleUpdateFile}
          onDeleteFile={handleDeleteFile}
          onEditFolder={isAdmin ? (f) => setEditingFolder(f) : undefined}
          onDeleteFolder={isAdmin ? (fId) => handleConfirmDeleteFolder(fId) : undefined}
          onSetCoverImage={handleSetCoverImage}
          onAddReview={handleAddReview}
          onSendMessage={handleSendMessage}
          onToggleMessageDone={handleToggleMessageDone}
          onResetPassword={handleResetPassword}
          onOpenVisitingCard={(f) => {
            setActiveFolderDetail(null);
            setActiveVisitingCard(f);
          }}
        />
      )}

      {/* 2. Visiting Card Generator Modal */}
      {activeVisitingCard && (
        <VisitingCardModal
          folder={activeVisitingCard}
          isOpen={!!activeVisitingCard}
          onClose={() => setActiveVisitingCard(null)}
          onUpdateTheme={async (newTheme) => {
            const updated = { ...activeVisitingCard, cardTheme: newTheme };
            setActiveVisitingCard(updated);
            await saveProjectFolder(updated);
          }}
        />
      )}

      {/* 3. Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* 3b. Edit Folder Modal (Admin Only) */}
      <EditFolderModal
        folder={editingFolder}
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={isAdmin ? (fId) => handleConfirmDeleteFolder(fId) : undefined}
      />

      {/* 3c. Edit File Modal (Directly from Dashboard Files Manager) */}
      {fileToEdit && (
        <EditFileModal
          file={fileToEdit.file}
          isOpen={!!fileToEdit}
          onClose={() => setFileToEdit(null)}
          onUpdateFile={async (fileId, updates) => {
            await handleUpdateFile(fileToEdit.folder.id, fileId, updates);
            setFileToEdit(null);
          }}
          onDeleteFile={async (fileId) => {
            await handleDeleteFile(fileToEdit.folder.id, fileId);
            setFileToEdit(null);
          }}
        />
      )}

      {/* 4. Delete Folder Confirmation Modal (Zero window.confirm) */}
      {folderToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Delete Project Folder?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {folderToDelete.folderName}
              </div>
              <div className="text-xs text-slate-500">
                Client: {folderToDelete.clientName} ({folderToDelete.clientMobile})
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 font-semibold pt-1">
                Vault contains {folderToDelete.files?.length || 0} file(s)
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this project folder, along with all uploaded blueprints, 3D renderings, and client access credentials?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteFolder(folderToDelete.id)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4b. Delete File Confirmation Modal (From Dashboard) */}
      {directFileToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">Delete File?</h4>
                <p className="text-xs text-slate-500">Remove attachment permanently</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong>&quot;{directFileToDelete.fileName}&quot;</strong> from this project vault?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDirectFileToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { folderId, fileId } = directFileToDelete;
                  setDirectFileToDelete(null);
                  await handleDeleteFile(folderId, fileId);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4c. Fullscreen File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-5xl w-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-bold text-sm text-white">{previewFile.name}</h4>
                  <span className="text-[10px] text-slate-400">{previewFile.category} • {previewFile.fileSize}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = previewFile;
                    setPreviewFile(null);
                    setEditorFile({ file: target });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Edit / Rotate / Crop</span>
                </button>
                <a
                  href={previewFile.fileUrl}
                  download={previewFile.name}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[360px]">
              <img
                src={previewFile.fileUrl}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Clear All Folders (Reset to Clean Slate) Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Reset to Clean Slate?</h3>
                <p className="text-xs text-slate-500">Purge all project folders</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will remove all current project folders and attachments from your local storage and cloud database so you can start creating from scratch.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MAIN ACCESS GATEWAY MODAL (ADMIN / CLIENT SELECTOR & GATEKEEPER) */}
      <MainLoginGatewayModal
        isOpen={!session && !isGuestMode ? true : isGatewayLoginOpen}
        isLockedGateway={!session && !isGuestMode}
        initialRole={gatewayInitialRole}
        folders={folders}
        onClose={() => {
          if (!session && !isGuestMode) {
            setIsGuestMode(true);
          }
          setIsGatewayLoginOpen(false);
        }}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onClientLoginSuccess={handleClientLoginSuccess}
        onCreateFolder={handleCreateFolder}
        onExploreGuest={() => {
          setIsGuestMode(true);
          setIsGatewayLoginOpen(false);
          setActiveTab('folders');
        }}
      />

      {/* 7. Admin Login Modal (Direct) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* 8. Client Login Modal (Direct) */}
      <ClientLoginModal
        isOpen={isClientLoginOpen}
        folders={folders}
        onClose={() => setIsClientLoginOpen(false)}
        onLoginSuccess={handleClientLoginSuccess}
        onCreateFolder={handleCreateFolder}
      />

      {/* 9. Google Drive / Data Vault Sync Modal */}
      <DataVaultSyncModal
        isOpen={isDataVaultOpen}
        folders={folders}
        onClose={() => setIsDataVaultOpen(false)}
        onSyncComplete={() => {}}
      />

      {/* 10. AI Vasthu & Blueprint Scanner Modal */}
      <AIVasthuModal
        isOpen={isAIVasthuOpen}
        onClose={() => setIsAIVasthuOpen(false)}
      />

      {/* 11. PHOTO & DOC STUDIO EDITOR (ROTATE, CROP, SCANNER, WATERMARK) */}
      {(editorFile || (isCoverEditorOpen && editorFolder)) && (
        <PhotoDocEditorModal
          isOpen={!!editorFile || (isCoverEditorOpen && !!editorFolder)}
          file={editorFile?.file}
          folder={editorFile?.folder || editorFolder}
          isCoverEditor={isCoverEditorOpen}
          initialImageUrl={isCoverEditorOpen ? editorFolder?.coverImageUrl : editorFile?.file.fileUrl}
          initialFileName={isCoverEditorOpen ? `${editorFolder?.folderName}_Cover.jpg` : editorFile?.file.name}
          onClose={() => {
            setEditorFile(null);
            setIsCoverEditorOpen(false);
            setEditorFolder(null);
          }}
          onSaveFile={async (fileId, updatedUrl, updatedName) => {
            if (editorFile?.folder) {
              await handleUpdateFile(editorFile.folder.id, fileId, { fileUrl: updatedUrl, name: updatedName });
            }
          }}
          onSaveAsNewFile={async (newFileData) => {
            if (editorFile?.folder) {
              await handleUploadFile(editorFile.folder.id, newFileData);
            }
          }}
          onSetAsCover={async (folderId, coverUrl) => {
            await handleSetCoverImage(folderId, coverUrl);
          }}
        />
      )}

      {/* Global Footer */}
      <Footer
        onOpenDataVault={() => setIsDataVaultOpen(true)}
        onOpenAdminLogin={() => handleOpenGateway('admin')}
        onOpenClientLogin={() => handleOpenGateway('client')}
      />

    </div>
  );
}
