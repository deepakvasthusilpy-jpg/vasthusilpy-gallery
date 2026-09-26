'use client';

import React from 'react';
import { COMPANY_INFO, GALLERY_SHOWCASE } from '@/lib/sample-data';
import { BrandLogo } from './BrandLogo';
import { 
  FileText, 
  Layers, 
  Video, 
  Compass, 
  Map, 
  Award, 
  ShieldCheck, 
  Trees, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';

interface CompanyServicesSectionProps {
  onOpenCreateFolder?: () => void;
  onOpenAIVasthu?: () => void;
}

export const CompanyServicesSection: React.FC<CompanyServicesSectionProps> = ({
  onOpenCreateFolder,
  onOpenAIVasthu
}) => {
  const handleEnquireService = (serviceTitle: string) => {
    const text = `HI , I WANT ENQUIRY ABOUT "${serviceTitle}" ITEM`;
    const whatsappUrl = `https://wa.me/918848241463?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  };

  const iconMap: Record<string, React.ReactNode> = {
    FileText: <FileText className="w-6 h-6 text-red-600" />,
    Layers: <Layers className="w-6 h-6 text-purple-600" />,
    Video: <Video className="w-6 h-6 text-pink-600" />,
    Compass: <Compass className="w-6 h-6 text-amber-600" />,
    Map: <Map className="w-6 h-6 text-cyan-600" />,
    Award: <Award className="w-6 h-6 text-emerald-600" />,
    ShieldCheck: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    Trees: <Trees className="w-6 h-6 text-teal-600" />,
  };

  return (
    <div className="space-y-16 py-8">
      
      {/* 1. Services Grid Section */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive Architectural Solutions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Our Core Architectural & Vasthu Services
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            From initial topographical land survey to 3D elevation renders, Vasthu compliance, and official Panchayat permit approvals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMPANY_INFO.services.map((svc, i) => {
            const waMessage = `HI , I WANT ENQUIRY ABOUT "${svc.title}" ITEM`;
            const waLink = `https://wa.me/918848241463?text=${encodeURIComponent(waMessage)}`;

            return (
              <a
                key={i}
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300 space-y-3 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 w-fit group-hover:scale-110 transition-transform">
                    {iconMap[svc.icon] || <FileText className="w-6 h-6 text-red-600" />}
                  </div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {svc.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 group-hover:text-red-700">
                  <span>Enquire Service</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* 2. Official Architectural Banner Showcase (Replicating user's flyers) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Banner text & bullet points */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <BrandLogo size="lg" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Landscape Architectural Services & Vasthu Consultation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Building Plans (2D / 3D CAD)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">3D Design & Elevation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Video Rendering Works</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Vasthu Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Land Survey & Topo Mapping</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Valuation Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Building Permit Approvals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-white">Landscape Architecture</span>
              </div>
            </div>

            {/* Contact numbers pill */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="tel:9747995961"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-sm shadow-lg shadow-red-600/30 transition"
              >
                <Phone className="w-4 h-4 text-white" />
                <span>9747995961</span>
              </a>

              <a
                href="tel:9567627277"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm border border-white/20 transition"
              >
                <Phone className="w-4 h-4 text-red-400" />
                <span>9567627277</span>
              </a>

              <a
                href="tel:7012383137"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm border border-white/20 transition"
              >
                <Phone className="w-4 h-4 text-red-400" />
                <span>7012383137</span>
              </a>
            </div>
          </div>

          {/* Right: Architectural Brand Emblem & Vault Card (Clean slate) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-red-500/40 bg-gradient-to-br from-slate-900 via-zinc-900 to-black p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/40">
                  VA
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                  OFFICIAL PORTAL
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-white">VASTHUSILPY</h4>
                <p className="text-xs text-red-400 font-semibold tracking-wider uppercase">
                  Plans, 3D Designs & Vastu Consultation
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Near Keralassery Panchayath Office, Pathirippala-Kongad Road, Palakkad.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chief Architect:</span>
                  <span className="font-bold text-white">Deepak C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Direct Contact:</span>
                  <span className="font-mono font-bold text-red-400">9747995961 / 9567627277</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200">deepak.vasthusilpy@gmail.com</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Client Vault Ready • Upload your drawings & blueprints</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
