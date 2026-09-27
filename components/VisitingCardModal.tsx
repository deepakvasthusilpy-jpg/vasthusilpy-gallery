'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  FileCheck2
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
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);

  // Editable Card Overrides
  const [customClientName, setCustomClientName] = useState(folder.clientName);
  const [customProjectTitle, setCustomProjectTitle] = useState(folder.folderName);
  const [customLocation, setCustomLocation] = useState(folder.projectLocation || 'Keralassery, Palakkad');

  const rawPreviewImage = folder.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85';

  // Base64-safe image for guaranteed html2canvas export without CORS tainting
  const [safeImageSrc, setSafeImageSrc] = useState<string>(() => rawPreviewImage.startsWith('data:') ? rawPreviewImage : '');

  const printSheetRef = useRef<HTMLDivElement>(null);

  // Preload and convert image to Base64 to prevent canvas tainting
  useEffect(() => {
    let isMounted = true;
    if (!rawPreviewImage) return;

    if (rawPreviewImage.startsWith('data:')) {
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          if (isMounted) setSafeImageSrc(dataUrl);
        }
      } catch (err) {
        console.warn('Canvas conversion fallback to original URL:', err);
        if (isMounted) setSafeImageSrc(rawPreviewImage);
      }
    };
    img.onerror = () => {
      if (isMounted) setSafeImageSrc(rawPreviewImage);
    };
    img.src = rawPreviewImage;

    return () => {
      isMounted = false;
    };
  }, [rawPreviewImage]);

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

  // Direct Browser Print Trigger (1-Page A4 Sheet)
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print error:', err);
    }
  };

  // High-Resolution 1-Page A4 Colour PDF Download
  const handleDownloadPDF = async () => {
    if (!printSheetRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    try {
      const element = printSheetRef.current;
      
      // html2canvas capture with safe CORS settings, high DPI, and oklch color sanitizer
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        onclone: (clonedDoc, clonedElement) => {
          // 1. Sanitize all style tags to replace unsupported oklch() color functions
          const styleTags = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styleTags.forEach((tag) => {
            try {
              if (tag.textContent && tag.textContent.includes('oklch')) {
                tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/gi, '#1e293b');
              }
            } catch {
              // ignore
            }
          });

          // 2. Sanitize computed and inline oklch colors on elements inside cloned container
          const allNodes = clonedElement.querySelectorAll('*');
          allNodes.forEach((node) => {
            const el = node as HTMLElement;
            if (!el.style) return;

            try {
              const comp = window.getComputedStyle(el);
              ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach((prop) => {
                const val = (comp as any)[prop];
                if (val && typeof val === 'string' && val.includes('oklch')) {
                  (el.style as any)[prop] = val.includes('255') || val.includes('white') ? '#ffffff' : '#0f172a';
                }
              });

              if (comp.boxShadow && comp.boxShadow.includes('oklch')) {
                el.style.boxShadow = 'none';
              }
            } catch {
              // ignore
            }
          });
        }
      });

      // Export as high quality JPEG
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Standard ISO A4: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfPageWidth = 210;
      const pdfPageHeight = 297;

      // Fit exactly onto 1 single A4 page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight, undefined, 'FAST');
      
      const sanitizedName = (customClientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedName}_Vasthusilpy_Visiting_Card_A4.pdf`;
      
      pdf.save(fileName);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.warn('PDF Generation error handled, triggering browser print fallback:', err);
      // Fallback
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      
      {/* Embedded CSS for Exact 1-Page A4 Colour Print Mode */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
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
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 10mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
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
                  Visiting Card & A4 Print Suite
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Standard Visiting Card (90 × 55 mm)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1-Page A4 Colour PDF • Exact 90×55 mm Visiting Card Dimensions • Chief Architect Deepak C
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
              <span>{isEditingCard ? 'Close Editor' : 'Edit Text'}</span>
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
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-900" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>Download Color PDF</span>
                </>
              )}
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
                  Customize Visiting Card Text
                </span>
                <span className="text-[10px] text-slate-400">Updates live on both Standard Cards</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Client Name</label>
                  <input
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Project Title</label>
                  <input
                    type="text"
                    value={customProjectTitle}
                    onChange={(e) => setCustomProjectTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Site Location</label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRINTABLE EXACT A4 PAGE PREVIEW CONTAINER */}
          <div className="flex justify-center p-2 sm:p-4 bg-slate-200 dark:bg-slate-950 rounded-2xl overflow-x-auto">
            
            {/* The exact 1-Page A4 Sheet (210mm x 297mm in standard aspect ratio) */}
            <div 
              ref={printSheetRef}
              id="printable-a4-page"
              className="bg-white text-slate-900 w-full max-w-[794px] min-h-[1123px] max-h-[1123px] p-6 sm:p-10 shadow-2xl border border-slate-300 relative flex flex-col justify-between box-border overflow-hidden"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              
              {/* TOP HEADER & SPECIFICATIONS GUIDE */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-6 border-b border-dashed border-slate-300 text-slate-500 text-[11px]">
                  <div className="flex items-center gap-2">
                    <BrandLogo className="w-5 h-5 text-emerald-800" />
                    <span className="font-black text-emerald-950 tracking-wider">VASTHUSILPY</span>
                    <span className="text-slate-600 font-medium">• Official Client Visiting Card & Vault Access (1-Page A4 Colour Sheet)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <Scissors className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Standard Visiting Card Size (90mm × 55mm)</span>
                  </div>
                </div>

                {/* CUTTING BOX WITH CORNER CROP MARKS & SIDE-BY-SIDE CARDS */}
                <div className="relative p-4 sm:p-6 border border-slate-300 rounded-2xl bg-slate-50/70 shadow-xs">
                  
                  {/* Corner Crop Marks */}
                  <div className="absolute top-1.5 left-2 text-[12px] text-slate-400 font-mono font-bold select-none">┌</div>
                  <div className="absolute top-1.5 right-2 text-[12px] text-slate-400 font-mono font-bold select-none">┐</div>
                  <div className="absolute bottom-1.5 left-2 text-[12px] text-slate-400 font-mono font-bold select-none">└</div>
                  <div className="absolute bottom-1.5 right-2 text-[12px] text-slate-400 font-mono font-bold select-none">┘</div>
                  
                  {/* Center Vertical Cut / Fold Guideline */}
                  <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 flex-col items-center justify-between pointer-events-none py-2 z-20">
                    <span className="text-[8.5px] text-emerald-900 font-mono font-black bg-white px-2 py-0.5 rounded shadow-xs border border-emerald-300 tracking-wider">
                      ✂ CUT / FOLD
                    </span>
                    <div className="w-[1px] h-full border-r border-dashed border-emerald-400" />
                    <span className="text-[8.5px] text-emerald-900 font-mono bg-white px-1 font-bold">✂</span>
                  </div>

                  {/* SIDE-BY-SIDE EXACT VISITING CARDS (90mm x 55mm Standard Size) */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-5 w-full">
                    
                    {/* ======================================================== */}
                    {/* CARD FRONT SIDE: EXACT STANDARD VISITING CARD (90mm x 55mm) */}
                    {/* ======================================================== */}
                    <div 
                      className="w-[90mm] h-[55mm] min-w-[90mm] max-w-[90mm] min-h-[55mm] max-h-[55mm] shrink-0 rounded-xl overflow-hidden shadow-md flex flex-col justify-between p-3 bg-gradient-to-b from-[#ffffff] via-[#f9faf9] to-[#edf4f0] text-slate-900 border-2 border-[#153e2d] box-border relative"
                      style={{ width: '90mm', height: '55mm' }}
                    >
                      {/* Top Brand Accent Ribbon */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#153e2d] via-[#2d6a4f] to-[#d4af37]" />

                      {/* Header Strip */}
                      <div className="flex items-start justify-between gap-1.5 border-b border-emerald-900/15 pb-1 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#153e2d] to-[#0d281e] text-amber-300 flex items-center justify-center font-black text-[9px] shrink-0 shadow-xs border border-amber-400/40">
                            VA
                          </div>
                          <div>
                            <h4 className="font-black text-[10px] leading-tight tracking-tight text-[#153e2d]">
                              VASTHUSILPY
                            </h4>
                            <span className="text-[6px] font-bold block text-emerald-900 uppercase tracking-wider leading-none mt-0.5">
                              PLANS • 3D DESIGNS • VASTU
                            </span>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <span className="text-[6px] font-black px-1.5 py-0.5 rounded-full bg-[#153e2d] text-amber-200 border border-amber-400/30 shadow-xs shrink-0 uppercase tracking-tight">
                          {folder.projectCategory || 'Architectural Design'}
                        </span>
                      </div>

                      {/* Center: Vibrant 3D House Elevation Showcase */}
                      <div className="my-1 relative w-full h-[98px] rounded-lg overflow-hidden shadow-xs border border-[#153e2d]/30 bg-slate-900">
                        <img
                          src={safeImageSrc || rawPreviewImage}
                          alt="3D Project Preview"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                        {/* Overlay Banner */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 pt-3.5 text-white">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[5.5px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-amber-400 text-black">
                              3D ELEVATION VIEW
                            </span>
                            <span className="text-[6px] font-medium text-amber-200">
                              Client Vault
                            </span>
                          </div>
                          <h5 className="font-black text-[9.5px] text-white truncate leading-tight drop-shadow-sm">
                            {customProjectTitle}
                          </h5>
                          <span className="text-[6.5px] text-emerald-200 block truncate font-medium mt-0.5 flex items-center gap-0.5">
                            <MapPin className="w-2 h-2 text-amber-300 inline shrink-0" />
                            {customLocation}
                          </span>
                        </div>
                      </div>

                      {/* Architectural Services List */}
                      <div className="text-[6px] leading-none text-emerald-950 font-bold border-t border-emerald-900/15 pt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className="text-[#153e2d]">• Landscape</span>
                        <span className="text-[#153e2d]">• Building Plans</span>
                        <span className="text-[#153e2d]">• 3D Elevation</span>
                        <span className="text-[#153e2d]">• Vasthu</span>
                        <span className="text-[#153e2d]">• Survey</span>
                        <span className="text-[#153e2d]">• Permits</span>
                      </div>

                      {/* Footer Contact Info */}
                      <div className="pt-0.5 border-t border-emerald-900/15 flex items-center justify-between text-[6.5px] leading-tight font-medium text-slate-800">
                        <div className="flex items-center gap-0.5 truncate max-w-[170px]">
                          <MapPin className="w-2 h-2 text-emerald-700 shrink-0" />
                          <span className="truncate font-bold text-[#153e2d]">
                            Keralassery, Palakkad
                          </span>
                        </div>
                        <div className="font-mono font-bold text-[#153e2d] shrink-0">
                          📞 9747995961 / 9567627277
                        </div>
                      </div>

                    </div>

                    {/* ======================================================== */}
                    {/* CARD BACK SIDE: EXACT STANDARD VISITING CARD (90mm x 55mm) */}
                    {/* ======================================================== */}
                    <div 
                      className="w-[90mm] h-[55mm] min-w-[90mm] max-w-[90mm] min-h-[55mm] max-h-[55mm] shrink-0 rounded-xl overflow-hidden shadow-md flex flex-col justify-between p-3 bg-gradient-to-b from-[#ffffff] via-[#f9faf9] to-[#edf4f0] text-slate-900 border-2 border-[#153e2d] box-border relative"
                      style={{ width: '90mm', height: '55mm' }}
                    >
                      {/* Top Brand Accent Ribbon */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#d4af37] via-[#2d6a4f] to-[#153e2d]" />

                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-emerald-900/15 pb-1.5 pt-0.5">
                        <div>
                          <span className="text-[6.5px] font-black uppercase tracking-widest text-[#153e2d] flex items-center gap-1">
                            <Lock className="w-2 h-2 text-emerald-700" />
                            VAULT ACCESS CREDENTIALS
                          </span>
                          <span className="text-[9.5px] font-black text-slate-900 truncate max-w-[180px] block mt-0.5">
                            {customClientName}
                          </span>
                        </div>
                        <span className="text-[6.5px] px-2 py-0.5 rounded-full bg-[#153e2d] text-amber-300 font-mono font-bold border border-amber-400/30 shadow-xs">
                          VAULT #{folder.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      {/* Center: Credentials Box & QR Code */}
                      <div className="my-1 grid grid-cols-12 gap-2 items-center">
                        
                        {/* Credentials Details (7 cols) */}
                        <div className="col-span-7 space-y-1.5 text-[7.5px]">
                          <div className="p-2 rounded-lg bg-white border border-emerald-900/25 shadow-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-900 font-bold flex items-center gap-0.5 text-[7px]">
                                <User className="w-2.5 h-2.5 text-emerald-700" /> User ID:
                              </span>
                              <span className="font-mono font-black text-[8.5px] text-slate-900 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                                {folder.clientMobile}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-emerald-100 pt-1">
                              <span className="text-emerald-900 font-bold flex items-center gap-0.5 text-[7px]">
                                <Lock className="w-2.5 h-2.5 text-emerald-700" /> Password:
                              </span>
                              <span className="font-mono font-black text-[8.5px] text-[#153e2d] bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                {showPassword ? folder.customPassword : '••••••••'}
                              </span>
                            </div>
                          </div>

                          <div className="text-[6.5px] text-slate-700 leading-tight bg-emerald-50/90 p-1.5 rounded-md border border-emerald-200/60">
                            <span className="font-bold text-emerald-950">✨ Instant Scan:</span>
                            <span className="block text-slate-700">Scan QR to view 3D blueprints, elevation designs & permit documents.</span>
                          </div>
                        </div>

                        {/* Scannable QR Code (5 cols) */}
                        <div className="col-span-5 flex flex-col items-center justify-center p-1.5 rounded-xl bg-white text-slate-900 border border-[#153e2d] shadow-xs">
                          <QRCodeSVG
                            value={qrData}
                            size={70}
                            level="H"
                            includeMargin={false}
                            fgColor="#153e2d"
                            bgColor="#FFFFFF"
                          />
                          <div className="mt-1 px-1.5 py-0.5 rounded bg-[#153e2d] text-amber-300 text-[5.5px] font-black tracking-tight text-center uppercase">
                            SCAN TO ACCESS
                          </div>
                        </div>

                      </div>

                      {/* Footer: Chief Architect Deepak C */}
                      <div className="border-t border-emerald-900/15 pt-1 flex items-center justify-between text-[6.5px] text-slate-800">
                        <div>
                          <span className="font-black text-[#153e2d] block text-[7.5px] leading-tight">Deepak C</span>
                          <span className="text-slate-600 block text-[5.5px] font-medium leading-none">Chief Architect & Vasthu Consultant</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#153e2d] block text-[7.5px] leading-tight">VASTHUSILPY</span>
                          <span className="text-slate-600 block text-[5.5px] font-medium leading-none">Pathirippala-Kongad Road, Palakkad</span>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* CLEAN A4 BOTTOM NOTE */}
              <div className="border-t border-dashed border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>Vasthusilpy Architectural Studio • Keralassery, Palakkad</span>
                <span>Direct Access: vasthusilpy.com • 9747995961 / 9567627277</span>
              </div>

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
              className="p-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md border border-amber-500 disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <FileCheck2 className="w-4 h-4 text-emerald-900" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Download Color PDF</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
