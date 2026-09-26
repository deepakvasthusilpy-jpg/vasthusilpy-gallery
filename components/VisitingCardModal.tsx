'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProjectFolder } from '@/lib/types';
import { COMPANY_INFO } from '@/lib/sample-data';
import { BrandLogo } from './BrandLogo';
import { 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Phone, 
  QrCode, 
  Lock, 
  User, 
  MessageSquare,
  Mail,
  MapPin,
  Scissors,
  Edit3,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface VisitingCardModalProps {
  folder: ProjectFolder;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTheme?: (theme: ProjectFolder['cardTheme']) => void;
}

export const VisitingCardModal: React.FC<VisitingCardModalProps> = ({
  folder,
  isOpen,
  onClose,
}) => {
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);

  // Editable Card Overrides
  const [customClientName, setCustomClientName] = useState(folder.clientName);
  const [customProjectTitle, setCustomProjectTitle] = useState(folder.folderName);
  const [customLocation, setCustomLocation] = useState(folder.projectLocation || 'Keralassery, Palakkad');

  const printSheetRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Generate Direct URL for QR Code
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vasthusilpy.com';
  const directLoginUrl = `${baseUrl}?clientMobile=${encodeURIComponent(folder.clientMobile)}&folderId=${encodeURIComponent(folder.id)}`;
  const qrData = directLoginUrl;

  const handleCopyCredentials = () => {
    const text = `🏢 *VASTHUSILPY PLANS 3D DESIGNS & VASTU CONSULTATION*\n` +
      `📍 *Office:* ${COMPANY_INFO.address}\n\n` +
      `👤 *Client Name:* ${customClientName}\n` +
      `📁 *Project:* ${customProjectTitle}\n` +
      `📱 *User ID (Mobile):* ${folder.clientMobile}\n` +
      `🔑 *Password:* ${folder.customPassword}\n\n` +
      `🔗 *Direct Access Link:*\n${directLoginUrl}\n\n` +
      `📞 Contact: 9747995961 / 9567627277 / 7012383137\n` +
      `✉ Email: ${COMPANY_INFO.email}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `🏢 *VASTHUSILPY PLANS 3D DESIGNS & VASTU CONSULTATION*\n` +
      `📍 *Office:* ${COMPANY_INFO.address}\n\n` +
      `Dear ${customClientName},\n` +
      `Here is your official Project Vault Access Card:\n\n` +
      `📁 *Project:* ${customProjectTitle}\n` +
      `📱 *User ID:* ${folder.clientMobile}\n` +
      `🔑 *Password:* ${folder.customPassword}\n\n` +
      `🔗 *Direct Portal Login:*\n${directLoginUrl}\n\n` +
      `📞 Vasthusilpy: 9747995961 / 9567627277 / 7012383137\n` +
      `✉ Email: ${COMPANY_INFO.email}`;

    const cleanNumber = folder.clientMobile.replace(/\D/g, '');
    const waUrl = `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Project Vault Access Card - VASTHUSILPY (${customProjectTitle})`);
    const body = encodeURIComponent(
      `Dear ${customClientName},\n\n` +
      `Welcome to VASTHUSILPY PLANS 3D DESIGNS & VASTU CONSULTATION, Keralassery!\n\n` +
      `Your project blueprints, 3D renderings, and document vault are accessible online with your login credentials:\n\n` +
      `Office Address: ${COMPANY_INFO.address}\n` +
      `Project: ${customProjectTitle}\n` +
      `User ID (Mobile): ${folder.clientMobile}\n` +
      `Password: ${folder.customPassword}\n` +
      `Direct Portal Access Link: ${directLoginUrl}\n\n` +
      `Chief Architect & Vasthu Consultant: Deepak C\n` +
      `Contact Numbers: 9747995961 / 9567627277 / 7012383137\n` +
      `Email: ${COMPANY_INFO.email}\n`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Direct Print Trigger
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print fallback:', err);
      window.print();
    }
  };

  // High Quality PDF Download (A4 Portrait with Cards on top and Cut Marks)
  const handleDownloadPDF = async () => {
    if (!printSheetRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = printSheetRef.current;
      
      // Render canvas at 2.5x scale for ultra crisp color print quality
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1050
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // Standard A4 dimensions in mm (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
      
      const fileName = `${(customClientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_Vasthusilpy_Color_Visiting_Card_A4.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF Generation error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const previewImage = folder.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      
      {/* Embedded CSS for Color Print Mode */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-a4-page, #printable-a4-page * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-a4-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white border border-emerald-500/30 shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Visiting Card Generator & A4 Print Suite
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Premium Full Colour Print
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vivid Architectural Color Print • 3X Hero 3D Elevation Preview • A4 High-Res PDF
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingCard(!isEditingCard)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-300" />
              <span>{isEditingCard ? 'Close Editor' : 'Customize Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Page</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Color PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Card Customizer Drawer if active */}
          {isEditingCard && (
            <div className="no-print p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                  Custom Card Details for Printing
                </span>
                <span className="text-[10px] text-slate-400">These will be printed on the visiting card</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Client Name</label>
                  <input
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Project Title</label>
                  <input
                    type="text"
                    value={customProjectTitle}
                    onChange={(e) => setCustomProjectTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Site Location</label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRINTABLE A4 CONTAINER */}
          <div className="flex justify-center p-2 bg-slate-200 dark:bg-slate-950 rounded-2xl overflow-x-auto">
            
            {/* The exact A4 Page (210mm x 297mm in aspect ratio, rendered with cutting marks and full color cards) */}
            <div 
              ref={printSheetRef}
              id="printable-a4-page"
              className="bg-white text-slate-900 w-full max-w-[860px] min-h-[1100px] p-6 sm:p-8 shadow-2xl border border-slate-300 relative flex flex-col justify-between"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              
              {/* TOP OF A4 PAGE: HEADER BANNER & CUTTING GUIDE */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-slate-300 text-slate-500 text-[11px]">
                  <div className="flex items-center gap-2">
                    <BrandLogo className="w-5 h-5 text-emerald-800" />
                    <span className="font-black text-emerald-950 tracking-wider">VASTHUSILPY</span>
                    <span className="text-slate-600">• Official Client Visiting Card & Vault Access (A4 Color Print Layout)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Standard ID-1 Size (85.6mm × 54mm)</span>
                  </div>
                </div>

                {/* SIDE-BY-SIDE CARDS CONTAINER AT TOP OF A4 (ZERO OVERLAP GUARANTEED) */}
                <div className="relative p-5 sm:p-6 border border-slate-200 rounded-2xl bg-slate-50/70 shadow-inner">
                  
                  {/* Corner Cutting Marks */}
                  <div className="absolute top-1 left-1 text-[11px] text-slate-400 font-mono">┌</div>
                  <div className="absolute top-1 right-1 text-[11px] text-slate-400 font-mono">┐</div>
                  <div className="absolute bottom-1 left-1 text-[11px] text-slate-400 font-mono">└</div>
                  <div className="absolute bottom-1 right-1 text-[11px] text-slate-400 font-mono">┘</div>
                  
                  {/* Center Vertical Cut/Fold Guide */}
                  <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 flex-col items-center justify-between pointer-events-none py-1 z-20">
                    <span className="text-[9px] text-emerald-800 font-mono font-bold bg-white px-1.5 py-0.5 rounded shadow-xs border border-emerald-200">✂ CUT / FOLD</span>
                    <div className="w-[1px] h-full border-r border-dashed border-emerald-400" />
                    <span className="text-[9px] text-emerald-800 font-mono bg-white px-1">✂</span>
                  </div>

                  {/* CARDS GRID: FIXED DIMENSIONS PREVENT OVERLAP (Full Vibrant Architectural Color Print) */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
                    
                    {/* ======================================================== */}
                    {/* CARD FRONT SIDE: VIBRANT COLOR PRINT WITH 3X HERO 3D IMAGE */}
                    {/* ======================================================== */}
                    <div 
                      ref={frontCardRef}
                      className="w-full md:w-[370px] min-h-[310px] max-w-[370px] shrink-0 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#ffffff] via-[#f8faf9] to-[#edf4f0] text-slate-900 border-2 border-[#153e2d] box-border relative"
                    >
                      {/* Top Color Accent Line */}
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#153e2d] via-[#2d6a4f] to-[#d4af37]" />

                      {/* Front Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-emerald-900/20 pb-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#153e2d] to-[#0d281e] text-amber-300 flex items-center justify-center font-black text-xs shrink-0 shadow-md border border-amber-400/40">
                            VA
                          </div>
                          <div>
                            <h4 className="font-black text-xs leading-none tracking-tight text-[#153e2d]">
                              VASTHUSILPY
                            </h4>
                            <span className="text-[7.5px] font-bold block text-emerald-900 uppercase tracking-widest mt-0.5">
                              PLANS 3D DESIGNS & VASTU
                            </span>
                            <span className="text-[7px] text-slate-600 block font-medium">KERALASSERY, PALAKKAD</span>
                          </div>
                        </div>

                        {/* Front Category Badge in Full Color */}
                        <span className="text-[7.5px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#153e2d] to-[#1e523d] text-amber-200 border border-amber-400/30 shadow-xs shrink-0">
                          {folder.projectCategory || 'Architectural Design'}
                        </span>
                      </div>

                      {/* 3X HERO VIVID COLOR 3D ELEVATION SHOWCASE */}
                      <div className="my-2 relative w-full h-[155px] rounded-xl overflow-hidden shadow-md border border-[#153e2d]/40 bg-slate-900 group">
                        {/* 3D House Preview in Full Rich High-Resolution Color */}
                        <img
                          src={previewImage}
                          alt="3D Project Preview"
                          className="w-full h-full object-cover transform scale-100 transition-transform duration-500"
                          crossOrigin="anonymous"
                        />
                        {/* Architectural Glass Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6 text-white">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[6.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-black shadow-xs">
                              3D ELEVATION VIEW
                            </span>
                            <span className="text-[7px] font-medium text-amber-200">
                              Official Client Vault
                            </span>
                          </div>
                          <h5 className="font-black text-[11px] text-white truncate leading-tight drop-shadow-sm">
                            {customProjectTitle}
                          </h5>
                          <span className="text-[8px] text-emerald-200 block truncate font-medium mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-amber-300 inline shrink-0" />
                            {customLocation}
                          </span>
                        </div>
                      </div>

                      {/* Front Services Bullet Strip in Color Print Style */}
                      <div className="text-[7px] leading-tight text-emerald-950 border-t border-emerald-900/20 pt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 font-bold">
                        <span className="text-[#153e2d]">• Landscape</span>
                        <span className="text-[#153e2d]">• Building Plans</span>
                        <span className="text-[#153e2d]">• 3D Elevation</span>
                        <span className="text-[#153e2d]">• Vasthu</span>
                        <span className="text-[#153e2d]">• Survey</span>
                        <span className="text-[#153e2d]">• Valuation</span>
                        <span className="text-[#153e2d]">• Permits</span>
                      </div>

                      {/* Front Footer: Office Address & Numbers */}
                      <div className="mt-1 pt-1.5 border-t border-emerald-900/20 flex flex-col gap-0.5 text-[7px] font-medium leading-tight text-slate-800">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                          <span className="truncate font-semibold text-slate-900">
                            {COMPANY_INFO.address}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 flex-wrap font-mono text-[7px]">
                          <span className="font-bold text-[#153e2d]">
                            📞 9747995961 / 9567627277 / 7012383137
                          </span>
                          <span className="text-emerald-800 font-semibold">✉ {COMPANY_INFO.email}</span>
                        </div>
                      </div>

                    </div>

                    {/* ======================================================== */}
                    {/* CARD BACK SIDE: PREMIUM COLOR PRINT WITH DYNAMIC QR CODE */}
                    {/* ======================================================== */}
                    <div 
                      ref={backCardRef}
                      className="w-full md:w-[370px] min-h-[310px] max-w-[370px] shrink-0 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#ffffff] via-[#f8faf9] to-[#edf4f0] text-slate-900 border-2 border-[#153e2d] box-border relative"
                    >
                      {/* Top Color Accent Line */}
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#2d6a4f] to-[#153e2d]" />

                      {/* Back Header */}
                      <div className="flex items-center justify-between border-b border-emerald-900/20 pb-2 pt-1">
                        <div>
                          <span className="text-[7.5px] font-bold uppercase tracking-widest text-[#153e2d] flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-emerald-700" />
                            PORTAL ACCESS CREDENTIALS
                          </span>
                          <span className="text-[11px] font-black text-slate-900 truncate max-w-[200px] block mt-0.5">
                            {customClientName}
                          </span>
                        </div>
                        <span className="text-[7px] px-2.5 py-0.5 rounded-full bg-[#153e2d] text-amber-300 font-mono font-bold shadow-xs border border-amber-400/30">
                          VAULT #{folder.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      {/* Back Center: Credentials Box & QR Code */}
                      <div className="my-2.5 grid grid-cols-12 gap-3 items-center">
                        
                        {/* Credentials Data (7 cols) */}
                        <div className="col-span-7 space-y-2 text-[8.5px]">
                          <div className="p-2.5 rounded-xl bg-white border border-emerald-900/30 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-900 font-bold flex items-center gap-1 text-[8px]">
                                <User className="w-3 h-3 text-emerald-700" /> User ID:
                              </span>
                              <span className="font-mono font-black text-[10px] text-slate-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {folder.clientMobile}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-emerald-100 pt-1.5">
                              <span className="text-emerald-900 font-bold flex items-center gap-1 text-[8px]">
                                <Lock className="w-3 h-3 text-emerald-700" /> Password:
                              </span>
                              <span className="font-mono font-black text-[10px] text-[#153e2d] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {showPassword ? folder.customPassword : '••••••••'}
                              </span>
                            </div>
                          </div>

                          <div className="text-[7.5px] text-slate-700 leading-snug bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200/60">
                            <span className="font-semibold text-emerald-900">✨ Instant Access:</span>
                            <span className="block mt-0.5 text-slate-700">Scan QR code for instant viewing of 3D designs, blueprints, floor plans & structural permits.</span>
                          </div>
                        </div>

                        {/* High Res Full Color Scannable QR Code (5 cols) */}
                        <div className="col-span-5 flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white text-slate-900 border-2 border-[#153e2d] shadow-md relative group">
                          <QRCodeSVG
                            value={qrData}
                            size={82}
                            level="H"
                            includeMargin={false}
                            fgColor="#153e2d"
                            bgColor="#FFFFFF"
                          />
                          <div className="mt-1.5 px-2 py-0.5 rounded bg-gradient-to-r from-[#153e2d] to-[#1e523d] text-amber-300 text-[6.5px] font-black tracking-tight text-center uppercase shadow-xs">
                            SCAN TO LOGIN
                          </div>
                        </div>

                      </div>

                      {/* Back Footer: Vasthu Authenticity & Signature */}
                      <div className="border-t border-emerald-900/20 pt-2 flex items-center justify-between text-[7px] text-slate-800">
                        <div>
                          <span className="font-black text-[#153e2d] block text-[8px]">Deepak C</span>
                          <span className="text-slate-600 block text-[6.5px] font-medium">Chief Architect & Vasthu Consultant</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#153e2d] block text-[8px]">VASTHUSILPY</span>
                          <span className="text-slate-600 block text-[6.5px] font-medium">Pathirippala-Kongad Road, Palakkad</span>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* CLEAN BLANK A4 BOTTOM SPACE (NO TEXT PORTION) */}
              <div className="flex-1" />

            </div>

          </div>

          {/* Quick Sharing & Access Toolbar */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>

            {/* Email Share */}
            <button
              onClick={handleShareEmail}
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Share Email</span>
            </button>

            {/* Copy Credentials */}
            <button
              onClick={handleCopyCredentials}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Details!' : 'Copy Credentials'}</span>
            </button>

            {/* Download A4 Color PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="p-3 rounded-2xl bg-[#153e2d] hover:bg-[#1a4a37] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md border border-emerald-600/50"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Color PDF'}</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
