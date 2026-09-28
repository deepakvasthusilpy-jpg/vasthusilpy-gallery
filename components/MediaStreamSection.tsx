'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Film, 
  Image as ImageIcon, 
  Video, 
  Folder, 
  Eye, 
  Download, 
  Share2, 
  X, 
  CheckCircle2, 
  UploadCloud, 
  Sliders, 
  RotateCcw,
  Clock,
  Zap,
  ListPlus,
  Radio,
  Search,
  Check,
  Layers,
  FilePlus2,
  Tv
} from 'lucide-react';

import {
  MediaStreamItem,
  getStoredMediaStreamItems,
  saveStoredMediaStreamItems,
  subscribeToMediaStreamUpdates,
  getDefaultMediaStreamItems,
  STORAGE_MEDIA_STREAM_KEY
} from '@/lib/mediaStreamStorage';
export type { MediaStreamItem };

interface MediaStreamSectionProps {
  folders: ProjectFolder[];
  isAdmin: boolean;
  onPreviewFile?: (file: ProjectFile) => void;
  onOpenClientLogin?: () => void;
}

export const MediaStreamSection: React.FC<MediaStreamSectionProps> = ({
  folders = [],
  isAdmin,
  onPreviewFile,
  onOpenClientLogin
}) => {
  // Media Stream State - synchronized with storage
  const [streamItems, setStreamItems] = useState<MediaStreamItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isManageDrawerOpen, setIsManageDrawerOpen] = useState<boolean>(false);
  const [selectedFolderForImport, setSelectedFolderForImport] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Playback timer & progress
  const [imageProgress, setImageProgress] = useState<number>(0); // 0 to 100%
  const [imageTimeLeft, setImageTimeLeft] = useState<number>(5); // 5s countdown
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Add custom URL / file form
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customType, setCustomType] = useState<'image' | 'video'>('image');
  const [customCategory, setCustomCategory] = useState('3D Elevation Design');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize from storage and subscribe to real-time updates
  useEffect(() => {
    setStreamItems(getStoredMediaStreamItems(folders));

    const unsubscribe = subscribeToMediaStreamUpdates(folders, (updated) => {
      setStreamItems(updated);
      setCurrentIndex((prev) => (prev >= updated.length ? Math.max(0, updated.length - 1) : prev));
    });

    return unsubscribe;
  }, [folders]);

  // Persist updates & broadcast to Live Showcase
  const saveStreamItems = (items: MediaStreamItem[]) => {
    setStreamItems(items);
    saveStoredMediaStreamItems(items);
  };

  const currentItem = streamItems[currentIndex] || streamItems[0];

  // Navigation handlers
  const handleNext = () => {
    if (streamItems.length === 0) return;
    setImageProgress(0);
    setImageTimeLeft(5);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setCurrentIndex((prev) => (prev + 1) % streamItems.length);
  };

  const handlePrev = () => {
    if (streamItems.length === 0) return;
    setImageProgress(0);
    setImageTimeLeft(5);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setCurrentIndex((prev) => (prev - 1 + streamItems.length) % streamItems.length);
  };

  // 1. IMAGE PLAYBACK (5 Seconds Duration)
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'image' || !isPlaying) return;

    setImageProgress(0);
    setImageTimeLeft(5);

    const intervalTime = 50; // update progress every 50ms
    const totalDurationMs = 5000; // 5 seconds
    let elapsedMs = 0;

    const interval = setInterval(() => {
      elapsedMs += intervalTime;
      const progressPercent = Math.min((elapsedMs / totalDurationMs) * 100, 100);
      const remainingSecs = Math.max(0, Math.ceil((totalDurationMs - elapsedMs) / 1000));
      
      setImageProgress(progressPercent);
      setImageTimeLeft(remainingSecs);

      if (elapsedMs >= totalDurationMs) {
        clearInterval(interval);
        handleNext();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentIndex, currentItem?.id, currentItem?.type, isPlaying, streamItems.length]);

  // 2. VIDEO PLAYBACK (Full Length Playtime from start to end)
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'video' || !videoRef.current) return;

    const vid = videoRef.current;
    vid.currentTime = 0;

    if (isPlaying) {
      vid.play().catch((err) => {
        console.warn('Video auto-play waiting for user interaction:', err);
      });
    } else {
      vid.pause();
    }

    const handleTimeUpdate = () => {
      setVideoCurrentTime(vid.currentTime);
      if (vid.duration && !isNaN(vid.duration)) {
        setVideoDuration(vid.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (vid.duration && !isNaN(vid.duration)) {
        setVideoDuration(vid.duration);
      }
    };

    // When video finishes its full duration, advance to next file
    const handleVideoEnded = () => {
      handleNext();
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('loadedmetadata', handleLoadedMetadata);
    vid.addEventListener('ended', handleVideoEnded);

    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('loadedmetadata', handleLoadedMetadata);
      vid.removeEventListener('ended', handleVideoEnded);
    };
  }, [currentIndex, currentItem?.id, currentItem?.type, isPlaying]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ADD PROVISION 1: Upload local files
  const handleUploadFilesToStream = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newItems: MediaStreamItem[] = [];
    let processed = 0;

    Array.from(fileList).forEach((file) => {
      const isVid = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newItems.push({
            id: 'stream_upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            fileUrl: reader.result,
            type: isVid ? 'video' : 'image',
            category: isVid ? '3D Video Walkthrough' : '3D Elevation Design',
            folderName: 'Direct Upload',
            clientName: 'Media Stream Admin',
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            durationSeconds: isVid ? undefined : 5,
            addedAt: new Date().toISOString()
          });
        }

        processed++;
        if (processed === fileList.length) {
          saveStreamItems([...streamItems, ...newItems]);
          setIsAddModalOpen(false);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  // ADD PROVISION 2: Add by URL
  const handleAddCustomUrlToStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customTitle) return;

    const newItem: MediaStreamItem = {
      id: 'stream_url_' + Date.now(),
      name: customTitle,
      fileUrl: customUrl,
      type: customType,
      category: customCategory,
      folderName: 'Web Showcase',
      clientName: 'Deepak C',
      fileSize: 'HD Stream',
      durationSeconds: customType === 'image' ? 5 : undefined,
      addedAt: new Date().toISOString()
    };

    saveStreamItems([...streamItems, newItem]);
    setCustomTitle('');
    setCustomUrl('');
    setIsAddModalOpen(false);
  };

  // ADD PROVISION 3: Toggle / Add from Vault Folder
  const handleToggleVaultFile = (file: ProjectFile, folder: ProjectFolder) => {
    const exists = streamItems.some((s) => s.fileUrl === file.fileUrl || s.id === file.id);
    if (exists) {
      handleDeleteFile(file.id);
    } else {
      const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video');
      const newItem: MediaStreamItem = {
        id: file.id || 'stream_vault_' + Date.now(),
        name: file.name,
        fileUrl: file.fileUrl,
        type: isVid ? 'video' : 'image',
        category: file.category || (isVid ? '3D Walkthrough' : '3D Elevation'),
        folderName: folder.folderName,
        clientName: folder.clientName,
        fileSize: file.fileSize,
        durationSeconds: isVid ? undefined : 5,
        addedAt: file.uploadedAt || new Date().toISOString()
      };
      saveStreamItems([...streamItems, newItem]);
    }
  };

  // DELETE PROVISION: Delete file from Media Stream
  const handleDeleteFile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = streamItems.filter((item) => item.id !== id);
    saveStreamItems(updated);

    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
    setDeleteConfirmId(null);
  };

  // DELETE PROVISION: Clear All
  const handleClearAllStream = () => {
    saveStreamItems([]);
    setCurrentIndex(0);
  };

  // Reset to default files
  const handleResetToDefault = () => {
    const defaults = getDefaultMediaStreamItems(folders);
    saveStreamItems(defaults);
    setCurrentIndex(0);
  };

  // Move Up / Down
  const handleMoveItem = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === streamItems.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...streamItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    saveStreamItems(newItems);
    if (currentIndex === index) setCurrentIndex(targetIndex);
    else if (currentIndex === targetIndex) setCurrentIndex(index);
  };

  // Filtered list for library view
  const filteredLibrary = streamItems.filter((item) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.folderName && item.folderName.toLowerCase().includes(q))
    );
  });

  return (
    <div 
      ref={containerRef}
      className={`w-full transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white p-3 sm:p-6' 
          : 'space-y-6 py-2'
      }`}
    >

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PROVISION CONTROLS BAR */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Media Stream
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                • {streamItems.length} Files in Continuous Rotation
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Architectural Media Stream Cinema
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Images play for <strong>5 seconds</strong>; videos play <strong>full complete duration</strong> from start to end. Add or delete files anytime.
            </p>
          </div>
        </div>

        {/* Provision Buttons: Add Files & Manage / Delete */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Add Provision Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Files to Stream</span>
          </button>

          {/* Manage & Delete Provision Drawer */}
          <button
            onClick={() => setIsManageDrawerOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-sm"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Manage & Delete ({streamItems.length})</span>
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetToDefault}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
            title="Reload all vault media"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MEDIA STREAM THEATER STAGE (SCREEN-SIZED VIEWPORT) */}
      {/* ========================================================================= */}
      <div className="w-full bg-black rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Stage Floating Top Bar */}
        <div className="px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              STREAM BROADCAST: {currentItem ? currentItem.category : 'No Media'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                isPlaying 
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/30' 
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
            </button>

            {/* Quick Delete Current Slide */}
            {currentItem && (
              <button
                onClick={(e) => handleDeleteFile(currentItem.id, e)}
                className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/60 text-xs font-bold transition flex items-center gap-1.5"
                title="Delete this file from stream"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete This File</span>
              </button>
            )}

            {/* Fullscreen Mode */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen Screen-Size'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-blue-400" />}
            </button>
          </div>
        </div>

        {/* Dynamic Presentation Screen */}
        <div className={`relative w-full ${isFullscreen ? 'h-[76vh]' : 'h-[520px] sm:h-[620px] lg:h-[680px]'} bg-black overflow-hidden flex items-center justify-center select-none`}>
          
          <AnimatePresence mode="wait">
            {currentItem ? (
              <motion.div
                key={currentItem.id + currentIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full flex items-center justify-center"
              >
                {currentItem.type === 'video' ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      src={currentItem.fileUrl}
                      autoPlay
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-contain"
                    />

                    {/* Audio Toggle Floating Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute top-6 right-6 p-3 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 transition z-30 shadow-2xl"
                      title={isMuted ? 'Unmute Video Audio' : 'Mute Video Audio'}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-slate-300" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {/* Ambient Glow Backdrop */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-110"
                      style={{ backgroundImage: `url(${currentItem.fileUrl})` }}
                    />
                    
                    {/* High-Resolution Architectural Image */}
                    <img 
                      src={currentItem.fileUrl} 
                      alt={currentItem.name}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-2xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                )}

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none z-10" />

              </motion.div>
            ) : (
              <div className="text-center p-8 space-y-4">
                <Tv className="w-16 h-16 text-slate-600 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-white">Media Stream is Empty</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the button below to add local photos, 3D videos, or import from your project vaults.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                  >
                    + Add Files Now
                  </button>
                  <button
                    onClick={handleResetToDefault}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-200 text-xs font-bold"
                  >
                    Reload Default Media
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Left / Right Skip Chevrons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/10 backdrop-blur-md transition shadow-2xl hover:scale-110"
            title="Previous File"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/10 backdrop-blur-md transition shadow-2xl hover:scale-110"
            title="Next File"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Timing & Type Badge (Top-Left overlay) */}
          {currentItem && (
            <div className="absolute top-6 left-6 z-30">
              <div className="px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-2.5 shadow-2xl">
                {currentItem.type === 'video' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>🎬 Video Progress: <strong>{formatTime(videoCurrentTime)} / {formatTime(videoDuration)}</strong> (Plays Complete Length)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>⏱️ Image Rotation: <strong>{imageTimeLeft}s remaining (5s total)</strong></span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Current File Meta Overlay (Bottom-Left) */}
          {currentItem && (
            <div className="absolute bottom-6 left-6 right-6 z-30 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
              <div className="max-w-2xl space-y-2 bg-slate-950/85 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1.5 shadow-md">
                    {currentItem.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {currentItem.category}
                  </span>
                  
                  {currentItem.folderName && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                      <Folder className="w-3 h-3 text-amber-400" />
                      {currentItem.folderName}
                    </span>
                  )}

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-300 bg-slate-900 border border-slate-800">
                    Stream File {currentIndex + 1} of {streamItems.length}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight line-clamp-2">
                  {currentItem.name}
                </h2>

                {currentItem.clientName && (
                  <p className="text-xs sm:text-sm text-slate-300">
                    Client: <strong>{currentItem.clientName}</strong>
                  </p>
                )}
              </div>

              {/* Action Buttons for active slide */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start md:self-end">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = currentItem.fileUrl;
                    a.download = currentItem.name;
                    a.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    const shareText = `*VASTHUSILPY ARCHITECTURAL DESIGN*\n\n📐 ${currentItem.name}\n📍 Category: ${currentItem.category}\n\nChief Architect Deepak C (9747995961 / 9567627277)`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                  }}
                  className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white transition flex items-center justify-center shadow-lg"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleDeleteFile(currentItem.id, e)}
                  className="p-2.5 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition flex items-center justify-center shadow-lg"
                  title="Delete this file from media stream"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Animated Progress Bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900/90 z-40">
            {currentItem?.type === 'video' ? (
              <div 
                className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-100"
                style={{ width: `${videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0}%` }}
              />
            ) : (
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                style={{ width: `${imageProgress}%` }}
                transition={{ ease: 'linear' }}
              />
            )}
          </div>

        </div>

        {/* Filmstrip Bottom Queue */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex-shrink-0 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Stream Queue ({streamItems.length}):
            </span>

            {streamItems.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <div
                  key={item.id + idx}
                  className={`relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition duration-200 group ${
                    isSelected 
                      ? 'border-red-500 ring-2 ring-red-500/50 scale-105 shadow-xl' 
                      : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div
                    onClick={() => {
                      setCurrentIndex(idx);
                      setImageProgress(0);
                      setVideoCurrentTime(0);
                    }}
                    className="w-full h-full cursor-pointer"
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-rose-500">
                        <Video className="w-5 h-5" />
                        <span className="text-[8px] font-black text-rose-300 mt-0.5">FULL VIDEO</span>
                      </div>
                    ) : (
                      <img 
                        src={item.fileUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>

                  {/* Duration Tag */}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[8px] font-mono text-white font-bold">
                    {item.type === 'image' ? '5s' : 'VID'}
                  </span>

                  {/* Quick Delete Overlay on hover */}
                  <button
                    onClick={(e) => handleDeleteFile(item.id, e)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition shadow"
                    title="Delete from Stream"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {isSelected && (
                    <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Media</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MEDIA STREAM LIBRARY & BATCH DELETE MANAGER */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Media Stream Library & File Manager
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage the files in the continuous stream. Delete files, reorder, or add new architectural assets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stream files..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B3B7B] hover:bg-[#07244C] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More</span>
            </button>
          </div>
        </div>

        {/* Media Grid with Individual Delete Buttons */}
        {filteredLibrary.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No files found matching &quot;{searchFilter}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLibrary.map((item, index) => (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between hover:shadow-lg transition duration-200 hover:border-[#1D70E2]"
              >
                {/* Thumbnail */}
                <div 
                  onClick={() => {
                    const actualIdx = streamItems.findIndex(s => s.id === item.id);
                    if (actualIdx !== -1) {
                      setCurrentIndex(actualIdx);
                      setImageProgress(0);
                      setVideoCurrentTime(0);
                    }
                  }}
                  className="relative w-full h-36 bg-slate-200 dark:bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-rose-500">
                      <Video className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-black uppercase text-rose-300">3D Video Walkthrough</span>
                    </div>
                  ) : (
                    <img
                      src={item.fileUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}

                  {/* Playtime Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                    {item.type === 'video' ? <Video className="w-3 h-3 text-rose-400" /> : <Clock className="w-3 h-3 text-emerald-400" />}
                    {item.type === 'video' ? 'Full Video' : '5s Auto'}
                  </span>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-white text-slate-950 text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Play className="w-3 h-3 fill-slate-950" /> Play in Stream
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1D70E2] dark:text-blue-400 truncate">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.fileSize || 'HD'}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                    {item.name}
                  </h4>

                  {/* Delete / Reorder Actions */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        disabled={index === 0}
                        onClick={(e) => handleMoveItem(index, 'up', e)}
                        className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={index === streamItems.length - 1}
                        onClick={(e) => handleMoveItem(index, 'down', e)}
                        className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete button with confirmation */}
                    <button
                      onClick={(e) => handleDeleteFile(item.id, e)}
                      className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition text-xs font-bold flex items-center gap-1"
                      title="Delete from Media Stream"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. PROVISION MODAL: ADD MEDIA TO STREAM */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Add Files to Media Stream
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload new local media, paste web URLs, or select files from your project vaults.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* OPTION A: UPLOAD LOCAL FILES */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-300 dark:border-emerald-800 text-center space-y-3">
                <UploadCloud className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Upload Local 3D Renders, Elevation Photos & Videos
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select JPG, PNG, WEBP images (plays 5s) or MP4 walkthrough videos (plays full length).
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer transition shadow-md">
                  <Plus className="w-4 h-4" />
                  <span>Choose Files from Computer / Mobile</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleUploadFilesToStream}
                    className="hidden"
                  />
                </label>
              </div>

              {/* OPTION B: ADD FROM EXISTING PROJECT VAULTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Import Files from Project Vaults
                  </h4>
                  <span className="text-[11px] text-slate-400">Click to add/remove</span>
                </div>

                <div className="space-y-3">
                  {folders.map((folder) => {
                    const mediaFiles = (folder.files || []).filter(
                      f => f.type === '3d-render' || f.type === 'photo' || f.type === 'video' || f.category?.toLowerCase().includes('video') || f.fileUrl?.startsWith('data:image') || f.name.match(/\.(jpg|jpeg|png|webp|mp4)$/i)
                    );

                    if (mediaFiles.length === 0) return null;

                    return (
                      <div key={folder.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-black text-slate-900 dark:text-white">{folder.folderName}</span>
                            <span className="text-[11px] text-slate-400">({folder.clientName})</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{mediaFiles.length} media items</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                          {mediaFiles.map((file) => {
                            const isAdded = streamItems.some(s => s.fileUrl === file.fileUrl || s.id === file.id);
                            const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video');

                            return (
                              <div
                                key={file.id}
                                onClick={() => handleToggleVaultFile(file, folder)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                                  isAdded 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isVid ? <Video className="w-4 h-4 text-rose-500 flex-shrink-0" /> : <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                                  <span className="text-xs font-semibold truncate">{file.name}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                                  isAdded ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {isAdded ? 'Added ✓' : '+ Add'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OPTION C: ADD VIA DIRECT WEB URL */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Add via Web Link / Cloud URL
                </h4>

                <form onSubmit={handleAddCustomUrlToStream} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Title / Description"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      required
                      placeholder="Direct URL (https://...)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as any)}
                      className="px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="image">Image (5s)</option>
                      <option value="video">Video (Full length)</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {streamItems.length} total files currently active in Media Stream
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0B3B7B] hover:bg-[#07244C] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PROVISION DRAWER: MANAGE & DELETE FILES */}
      {/* ========================================================================= */}
      {isManageDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Manage & Delete Stream Files
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Delete unwanted files or reorder the continuous stream playback queue.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllStream}
                  className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-600 hover:text-white transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>

                <button
                  onClick={() => setIsManageDrawerOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {streamItems.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No files currently in Media Stream.
                </div>
              ) : (
                streamItems.map((item, idx) => (
                  <div
                    key={item.id + idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      idx === currentIndex 
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900' 
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                        {idx + 1}
                      </span>

                      <div className="w-14 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.type === 'video' ? (
                          <Video className="w-5 h-5 text-rose-400" />
                        ) : (
                          <img src={item.fileUrl} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            item.type === 'video' 
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' 
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          }`}>
                            {item.type === 'video' ? '🎬 Full Video' : '⏱️ 5s Image'}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">{item.folderName || 'Vault File'}</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-md">
                          {item.name}
                        </h5>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={(e) => handleMoveItem(idx, 'up', e)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        disabled={idx === streamItems.length - 1}
                        onClick={(e) => handleMoveItem(idx, 'down', e)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteFile(item.id, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1"
                        title="Delete this file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Changes persist automatically in your vault.
              </span>
              <button
                onClick={() => setIsManageDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0B3B7B] text-white text-xs font-bold"
              >
                Close Manager
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
