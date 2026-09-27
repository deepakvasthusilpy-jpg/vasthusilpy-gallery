'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COMPANY_INFO } from '@/lib/sample-data';
import { ProjectFolder, ProjectFile } from '@/lib/types';
import { 
  FolderPlus,
  Phone,
  Folder,
  User,
  ShieldCheck,
  Compass,
  Sparkles,
  Layers,
  FileText,
  MapPin,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  Building2,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  HardDrive,
  Zap
} from 'lucide-react';

interface HeroAutoCarouselProps {
  folders?: ProjectFolder[];
  isAdmin?: boolean;
  onOpenCreateFolder?: () => void;
  onOpenGateway?: (role?: 'admin' | 'client') => void;
  onOpenClientLogin: () => void;
  onOpenAdminLogin: () => void;
  onExploreFolders: () => void;
  onPreviewFile?: (file: ProjectFile) => void;
}

export const HeroAutoCarousel: React.FC<HeroAutoCarouselProps> = ({
  folders = [],
  isAdmin = false,
  onOpenCreateFolder,
  onOpenGateway,
  onOpenClientLogin,
  onOpenAdminLogin,
  onExploreFolders,
  onPreviewFile
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract all media (images and videos) from attached folders + curated architectural renders
  const allMediaItems: Array<{
    id: string;
    type: 'video' | 'image';
    title: string;
    subtitle: string;
    tag: string;
    folderName?: string;
    clientName?: string;
    mediaUrl: string;
    badgeColor: string;
    accentGradient: string;
    aspectStats: { label: string; val: string }[];
  }> = [];

  // Add all files attached in folders that are images or videos
  folders.forEach((f) => {
    f.files?.forEach((file) => {
      const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video');
      const isImg = file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image');
      if (isVid || isImg) {
        allMediaItems.push({
          id: file.id,
          type: isVid ? 'video' : 'image',
          title: file.name.replace(/\.[^/.]+$/, ''),
          subtitle: `Attached in ${f.folderName} • Client: ${f.clientName} (${f.projectLocation || 'Palakkad'})`,
          tag: isVid ? '3D Video Walkthrough' : '3D Elevation Design',
          folderName: f.folderName,
          clientName: f.clientName,
          mediaUrl: file.fileUrl,
          badgeColor: isVid ? 'bg-rose-600' : 'bg-indigo-600',
          accentGradient: isVid 
            ? 'from-rose-950/95 via-[#0B3B7B]/95 to-slate-950' 
            : 'from-indigo-950/95 via-[#07244C]/95 to-slate-950',
          aspectStats: [
            { label: 'Category', val: file.category || (isVid ? '3D Walkthrough' : '3D Elevation') },
            { label: 'Resolution', val: '4K Ultra HD' },
            { label: 'Vault', val: f.folderName }
          ]
        });
      }
    });
  });

  // Default rich architectural showcases if no uploaded media exists
  const curatedShowcaseItems = [
    {
      id: 'showcase-villa-elevation',
      type: 'image' as const,
      title: 'Ultra-Realistic 3D Elevation & Luxury Villas',
      subtitle: 'Photorealistic Kerala contemporary and modern residential exterior elevations, cantilevered slabs, teak louvers, and ambient twilight illumination.',
      tag: '4K Architectural 3D Visualization',
      mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
      badgeColor: 'bg-indigo-600',
      accentGradient: 'from-indigo-950/95 via-[#0B3B7B]/95 to-slate-950',
      aspectStats: [
        { label: '3D Walkthrough', val: '4K HDR' },
        { label: 'Architecture', val: 'Contemporary' },
        { label: 'Vasthu Sync', val: '100% Certified' }
      ]
    },
    {
      id: 'showcase-3d-walkthrough-video',
      type: 'video' as const,
      title: 'Cinematic 3D Video Walkthrough & Virtual Tour',
      subtitle: 'Dynamic 360-degree camera flythroughs, ambient lighting animations, sun path shadows, and high-fidelity textures.',
      tag: '4K Cinematic Video Rendering',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-design-39908-large.mp4',
      badgeColor: 'bg-rose-600',
      accentGradient: 'from-rose-950/95 via-[#082852]/95 to-slate-950',
      aspectStats: [
        { label: 'Framerate', val: '60 FPS 4K' },
        { label: 'Virtual Tour', val: 'Cinematic Camera' },
        { label: 'Lighting', val: 'Ray Tracing' }
      ]
    },
    {
      id: 'showcase-interior-architecture',
      type: 'image' as const,
      title: 'Contemporary Luxury Interior Architecture',
      subtitle: 'Double-height open living concepts, bespoke wooden acoustic slat paneling, cove lighting, and courtyard integration.',
      tag: 'Interior Architecture & Lighting',
      mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=85',
      badgeColor: 'bg-emerald-600',
      accentGradient: 'from-emerald-950/95 via-[#07244C]/95 to-slate-950',
      aspectStats: [
        { label: 'Space Planning', val: 'Vedic Aligned' },
        { label: 'Finishes', val: 'Italian Marble & Teak' },
        { label: 'Acoustics', val: 'Engineered Slat' }
      ]
    },
    {
      id: 'showcase-traditional-fusion',
      type: 'image' as const,
      title: 'Kerala Traditional Fusion & Vasthu Harmony',
      subtitle: 'Padippura entrances, Charupadi verandas, clay sloped tile roofing, and scientific Brahmasthanam energy clearing.',
      tag: 'Authentic Vedic Vasthu Vidya',
      mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&auto=format&fit=crop&q=85',
      badgeColor: 'bg-amber-600',
      accentGradient: 'from-amber-950/95 via-[#071F3D]/95 to-slate-950',
      aspectStats: [
        { label: 'Vasthu Vidya', val: 'Thachu Shastra' },
        { label: 'Brahmasthanam', val: 'Open Courtyard' },
        { label: 'Consultant', val: 'Deepak C' }
      ]
    }
  ];

  // Combined playlist
  const playlist = allMediaItems.length > 0 ? [...allMediaItems, ...curatedShowcaseItems] : curatedShowcaseItems;

  // Auto-progression timer with smooth progress bar
  useEffect(() => {
    if (!isPlaying) return;
    const duration = 6000; // 6 seconds per slide
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((s) => (s + 1) % playlist.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playlist.length, currentSlide]);

  const activeMedia = playlist[currentSlide] || playlist[0];

  const handleNext = () => {
    setProgress(0);
    setCurrentSlide((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentSlide((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl text-white shadow-2xl border border-slate-800 my-2 select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none m-0 border-0 h-screen w-screen' : ''
      }`}
    >
      {/* Background Animated Crossfade Media Player */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMedia.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {activeMedia.type === 'video' ? (
            <video
              src={activeMedia.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover brightness-[0.45] contrast-125 transition-transform duration-1000"
            />
          ) : (
            <img
              src={activeMedia.mediaUrl}
              alt={activeMedia.title}
              className="w-full h-full object-cover brightness-[0.42] contrast-115 scale-105 animate-pulse"
              style={{ animationDuration: '10s' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85';
              }}
            />
          )}

          {/* Cinematic Gradient Overlays */}
          <div className={`absolute inset-0 bg-gradient-to-t ${activeMedia.accentGradient} opacity-90 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Content Container */}
      <div className="relative z-10 p-6 sm:p-10 md:p-12 min-h-[440px] sm:min-h-[500px] flex flex-col justify-between">
        
        {/* Top Header Bar: Media Badges & Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-white shadow-lg uppercase tracking-wider ${activeMedia.badgeColor}`}>
              {activeMedia.type === 'video' ? (
                <Video className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              {activeMedia.tag}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-100 border border-white/15 backdrop-blur-md">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              VASTHUSILPY • KERALASSERY, PALAKKAD
            </span>
          </div>

          {/* Player Controls (Play/Pause, Fullscreen, Slides) */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/15 shadow-xl">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
              title={isPlaying ? 'Pause Animated Showcase' : 'Play Animated Showcase'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-300" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Prev / Next Slide */}
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-blue-200">
              {String(currentSlide + 1).padStart(2, '0')} / {String(playlist.length).padStart(2, '0')}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition border-l border-white/15 ml-1 pl-2"
              title={isFullscreen ? 'Exit Fullscreen' : 'Full Screen Animated Play'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-300" /> : <Maximize2 className="w-4 h-4 text-blue-300" />}
            </button>
          </div>
        </div>

        {/* Center Main Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-4">
          
          {/* Left 7 Columns: Titles, Specs & Quick Actions */}
          <div className="lg:col-span-7 space-y-4">
            <motion.div
              key={`text-${activeMedia.id}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                {activeMedia.title}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed drop-shadow">
                {activeMedia.subtitle}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onOpenCreateFolder && (
                <button
                  onClick={onOpenCreateFolder}
                  className="px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Client Vault</span>
                </button>
              )}

              <button
                onClick={() => onOpenGateway ? onOpenGateway('client') : onOpenClientLogin()}
                className="px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>Client Vault Login</span>
              </button>

              <button
                onClick={onExploreFolders}
                className="px-4 py-3 rounded-2xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-amber-300" />
                <span>View Public Portfolio</span>
              </button>
            </div>
          </div>

          {/* Right 5 Columns: Dynamic Glassmorphism Live Specs Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div
              key={`card-${activeMedia.id}`}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-sm rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/15 text-white">
                    {activeMedia.type === 'video' ? (
                      <Video className="w-5 h-5 text-rose-300" />
                    ) : (
                      <Building2 className="w-5 h-5 text-indigo-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">
                      Live Showcase
                    </span>
                    <span className="text-xs font-black text-white">{activeMedia.tag}</span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {activeMedia.aspectStats.map((st, i) => (
                  <div key={i} className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[9px] text-blue-200/80 block uppercase tracking-wider truncate">
                      {st.label}
                    </span>
                    <span className="text-xs font-black text-white truncate block mt-0.5">
                      {st.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Quick Link */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-[11px] text-blue-200 font-mono">Architect: Deepak C</span>
                <button
                  onClick={onExploreFolders}
                  className="font-bold text-white hover:text-amber-300 underline inline-flex items-center gap-1"
                >
                  <span>Explore Vaults</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Bottom Progress Bar & Thumbnail Rail */}
        <div className="space-y-3 pt-2">
          
          {/* Animated Progress Bar */}
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="flex items-center justify-between gap-4 pt-1 text-xs text-blue-200">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
              {playlist.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setProgress(0);
                    setCurrentSlide(idx);
                  }}
                  className={`relative flex-shrink-0 h-10 w-16 sm:w-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    currentSlide === idx 
                      ? 'border-white scale-105 shadow-lg ring-2 ring-red-500' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={item.title}
                >
                  <img 
                    src={item.mediaUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Video className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Office Contact */}
            <div className="hidden md:flex items-center gap-4 font-mono text-[11px] text-white flex-shrink-0">
              <span className="text-blue-200 font-sans">Keralassery, Palakkad</span>
              <span className="font-bold">📞 9747995961 / 9567627277</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
