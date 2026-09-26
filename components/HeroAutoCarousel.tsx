'use client';

import React from 'react';
import { COMPANY_INFO } from '@/lib/sample-data';
import { ProjectFolder } from '@/lib/types';
import { 
  FolderPlus,
  Phone,
  Folder,
  User,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  MapPin,
  Lock
} from 'lucide-react';

interface HeroAutoCarouselProps {
  folders?: ProjectFolder[];
  isAdmin?: boolean;
  onOpenCreateFolder?: () => void;
  onOpenGateway?: (role?: 'admin' | 'client') => void;
  onOpenClientLogin: () => void;
  onOpenAdminLogin: () => void;
  onExploreFolders: () => void;
}

export const HeroAutoCarousel: React.FC<HeroAutoCarouselProps> = ({
  folders = [],
  isAdmin = false,
  onOpenCreateFolder,
  onOpenGateway,
  onOpenClientLogin,
  onOpenAdminLogin,
  onExploreFolders
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-white shadow-2xl border border-slate-800 my-4 p-6 sm:p-10">
      {/* Precision Blueprint Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-80" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        
        {/* Badges Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-md shadow-red-600/30 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            VASTHUSILPY • KERALASSERY
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-sm">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Vasthu Shastra Certified
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {folders.length === 0 ? 'Clean Slate Ready' : `${folders.length} Active Project Vaults`}
          </span>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            VASTHUSILPY PLANS 3D DESIGNS & VASTU CONSULTATION
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Architectural Services, Precision 2D CAD Building Plans, 3D Elevation Visualizations, Video Walkthroughs, Land Surveys, and Official Building Permits. Create client folders to organize blueprints and generate instant QR visiting cards.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {onOpenCreateFolder && (
            <button
              onClick={onOpenCreateFolder}
              className="px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Client Folder</span>
            </button>
          )}

          <button
            onClick={() => onOpenGateway ? onOpenGateway('admin') : onOpenAdminLogin()}
            className="px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>Admin Gateway (9747995961)</span>
          </button>

          <button
            onClick={() => onOpenGateway ? onOpenGateway('client') : onOpenClientLogin()}
            className="px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Client Vault Gateway</span>
          </button>
        </div>

        {/* Office Contact Strip */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-slate-200 font-medium">{COMPANY_INFO.address}</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <Phone className="w-3.5 h-3.5 text-red-500" />
            <span className="text-white font-bold tracking-wider">9747995961 / 9567627277 / 7012383137</span>
          </div>
        </div>

      </div>
    </div>
  );
};
