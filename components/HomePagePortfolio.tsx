'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { AuthSession } from '@/lib/storage';
import { ADMIN_CONFIG } from '@/lib/auth';
import {
  MediaStreamItem,
  getStoredMediaStreamItems,
  subscribeToMediaStreamUpdates
} from '@/lib/mediaStreamStorage';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Download, 
  Share2, 
  Eye, 
  Lock, 
  Unlock, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  X,
  KeyRound,
  FileCheck,
  Building2,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Layers,
  Film,
  Zap
} from 'lucide-react';

interface HomePagePortfolioProps {
  folders: ProjectFolder[];
  session: AuthSession | null;
  isAdmin: boolean;
  onPreviewFile: (file: ProjectFile) => void;
  onOpenFolderDetail?: (folder: ProjectFolder) => void;
  onOpenClientLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onShareFolder?: (folder: ProjectFolder) => void;
}

interface FlattenedMediaItem {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: string;
  type: 'video' | 'image' | 'doc';
  category: string;
  folder: ProjectFolder;
  file: ProjectFile;
}

export const HomePagePortfolio: React.FC<HomePagePortfolioProps> = ({
  folders = [],
  session,
  isAdmin,
  onPreviewFile,
  onOpenFolderDetail,
  onOpenClientLogin,
  onOpenAdminLogin,
  onShareFolder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(folders[0]?.id || null);
  const [isScreenSizeFullscreen, setIsScreenSizeFullscreen] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState<number>(4500); // 4.5s
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  
  // Per-folder animated cycling index map (for folder cards preview in grid)
  const [folderMediaIndices, setFolderMediaIndices] = useState<Record<string, number>>({});

  // Unlock Modal State
  const [unlockModalData, setUnlockModalData] = useState<{
    folder: ProjectFolder;
    file?: ProjectFile;
    action: 'download' | 'share';
  } | null>(null);

  const [inputUserId, setInputUserId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  // Unlocked folders in current session memory
  const [unlockedFolderIds, setUnlockedFolderIds] = useState<string[]>([]);

  // Share Dialog state for unlocked files/folders
  const [activeShareTarget, setActiveShareTarget] = useState<{
    folder: ProjectFolder;
    file?: ProjectFile;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Categories list (Audio removed)
  const categories = [
    'All',
    'Building Plans',
    '3D Design',
    'Video Rendering Works',
    'Vasthu Consultation',
    'Land Survey',
    'Building Permit'
  ];

  // Media stream synchronized state
  const [streamItems, setStreamItems] = useState<MediaStreamItem[]>([]);

  // Subscribe to media stream updates (so deleted files immediately vanish here as well)
  useEffect(() => {
    setStreamItems(getStoredMediaStreamItems(folders));

    const unsubscribe = subscribeToMediaStreamUpdates(folders, (updated) => {
      setStreamItems(updated);
      setActiveMediaIndex((prev) => (prev >= updated.length ? Math.max(0, updated.length - 1) : prev));
    });

    return unsubscribe;
  }, [folders]);

  // Flatten all media strictly from the authoritative Media Stream playlist
  const allMediaItems: FlattenedMediaItem[] = useMemo(() => {
    const items: FlattenedMediaItem[] = [];

    streamItems.forEach((streamItem) => {
      // Find matching folder or construct display folder
      const matchedFolder = folders.find((f) => f.folderName === streamItem.folderName || f.files.some((fi) => fi.id === streamItem.id));
      const fallbackFolder: ProjectFolder = matchedFolder || {
        id: 'vault_' + streamItem.id,
        folderName: streamItem.folderName || 'Vasthusilpy Architectural Studio',
        clientName: streamItem.clientName || 'Vasthusilpy Portfolio',
        clientMobile: '9747995961',
        customPassword: 'vault',
        projectCategory: streamItem.category,
        projectLocation: 'Keralassery, Palakkad',
        createdAt: streamItem.addedAt || '2026-03-20',
        updatedAt: streamItem.addedAt || '2026-03-20',
        files: [],
        reviews: [],
        chatMessages: []
      };

      const matchedFile = matchedFolder?.files?.find((fi) => fi.id === streamItem.id);
      const fallbackFile: ProjectFile = matchedFile || {
        id: streamItem.id,
        name: streamItem.name,
        fileUrl: streamItem.fileUrl,
        fileSize: streamItem.fileSize || '4.5 MB',
        uploadedAt: streamItem.addedAt || '2026-03-20',
        uploadedBy: 'Deepak C',
        type: streamItem.type === 'video' ? 'video' : '3d-render',
        category: streamItem.category
      };

      items.push({
        id: streamItem.id,
        name: streamItem.name,
        fileUrl: streamItem.fileUrl,
        fileSize: streamItem.fileSize || '4.5 MB',
        type: streamItem.type === 'video' ? 'video' : 'image',
        category: streamItem.category,
        folder: fallbackFolder,
        file: fallbackFile
      });
    });

    return items;
  }, [streamItems, folders]);

  // Master Slideshow timer for dynamic changing ("every image & video comes and goes automatically")
  useEffect(() => {
    if (!isAutoPlaying || allMediaItems.length <= 1) return;

    setProgress(0);
    const intervalTick = 50; // update progress every 50ms
    const totalTicks = slideshowSpeed / intervalTick;
    let currentTick = 0;

    const timer = setInterval(() => {
      currentTick += 1;
      setProgress(Math.min((currentTick / totalTicks) * 100, 100));

      if (currentTick >= totalTicks) {
        currentTick = 0;
        setActiveMediaIndex((prev) => (prev + 1) % allMediaItems.length);
      }
    }, intervalTick);

    return () => clearInterval(timer);
  }, [isAutoPlaying, allMediaItems.length, slideshowSpeed, activeMediaIndex]);

  // Per-folder cycling timer: every 3.8s, advances the active preview image/video in each folder card in the grid
  useEffect(() => {
    if (folders.length === 0) return;

    const folderCycleTimer = setInterval(() => {
      setFolderMediaIndices((prev) => {
        const nextState = { ...prev };
        folders.forEach((f) => {
          const count = f.files?.length || 0;
          if (count > 1) {
            nextState[f.id] = ((nextState[f.id] || 0) + 1) % count;
          }
        });
        return nextState;
      });
    }, 3800);

    return () => clearInterval(folderCycleTimer);
  }, [folders]);

  const currentMedia = allMediaItems[activeMediaIndex] || allMediaItems[0];

  // Filter folders
  const filteredFolders = useMemo(() => {
    return folders.filter((folder) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        folder.folderName.toLowerCase().includes(q) ||
        folder.clientName.toLowerCase().includes(q) ||
        (folder.projectLocation && folder.projectLocation.toLowerCase().includes(q)) ||
        folder.files.some(f => f.name.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'All' || 
        folder.projectCategory === selectedCategory ||
        folder.files.some(f => f.category?.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [folders, searchQuery, selectedCategory]);

  // Check if a folder is unlocked for downloading and sharing
  const isFolderUnlocked = (folderId: string) => {
    if (isAdmin) return true;
    if (session?.role === 'client' && session.folderId === folderId) return true;
    if (unlockedFolderIds.includes(folderId)) return true;
    return false;
  };

  const triggerDirectDownload = (file: ProjectFile) => {
    const a = document.createElement('a');
    a.href = file.fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle user requesting download
  const handleRequestDownload = (folder: ProjectFolder, file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolderUnlocked(folder.id)) {
      triggerDirectDownload(file);
    } else {
      setUnlockModalData({ folder, file, action: 'download' });
      setInputUserId(folder.clientMobile ? `${folder.clientMobile.slice(0, 3)}****` : '');
      setInputPassword('');
      setUnlockError('');
      setUnlockSuccess(false);
    }
  };

  // Handle user requesting share
  const handleRequestShare = (folder: ProjectFolder, file: ProjectFile | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolderUnlocked(folder.id)) {
      setActiveShareTarget({ folder, file });
    } else {
      setUnlockModalData({ folder, file, action: 'share' });
      setInputUserId('');
      setInputPassword('');
      setUnlockError('');
      setUnlockSuccess(false);
    }
  };

  // Verify Unlock Credentials
  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockModalData) return;

    const targetFolder = unlockModalData.folder;
    const trimmedId = inputUserId.trim();
    const trimmedPass = inputPassword.trim();

    // Check against folder credentials or admin credentials
    const isClientMatch = (
      (trimmedId === targetFolder.clientMobile || trimmedId.endsWith(targetFolder.clientMobile.slice(-4))) &&
      trimmedPass === targetFolder.customPassword
    );

    const isAdminMatch = (
      (trimmedId === ADMIN_CONFIG.mobile || trimmedId === ADMIN_CONFIG.secondaryMobile || trimmedId === ADMIN_CONFIG.thirdMobile || trimmedId === '9747995961' || trimmedId === '9567627277' || trimmedId === 'admin') &&
      (trimmedPass === '9747' || trimmedPass === 'deepak' || trimmedPass === 'admin')
    );

    if (isClientMatch || isAdminMatch) {
      setUnlockSuccess(true);
      setUnlockedFolderIds(prev => [...prev, targetFolder.id]);
      
      setTimeout(() => {
        const action = unlockModalData.action;
        const file = unlockModalData.file;
        setUnlockModalData(null);

        if (action === 'download' && file) {
          triggerDirectDownload(file);
        } else if (action === 'share') {
          setActiveShareTarget({ folder: targetFolder, file });
        }
      }, 600);
    } else {
      setUnlockError('Incorrect User ID or Password. Please enter the client mobile number and custom password configured for this project vault.');
    }
  };

  // Get File Badge Style
  const getFileBadge = (file: ProjectFile) => {
    if (file.type === 'video' || file.category?.toLowerCase().includes('video')) {
      return {
        icon: <Video className="w-4 h-4 text-rose-500" />,
        label: 'Video Walkthrough',
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      };
    } else if (file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image')) {
      return {
        icon: <ImageIcon className="w-4 h-4 text-indigo-500" />,
        label: '3D Render / Photo',
        bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      };
    } else {
      return {
        icon: <FileText className="w-4 h-4 text-cyan-500" />,
        label: file.name.endsWith('.dwg') ? 'CAD Drawing' : 'Blueprint / Doc',
        bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
      };
    }
  };

  return (
    <section 
      ref={sectionRef}
      className={`w-full transition-all duration-300 ${
        isScreenSizeFullscreen 
          ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white p-4 sm:p-8' 
          : 'py-4 space-y-6'
      }`}
    >
      
      {/* ========================================================================= */}
      {/* 1. SCREEN-SIZE IMMERSIVE DYNAMIC SHOWCASE (EVERY IMAGE & VIDEO COMES & GOES) */}
      {/* ========================================================================= */}
      <div className="w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-2xl relative">
        
        {/* Top Header Bar inside Stage */}
        <div className="px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                  Live Architectural Showcase
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                  <Eye className="w-3.5 h-3.5" /> View Only Mode
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Public Architectural Portfolio & 3D Walkthrough Stream
              </h2>
            </div>
          </div>

          {/* Top Controls: Slideshow Speed, Play/Pause, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-2xl p-1 border border-slate-700 text-xs text-slate-300">
              <span className="px-2 font-medium text-[11px] text-slate-400">Speed:</span>
              {[
                { label: '3s', val: 3000 },
                { label: '5s', val: 5000 },
                { label: '8s', val: 8000 }
              ].map((sp) => (
                <button
                  key={sp.val}
                  onClick={() => setSlideshowSpeed(sp.val)}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition ${
                    slideshowSpeed === sp.val 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Play / Pause */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-2.5 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold ${
                isAutoPlaying 
                  ? 'bg-red-600/90 text-white hover:bg-red-600 shadow-md shadow-red-600/20' 
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
              title={isAutoPlaying ? 'Pause Automated Stream' : 'Resume Automated Stream'}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden md:inline">{isAutoPlaying ? 'Playing' : 'Paused'}</span>
            </button>

            {/* Screen-size Fullscreen Toggle */}
            <button
              onClick={() => setIsScreenSizeFullscreen(!isScreenSizeFullscreen)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition flex items-center gap-1.5 text-xs font-bold"
              title={isScreenSizeFullscreen ? 'Exit Screen-Size View' : 'Maximize to Screen-Size'}
            >
              {isScreenSizeFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-blue-400" />}
              <span className="hidden md:inline">{isScreenSizeFullscreen ? 'Exit Fullscreen' : 'Screen Size'}</span>
            </button>

            {/* Client Login CTA */}
            {onOpenClientLogin && (
              <button
                onClick={onOpenClientLogin}
                className="px-3.5 py-2.5 rounded-2xl bg-[#0B3B7B] hover:bg-[#07244C] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
                <span>Client Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Media Presentation Stage (Height scales to screen size) */}
        <div className={`relative w-full ${isScreenSizeFullscreen ? 'h-[75vh]' : 'h-[500px] sm:h-[600px] lg:h-[660px]'} bg-black overflow-hidden flex items-center justify-center select-none`}>
          
          {/* Animated Media Transition ("comes and goes automatically changing") */}
          <AnimatePresence mode="wait">
            {currentMedia && (
              <motion.div
                key={currentMedia.id + activeMediaIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full flex items-center justify-center"
              >
                {currentMedia.type === 'video' ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    <video
                      ref={videoRef}
                      src={currentMedia.fileUrl}
                      autoPlay
                      muted={isMuted}
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Video Mute/Unmute Float */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute top-6 right-6 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition z-30"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {/* Ambient Glow Backdrop */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-40 scale-110"
                      style={{ backgroundImage: `url(${currentMedia.fileUrl})` }}
                    />
                    
                    {/* Main Architectural Image */}
                    <img 
                      src={currentMedia.fileUrl} 
                      alt={currentMedia.name}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-2xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                )}

                {/* Subtle Cinematic Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none z-10" />

              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Chevron Buttons */}
          <button
            onClick={() => {
              setActiveMediaIndex((prev) => (prev - 1 + allMediaItems.length) % allMediaItems.length);
              setProgress(0);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-white/10 backdrop-blur-md transition shadow-2xl hover:scale-110"
            title="Previous Media"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              setActiveMediaIndex((prev) => (prev + 1) % allMediaItems.length);
              setProgress(0);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white border border-white/10 backdrop-blur-md transition shadow-2xl hover:scale-110"
            title="Next Media"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Media Info Overlay (Bottom-Left) */}
          {currentMedia && (
            <div className="absolute bottom-6 left-6 right-6 z-30 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
              <div className="max-w-2xl space-y-2 bg-slate-950/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1.5 shadow-md">
                    {currentMedia.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {currentMedia.category}
                  </span>
                  
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Folder className="w-3 h-3 text-amber-400" />
                    {currentMedia.folder.folderName}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                    {activeMediaIndex + 1} / {allMediaItems.length}
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight line-clamp-2">
                  {currentMedia.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Client: <strong>{currentMedia.folder.clientName}</strong></span>
                  {currentMedia.folder.projectLocation && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentMedia.folder.projectLocation}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Action Buttons for active slide */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start md:self-end">
                <button
                  onClick={() => onPreviewFile(currentMedia.file)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>View High-Res</span>
                </button>

                <button
                  onClick={(e) => handleRequestDownload(currentMedia.folder, currentMedia.file, e)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  {isFolderUnlocked(currentMedia.folder.id) ? (
                    <Download className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{isFolderUnlocked(currentMedia.folder.id) ? 'Download' : 'Unlock Download'}</span>
                </button>

                <button
                  onClick={(e) => handleRequestShare(currentMedia.folder, currentMedia.file, e)}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center shadow-lg"
                  title="Share Media"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Animated Countdown Progress Bar at Stage Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80 z-40">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

        </div>

        {/* Filmstrip Thumbnail Navigator at Bottom */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 overflow-x-auto scrollbar-none flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex-shrink-0 flex items-center gap-1">
            <Film className="w-3.5 h-3.5 text-red-500" />
            Media Stream:
          </span>
          {allMediaItems.map((item, idx) => {
            const isSelected = idx === activeMediaIndex;
            return (
              <button
                key={item.id + idx}
                onClick={() => {
                  setActiveMediaIndex(idx);
                  setProgress(0);
                }}
                className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition duration-200 group ${
                  isSelected 
                    ? 'border-red-500 ring-2 ring-red-500/50 scale-105 shadow-lg' 
                    : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-rose-500">
                    <Video className="w-5 h-5" />
                  </div>
                ) : (
                  <img 
                    src={item.fileUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                  />
                )}
                {isSelected && (
                  <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. PORTFOLIO SECTION EXPLORER & FOLDERS LIST */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Project Vaults Directory
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
                <Lock className="w-3 h-3 text-amber-500" />
                Mobile Number & Password Protected Downloads
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Architectural Folders & 2D/3D Drawings
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              Select any project folder to inspect drawings, architectural sections, and 3D perspectives in view-only mode. Each folder automatically cycles through its attached media.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenClientLogin && (
              <button
                onClick={onOpenClientLogin}
                className="px-4 py-2.5 rounded-2xl bg-[#0B3B7B] hover:bg-[#07244C] text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-900/20"
              >
                <KeyRound className="w-4 h-4 text-emerald-300" />
                <span>Client Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search portfolio & files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D70E2] transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PORTFOLIO FOLDERS GRID (EACH CARD CYCLES ATTACHED IMAGES & VIDEOS) */}
      {/* ========================================================================= */}
      {filteredFolders.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {searchQuery ? 'No matching architectural projects found' : 'No project folders published yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search terms or filter category to find project files.'
              : 'Admin or client can create folders with custom passwords to publish blueprints and 3D designs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFolders.map((folder) => {
            const isUnlocked = isFolderUnlocked(folder.id);
            const isExpanded = expandedFolderId === folder.id;
            const totalFiles = folder.files?.length || 0;
            
            // Get active cycling file for this folder card preview
            const currentFolderIndex = folderMediaIndices[folder.id] || 0;
            const activeFolderFile = folder.files && folder.files.length > 0
              ? folder.files[currentFolderIndex % folder.files.length]
              : null;

            const isImg = activeFolderFile && (activeFolderFile.type === '3d-render' || activeFolderFile.type === 'photo' || activeFolderFile.fileUrl?.startsWith('data:image') || activeFolderFile.name.match(/\.(jpg|jpeg|png|webp|avif)$/i));
            const isVid = activeFolderFile && (activeFolderFile.type === 'video' || activeFolderFile.category?.toLowerCase().includes('video') || activeFolderFile.name.endsWith('.mp4'));

            return (
              <div 
                key={folder.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Folder Header Banner */}
                <div 
                  onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}
                  className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    
                    {/* Dynamic Cycling Media Thumbnail for Folder */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border-2 border-slate-300 dark:border-slate-700 shadow-md">
                      <AnimatePresence mode="wait">
                        {activeFolderFile && (
                          <motion.div
                            key={activeFolderFile.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full"
                          >
                            {isVid ? (
                              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-rose-400">
                                <Video className="w-6 h-6" />
                              </div>
                            ) : isImg ? (
                              <img
                                src={activeFolderFile.fileUrl}
                                alt={activeFolderFile.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-[#0B3B7B] flex items-center justify-center text-white">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Small Live Auto-Cycle Badge */}
                      {totalFiles > 1 && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono text-white font-bold">
                          {(currentFolderIndex % totalFiles) + 1}/{totalFiles}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-base sm:text-xl text-slate-900 dark:text-white">
                          {folder.folderName}
                        </h3>
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <Unlock className="w-3 h-3" />
                            Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <Lock className="w-3 h-3" />
                            View Only
                          </span>
                        )}
                        {folder.projectCategory && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#1D70E2] dark:text-blue-400">
                            {folder.projectCategory}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Client: <strong>{folder.clientName}</strong>
                        </span>
                        {folder.projectLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {folder.projectLocation}
                          </span>
                        )}
                        <span className="font-mono text-slate-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          {totalFiles} Media Files Auto-Cycling
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Folder Quick Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleRequestShare(folder, undefined, e)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-sm"
                      title={isUnlocked ? 'Share Folder' : 'Unlock to Share'}
                    >
                      {isUnlocked ? <Share2 className="w-3.5 h-3.5 text-blue-500" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B3B7B] hover:bg-[#07244C] text-white transition flex items-center gap-1.5 shadow-md shadow-blue-900/10"
                    >
                      <span>{isExpanded ? 'Collapse' : 'View Drawings'}</span>
                    </button>
                  </div>
                </div>

                {/* Folder Files Body (View Only with Protected Actions) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-4">
                    {folder.files && folder.files.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {folder.files.map((file) => {
                          const badge = getFileBadge(file);
                          const isFileImg = file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image');
                          const isFileVid = file.type === 'video' || file.category?.toLowerCase().includes('video');

                          return (
                            <div
                              key={file.id}
                              className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 p-4 flex flex-col justify-between space-y-3 hover:border-[#1D70E2] transition group"
                            >
                              {/* File Media Preview Thumbnail */}
                              <div 
                                onClick={() => onPreviewFile(file)}
                                className="relative w-full h-40 rounded-xl bg-slate-200 dark:bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer group-hover:shadow-inner transition"
                              >
                                {isFileImg ? (
                                  <img 
                                    src={file.fileUrl} 
                                    alt={file.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80';
                                    }}
                                  />
                                ) : isFileVid ? (
                                  <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                                    <div className="w-10 h-10 rounded-full bg-rose-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                                      <Video className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wider text-rose-200">3D Video Walkthrough</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                                    <FileText className="w-10 h-10 text-[#0B3B7B] dark:text-blue-400 mb-1" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-full">
                                      {file.name.endsWith('.dwg') ? 'CAD Structural Plan' : 'Building Blueprint PDF'}
                                    </span>
                                  </div>
                                )}

                                {/* View-only overlay button */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                  <span className="px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1 shadow-lg">
                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    View Fullscreen
                                  </span>
                                </div>

                                {/* Watermark Pill */}
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider">
                                  Vasthusilpy
                                </span>
                              </div>

                              {/* File Info */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                                    {badge.icon}
                                    {badge.label}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">{file.fileSize}</span>
                                </div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate" title={file.name}>
                                  {file.name}
                                </h4>
                              </div>

                              {/* Action Bar (View Only for Public, Protected Download & Share) */}
                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                                <button
                                  onClick={() => onPreviewFile(file)}
                                  className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>View</span>
                                </button>

                                <button
                                  onClick={(e) => handleRequestDownload(folder, file, e)}
                                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                                    isUnlocked
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                  }`}
                                  title={isUnlocked ? 'Download File' : 'Enter User ID & Password to Download'}
                                >
                                  {isUnlocked ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                  <span>Download</span>
                                </button>

                                <button
                                  onClick={(e) => handleRequestShare(folder, file, e)}
                                  className={`p-1.5 rounded-xl border transition ${
                                    isUnlocked
                                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 text-blue-600 dark:text-blue-400'
                                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800'
                                  }`}
                                  title={isUnlocked ? 'Share File' : 'Enter User ID & Password to Share'}
                                >
                                  {isUnlocked ? <Share2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        No files currently uploaded to this vault.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECURITY UNLOCK MODAL (USER ID & PASSWORD GATED DOWNLOAD & SHARE) */}
      {/* ========================================================================= */}
      {unlockModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 block">
                    Security Verification
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Unlock {unlockModalData.action === 'download' ? 'Download' : 'Share'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setUnlockModalData(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Target Project Vault:</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                📁 {unlockModalData.folder.folderName}
              </div>
              {unlockModalData.file && (
                <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate">
                  📄 {unlockModalData.file.name} ({unlockModalData.file.fileSize})
                </div>
              )}
            </div>

            {/* Unlock Form */}
            <form onSubmit={handleVerifyUnlock} className="space-y-4">
              
              {/* User ID Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>User ID (Client Mobile Number)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={inputUserId}
                  onChange={(e) => setInputUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-red-500" />
                  <span>Custom Vault Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter vault password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D70E2]"
                />
              </div>

              {/* Error Message */}
              {unlockError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{unlockError}</span>
                </div>
              )}

              {/* Success Message */}
              {unlockSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Credentials verified! Unlocking {unlockModalData.action}...</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUnlockModalData(null)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unlockSuccess}
                  className="w-2/3 py-3 rounded-2xl bg-[#0B3B7B] hover:bg-[#07244C] text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4 text-emerald-300" />
                  <span>Verify & Unlock</span>
                </button>
              </div>

            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                Architect / Owner assistance: <strong>📞 9747995961 (Deepak C)</strong>
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SHARE MODAL (FOR UNLOCKED FILES & FOLDERS) */}
      {/* ========================================================================= */}
      {activeShareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                    Instant Share
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Share Vault Drawings
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveShareTarget(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                📁 {activeShareTarget.folder.folderName}
              </div>
              {activeShareTarget.file && (
                <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                  📄 {activeShareTarget.file.name}
                </div>
              )}
              <div className="text-slate-400 text-[11px]">
                Client: {activeShareTarget.folder.clientName} ({activeShareTarget.folder.clientMobile})
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              {/* WhatsApp Share Button */}
              <button
                onClick={() => {
                  const shareText = `*VASTHUSILPY PLANS 3D DESIGNS*\n\n📁 Project Vault: ${activeShareTarget.folder.folderName}\n👤 Client: ${activeShareTarget.folder.clientName}\n📍 Location: ${activeShareTarget.folder.projectLocation || 'Palakkad'}\n\n📱 Access Link: ${window.location.origin}?clientMobile=${activeShareTarget.folder.clientMobile}\n\nChief Architect Deepak C (9747995961 / 9567627277)`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
              >
                <span>Share via WhatsApp</span>
              </button>

              {/* Copy Access Link */}
              <button
                onClick={() => {
                  const link = `${window.location.origin}?clientMobile=${activeShareTarget.folder.clientMobile}`;
                  navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <FileCheck className="w-4 h-4 text-blue-500" />}
                <span>{copiedLink ? 'Vault Link Copied!' : 'Copy Direct Vault Link'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
