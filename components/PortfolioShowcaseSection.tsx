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
  ListPlus
} from 'lucide-react';

export interface PlaylistItem {
  id: string;
  name: string;
  fileUrl: string;
  type: 'image' | 'video';
  category: string;
  folderName?: string;
  clientName?: string;
  fileSize?: string;
  durationSeconds?: number; // For images: 5. For videos: dynamically calculated from video metadata
}

interface PortfolioShowcaseSectionProps {
  folders: ProjectFolder[];
  isAdmin: boolean;
  onPreviewFile?: (file: ProjectFile) => void;
  onOpenClientLogin?: () => void;
}

const STORAGE_PLAYLIST_KEY = 'vasthusilpy_portfolio_custom_playlist_v1';

export const PortfolioShowcaseSection: React.FC<PortfolioShowcaseSectionProps> = ({
  folders = [],
  isAdmin,
  onPreviewFile,
  onOpenClientLogin
}) => {
  // Extract default media from folders
  const defaultMediaItems: PlaylistItem[] = useMemo(() => {
    const items: PlaylistItem[] = [];

    folders.forEach((folder) => {
      folder.files?.forEach((file) => {
        const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.webm');
        const isImg = file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image') || file.name.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i);

        if (isVid || isImg) {
          items.push({
            id: file.id,
            name: file.name,
            fileUrl: file.fileUrl,
            type: isVid ? 'video' : 'image',
            category: file.category || (isVid ? '3D Video Walkthrough' : '3D Elevation Design'),
            folderName: folder.folderName,
            clientName: folder.clientName,
            fileSize: file.fileSize,
            durationSeconds: isVid ? undefined : 5 // 5 seconds for images
          });
        }
      });
    });

    // Fallback if no media attached yet
    if (items.length === 0) {
      return [
        {
          id: 'demo-villa-1',
          name: 'Contemporary Palakkad Luxury Villa 3D Elevation.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
          type: 'image',
          category: '3D Elevation Design',
          folderName: 'Palakkad Luxury Villa',
          clientName: 'Vasthusilpy Portfolio',
          fileSize: '4.8 MB',
          durationSeconds: 5
        },
        {
          id: 'demo-nalukettu-2',
          name: 'Traditional Kerala Nalukettu Courtyard & Vasthu Alignment.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80',
          type: 'image',
          category: '3D Design & Vasthu',
          folderName: 'Heritage Nalukettu Villa',
          clientName: 'Vasthusilpy Portfolio',
          fileSize: '5.2 MB',
          durationSeconds: 5
        },
        {
          id: 'demo-commercial-3',
          name: 'Modern Commercial Complex & CAD Structural Blueprint.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&auto=format&fit=crop&q=80',
          type: 'image',
          category: 'Building Plans',
          folderName: 'Commercial Complex Keralassery',
          clientName: 'Vasthusilpy Portfolio',
          fileSize: '6.1 MB',
          durationSeconds: 5
        }
      ];
    }

    return items;
  }, [folders]);

  // Active playlist state with localStorage persistence
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState<boolean>(false);

  // Playback timer & progress
  const [imageProgress, setImageProgress] = useState<number>(0); // 0 to 100%
  const [imageTimeLeft, setImageTimeLeft] = useState<number>(5); // 5s countdown
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Add custom item form state
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customType, setCustomType] = useState<'image' | 'video'>('image');
  const [customCategory, setCustomCategory] = useState('3D Elevation Design');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize playlist from localStorage or default media
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlaylist(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setPlaylist(defaultMediaItems);
  }, [defaultMediaItems]);

  // Save playlist whenever modified
  const updatePlaylist = (newPlaylist: PlaylistItem[]) => {
    setPlaylist(newPlaylist);
    try {
      localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(newPlaylist));
    } catch {
      // ignore
    }
  };

  const currentItem = playlist[currentIndex] || playlist[0];

  // Advance to next playlist item
  const handleNext = () => {
    if (playlist.length === 0) return;
    setImageProgress(0);
    setImageTimeLeft(5);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  // Go to previous playlist item
  const handlePrev = () => {
    if (playlist.length === 0) return;
    setImageProgress(0);
    setImageTimeLeft(5);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  // 1. IMAGE PLAYBACK LOGIC (Exactly 5 Seconds)
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
  }, [currentIndex, currentItem?.id, currentItem?.type, isPlaying, playlist.length]);

  // 2. VIDEO PLAYBACK LOGIC (Complete Playtime from Start to End)
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'video' || !videoRef.current) return;

    const vid = videoRef.current;
    vid.currentTime = 0;

    if (isPlaying) {
      vid.play().catch((err) => {
        console.warn('Auto-play blocked or waiting for user gesture:', err);
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

    // When video completes full length, advance immediately to next file!
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

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Add Item from Folder
  const handleToggleFolderFile = (file: ProjectFile, folder: ProjectFolder) => {
    const exists = playlist.some((p) => p.fileUrl === file.fileUrl || p.id === file.id);
    if (exists) {
      updatePlaylist(playlist.filter((p) => p.fileUrl !== file.fileUrl && p.id !== file.id));
    } else {
      const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video');
      const newItem: PlaylistItem = {
        id: file.id || 'pl_' + Date.now(),
        name: file.name,
        fileUrl: file.fileUrl,
        type: isVid ? 'video' : 'image',
        category: file.category || (isVid ? '3D Walkthrough' : '3D Elevation'),
        folderName: folder.folderName,
        clientName: folder.clientName,
        fileSize: file.fileSize,
        durationSeconds: isVid ? undefined : 5
      };
      updatePlaylist([...playlist, newItem]);
    }
  };

  // Upload local file to playlist
  const handleUploadFileToPlaylist = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const isVid = file.type.startsWith('video/') || file.name.endsWith('.mp4');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newItem: PlaylistItem = {
            id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            fileUrl: reader.result,
            type: isVid ? 'video' : 'image',
            category: isVid ? '3D Video Walkthrough' : '3D Elevation Design',
            folderName: 'Custom Upload',
            clientName: 'Portfolio Manager',
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            durationSeconds: isVid ? undefined : 5
          };
          updatePlaylist([...playlist, newItem]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add custom URL item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customTitle) return;

    const newItem: PlaylistItem = {
      id: 'custom_' + Date.now(),
      name: customTitle,
      fileUrl: customUrl,
      type: customType,
      category: customCategory,
      folderName: 'Featured Works',
      clientName: 'Deepak C',
      fileSize: 'HD Media',
      durationSeconds: customType === 'image' ? 5 : undefined
    };

    updatePlaylist([...playlist, newItem]);
    setCustomTitle('');
    setCustomUrl('');
    setIsAddCustomOpen(false);
  };

  // Remove Item
  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = playlist.filter((item) => item.id !== id);
    updatePlaylist(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  // Move Item Up / Down
  const handleMoveItem = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === playlist.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newPlaylist = [...playlist];
    const temp = newPlaylist[index];
    newPlaylist[index] = newPlaylist[targetIndex];
    newPlaylist[targetIndex] = temp;

    updatePlaylist(newPlaylist);
    if (currentIndex === index) setCurrentIndex(targetIndex);
    else if (currentIndex === targetIndex) setCurrentIndex(index);
  };

  // Reset to default
  const handleResetToDefault = () => {
    updatePlaylist(defaultMediaItems);
    setCurrentIndex(0);
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white p-3 sm:p-6' 
          : 'space-y-6 py-4'
      }`}
    >

      {/* ========================================================================= */}
      {/* 1. PORTFOLIO THEATER SCREEN (FULL VIEWPORT / SCREEN-SIZE AUTOMATED STAGE) */}
      {/* ========================================================================= */}
      <div className="w-full bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Stage Top Navigation Bar */}
        <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                  Portfolio Automated Cinema
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Images: 5s • Videos: Full Length
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Architectural 3D Designs & Video Walkthroughs
              </h1>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2">
            
            {/* Manage Playlist Button */}
            <button
              onClick={() => setIsManagerOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Add or Remove files to play"
            >
              <ListPlus className="w-4 h-4 text-emerald-400" />
              <span>Manage Playlist ({playlist.length})</span>
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold ${
                isPlaying 
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/30' 
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
              title={isPlaying ? 'Pause Auto-Advancing' : 'Play Auto-Advancing'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlaying ? 'Playing' : 'Paused'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen Screen-Size'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-blue-400" />}
            </button>
          </div>
        </div>

        {/* Media Presentation Viewport */}
        <div className={`relative w-full ${isFullscreen ? 'h-[75vh]' : 'h-[520px] sm:h-[620px] lg:h-[680px]'} bg-black overflow-hidden flex items-center justify-center select-none`}>
          
          <AnimatePresence mode="wait">
            {currentItem ? (
              <motion.div
                key={currentItem.id + currentIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
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

                    {/* Audio Mute/Unmute Float Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute top-6 right-6 p-3 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md border border-white/20 transition z-30 shadow-xl"
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
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
              <div className="text-center p-8 space-y-3">
                <Film className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Media in Portfolio Playlist</h3>
                <p className="text-xs text-slate-400">Click &quot;Manage Playlist&quot; above to add images and videos to play.</p>
                <button
                  onClick={handleResetToDefault}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                >
                  Load All Project Media
                </button>
              </div>
            )}
          </AnimatePresence>

          {/* Left / Right Skip Buttons */}
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

          {/* Live Playback Timing Badge (Top-Left overlay) */}
          {currentItem && (
            <div className="absolute top-6 left-6 z-30">
              <div className="px-3.5 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-2 shadow-2xl">
                {currentItem.type === 'video' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>🎬 Video Length: <strong>{formatTime(videoCurrentTime)} / {formatTime(videoDuration)}</strong> (Plays Complete)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>⏱️ Image Playtime: <strong>{imageTimeLeft}s remaining (5s total)</strong></span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* File Info Overlay (Bottom-Left) */}
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
                    File {currentIndex + 1} of {playlist.length}
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
                  onClick={(e) => handleRemoveItem(currentItem.id, e)}
                  className="p-2.5 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition flex items-center justify-center shadow-lg"
                  title="Remove this file from portfolio playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Animated Countdown / Video Progress Bar at Viewport Bottom */}
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

        {/* Filmstrip Playlist Queue (Scrollable Bottom Bar) */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex-shrink-0 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Playlist Queue ({playlist.length}):
            </span>

            {playlist.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={item.id + idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setImageProgress(0);
                    setVideoCurrentTime(0);
                  }}
                  className={`relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition duration-200 group text-left ${
                    isSelected 
                      ? 'border-red-500 ring-2 ring-red-500/50 scale-105 shadow-xl' 
                      : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                  }`}
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

                  {/* Duration Tag */}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[8px] font-mono text-white font-bold">
                    {item.type === 'image' ? '5s' : 'VID'}
                  </span>

                  {isSelected && (
                    <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsManagerOpen(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-[#0B3B7B] hover:opacity-95 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Remove Files</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. PLAYLIST MANAGER DRAWER / MODAL (ADD & REMOVE FILES TO PLAY) */}
      {/* ========================================================================= */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B3B7B] text-white flex items-center justify-center shadow-md">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Portfolio Playlist Studio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add new images & videos, adjust sequence, or remove files. Images play for 5 seconds; videos play full duration.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-1"
                  title="Reload all files from attached vaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reload Vault Media</span>
                </button>

                <button
                  onClick={() => setIsManagerOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Actions Bar: Upload & Add Custom */}
            <div className="p-4 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="px-4 py-2 rounded-xl bg-[#0B3B7B] hover:bg-[#07244C] text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Local Image / Video</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleUploadFileToPlaylist}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setIsAddCustomOpen(!isAddCustomOpen)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Add by URL</span>
                </button>
              </div>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {playlist.length} Files in Sequence
              </span>
            </div>

            {/* Custom URL Form drawer */}
            {isAddCustomOpen && (
              <form onSubmit={handleAddCustomItem} className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Title / Description"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="url"
                    required
                    placeholder="Media Direct URL (https://...)"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="image">Image (5s)</option>
                    <option value="video">Video (Full length)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Modal Body: Active Playlist Queue + Vault Selector */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* CURRENT PLAYLIST QUEUE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Active Playback Sequence (Plays One After Another)
                  </h4>
                  <span className="text-[11px] text-slate-400">Use arrows to reorder</span>
                </div>

                {playlist.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500">
                    Playlist is empty. Select files from below to add to the playlist.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlist.map((item, idx) => (
                      <div
                        key={item.id + idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
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
                                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
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

                        {/* Actions: Move Up, Move Down, Delete */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={(e) => handleMoveItem(idx, 'up', e)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-30"
                            title="Move Up in Sequence"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            disabled={idx === playlist.length - 1}
                            onClick={(e) => handleMoveItem(idx, 'down', e)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-30"
                            title="Move Down in Sequence"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleRemoveItem(item.id, e)}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 hover:bg-red-200"
                            title="Remove from Playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VAULT FILES SELECTOR */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Files from Project Vaults to Add to Playlist
                </h4>

                <div className="space-y-4">
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                          {mediaFiles.map((file) => {
                            const isAdded = playlist.some(p => p.fileUrl === file.fileUrl || p.id === file.id);
                            const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video');

                            return (
                              <div
                                key={file.id}
                                onClick={() => handleToggleFolderFile(file, folder)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                                  isAdded 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300' 
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
                                  {isAdded ? 'In Playlist ✓' : '+ Add'}
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

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                All playlist changes are auto-saved in your browser vault.
              </span>
              <button
                onClick={() => setIsManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0B3B7B] hover:bg-[#07244C] text-white text-xs font-bold shadow-md"
              >
                Close & Start Playing
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
