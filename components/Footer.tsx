'use client';

import React from 'react';
import { COMPANY_INFO } from '@/lib/sample-data';
import { BrandLogo } from './BrandLogo';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Compass, 
  Heart,
  Database,
  QrCode
} from 'lucide-react';

interface FooterProps {
  onOpenDataVault: () => void;
  onOpenAdminLogin: () => void;
  onOpenClientLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDataVault,
  onOpenAdminLogin,
  onOpenClientLogin
}) => {
  return (
    <footer className="w-full bg-slate-950 text-white border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo size="lg" />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Premier architectural design studio, landscape planning, 3D visualization, and traditional Kerala Vasthu Shastra consultation located in Keralassery, Palakkad.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-900/60">
                <ShieldCheck className="w-3.5 h-3.5" /> KMBR & Panchayat Certified
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-900/60">
                <Compass className="w-3.5 h-3.5" /> 100% Vasthu Compliant
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Project Vault Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={onOpenClientLogin} className="hover:text-red-400 transition">
                  • Client Secure Login Portal
                </button>
              </li>
              <li>
                <button onClick={onOpenAdminLogin} className="hover:text-red-400 transition">
                  • Admin Control Console (9747995961)
                </button>
              </li>
              <li>
                <button onClick={onOpenDataVault} className="hover:text-blue-400 transition">
                  • Google Drive Backup (&quot;VasthuWeb&quot;)
                </button>
              </li>
              <li>
                <span className="text-slate-500">• Smart QR Visiting Card System</span>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Office & Site Contacts
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{COMPANY_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex items-center gap-2">
                  <a href="tel:9567627277" className="hover:text-white font-bold">9567627277</a>
                  <span>/</span>
                  <a href="tel:9747995961" className="hover:text-white font-bold">9747995961</a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-white">
                  {COMPANY_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{COMPANY_INFO.workingHours}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} VASTHUSILPY, Keralassery. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Built with precision for Palakkad Architecture</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
