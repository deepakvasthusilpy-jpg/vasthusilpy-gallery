'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Eye, 
  Lock, 
  Share2, 
  Download, 
  Volume2, 
  VolumeX,
  Building2,
  Compass,
  Film
} from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'photo' | '3d-render' | 'blueprint';
  url: string;
  category: string;
  folderName: string;
  clientName: string;
  folderId?: string;
  clientMobile?: string;
  fileSize?: string;
}

interface HomeFullScreenMediaShowcaseProps {
  folders: ProjectFolder[];
  onPreviewFile?: (file: ProjectFile, folder?: ProjectFolder) => void;
  onRequireAuthToDownloadOrShare?: (folder: ProjectFolder, file?: ProjectFile, action?: 'download' | 'share') => void;
}

export const HomeFullScreenMediaShowcase: React.FC<HomeFullScreenMediaShowcaseProps> = ({
  folders,
  onPreviewFile,
  onRequireAuthToDownloadOrShare
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract all media files (videos, 3d-renders, photos, blueprints) from all client vaults
  const mediaList: MediaItem[] = [];

  folders.forEach((folder) => {
    if (folder.files && Array.isArray(folder.files)) {
      folder.files.forEach((file) => {
        const isVid = file.type === 'video' || file.category?.includes('Video') || file.name.endsWith('.mp4') || file.name.endsWith('.avi');
        const isImg = file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image') || file.fileUrl?.startsWith('http');
        const isBlue = file.type === 'blueprint' || file.category?.includes('Plan') || file.name.endsWith('.pdf');

        if (isVid || isImg || isBlue) {
          mediaList.push({
            id: file.id,
            name: file.name,
            type: isVid ? 'video' : isImg ? '3d-render' : 'blueprint',
            url: file.fileUrl,
            category: file.category || 'Architectural Showcase',
            folderName: folder.folderName,
            clientName: folder.clientName,
            folderId: folder.id,
            clientMobile: folder.clientMobile,
            fileSize: file.fileSize
          });
        }
      });
    }
  });

  // Default architectural showcases if no vault media uploaded yet
  const defaultShowcases: MediaItem[] = [
    {
      id: 'default-1',
      name: 'Modern Tropical Villa 3D Walkthrough & Elevation',
      type: 'video',
      url: '',
      category: '4K 3D Exterior Walkthrough',
      folderName: 'Vasthusilpy Signature Villa',
      clientName: 'Deepak C (Palakkad HQ)'
    },
    {
      id: 'default-2',
      name: 'Contemporary Living & Courtyard 3D Interior',
      type: '3d-render',
      url: '',
      category: 'Photorealistic 3D Interior',
      folderName: 'Keralassery Luxury Residence',
      clientName: 'Vasthusilpy Studio'
    },
    {
      id: 'default-3',
      name: 'KMBR Sanctioned Structural 2D CAD Blueprint',
      type: 'blueprint',
      url: '',
      category: 'Panchayath Approved Plan',
      folderName: 'Commercial & Residential Master Vault',
      clientName: 'Deepak C'
    }
  ];

  const activeMediaList = mediaList.length > 0 ? mediaList : defaultShowcases;
  const activeItem = activeMediaList[currentIndex % activeMediaList.length] || defaultShowcases[0];

  // Auto-advance slideshow when playing (5 seconds per item)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeMediaList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPlaying, activeMediaList.length]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeMediaList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeMediaList.length) % activeMediaList.length);
  };

  const handleOpenAuth = (action: 'download' | 'share') => {
    const matchedFolder = folders.find(f => f.id === activeItem.folderId) || folders[0];
    if (matchedFolder && onRequireAuthToDownloadOrShare) {
      const matchedFile = matchedFolder.files?.find(f => f.id === activeItem.id);
      onRequireAuthToDownloadOrShare(matchedFolder, matchedFile, action);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-3xl bg-slate-950 text-white shadow-2xl border border-slate-800 overflow-hidden select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen flex flex-col justify-between' : 'my-4'
      }`}
    >
      {/* Top Header Bar inside media player */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30 flex items-center justify-center">
            {activeItem.type === 'video' ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-red-400">
                VASTHUSILPY 3D THEATRE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white">
                {activeItem.type === 'video' ? 'Animated 4K Video' : '3D Elevation attachment'}
              </span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
              {activeItem.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle (for video) */}
          {activeItem.type === 'video' && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition flex items-center gap-1.5 text-xs font-bold"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Play'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main Animated Viewport Canvas */}
      <div className={`relative w-full flex items-center justify-center bg-black overflow-hidden ${
        isFullscreen ? 'flex-1' : 'min-h-[360px] sm:min-h-[460px] md:min-h-[520px]'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id + currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {/* If video with real URL */}
            {activeItem.type === 'video' && activeItem.url ? (
              <video
                src={activeItem.url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : activeItem.url ? (
              /* Image attachment */
              <img
                src={activeItem.url}
                alt={activeItem.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* High-fidelity Architectural Animated Canvas Visual */
              <div className="relative w-full h-full bg-gradient-to-br from-[#0B3B7B] via-[#082852] to-[#071529] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                {/* Precision Animated Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-50" />
                
                {/* Floating Architectural Graphic Rings */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-blue-400/20 border-dashed absolute flex items-center justify-center"
                >
                  <div className="w-36 h-36 rounded-full border border-cyan-400/20" />
                </motion.div>

                <div className="relative z-10 space-y-3 max-w-lg">
                  <div className="inline-flex p-4 rounded-3xl bg-white/10 backdrop-blur-xl text-blue-300 shadow-2xl border border-white/20">
                    {activeItem.type === 'video' ? (
                      <Film className="w-10 h-10 text-red-400 animate-pulse" />
                    ) : (
                      <Building2 className="w-10 h-10 text-cyan-300" />
                    )}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    {activeItem.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-200/90 font-medium">
                    Vault: {activeItem.folderName} · Client: {activeItem.clientName}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold">
                      Photorealistic 4K Walkthrough
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                      100% Vasthu Compliant
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating Controls Overlay (Left & Right arrows) */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition z-20 hover:scale-110"
          aria-label="Previous Media"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition z-20 hover:scale-110"
          aria-label="Next Media"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Bar: Timeline Progress, Play Controls & Password Protection Action */}
      <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-4">
        
        {/* Animated Timeline Progress Bar */}
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ width: '0%' }}
            animate={{ width: isPlaying ? '100%' : '0%' }}
            transition={{ duration: isPlaying ? 5 : 0, ease: 'linear' }}
            className="h-full bg-red-500 rounded-full"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Play/Pause & Media Counter */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/40 transition flex items-center justify-center hover:scale-105"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <div>
              <span className="text-xs font-bold text-white block">
                {activeMediaList.length} Animated Showcases
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Now Playing: 0{currentIndex + 1} / 0{activeMediaList.length}
              </span>
            </div>
          </div>

          {/* View Only & Download/Share Protected Actions */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-blue-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              👁️ View Only Mode
            </span>

            <button
              onClick={() => handleOpenAuth('download')}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
              title="Enter User ID and Password to Download"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Download (Login Required)</span>
            </button>

            <button
              onClick={() => handleOpenAuth('share')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              title="Enter User ID and Password to Share"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

        </div>

        {/* Playlist Thumbnails Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
          {activeMediaList.map((item, idx) => (
            <button
              key={item.id + idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsPlaying(false);
              }}
              className={`flex items-center gap-2 p-2 rounded-xl border transition shrink-0 text-left ${
                currentIndex === idx
                  ? 'bg-white/20 border-red-500 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-xs font-bold text-red-400 shrink-0">
                {item.type === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 pr-2">
                <span className="text-[11px] font-bold text-white block truncate max-w-[130px]">
                  {item.name}
                </span>
                <span className="text-[9px] text-blue-200 block truncate max-w-[130px]">
                  {item.folderName}
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
