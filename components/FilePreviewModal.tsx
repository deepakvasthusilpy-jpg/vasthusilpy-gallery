'use client';

import React from 'react';
import { ProjectFile, ProjectFolder } from '@/lib/types';
import { 
  X, 
  Share2, 
  Trash2, 
  MoreVertical, 
  Download, 
  Eye, 
  FileText, 
  Calendar, 
  Folder,
  QrCode,
  Sparkles
} from 'lucide-react';

interface FilePreviewModalProps {
  file: ProjectFile | null;
  parentFolder?: ProjectFolder | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onDeleteFile?: (fileId: string) => void;
  onOpenVisitingCard?: (folder: ProjectFolder) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  parentFolder,
  isOpen,
  isAdmin,
  onClose,
  onDeleteFile,
  onOpenVisitingCard
}) => {
  if (!isOpen || !file) return null;

  const isImage = file.type === '3d-render' || file.type === 'photo' || file.fileUrl.startsWith('data:image') || file.fileUrl.startsWith('http');

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `Check out ${file.name} on VASTHUSILPY Architectural Vault`,
          url: window.location.href
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Main Preview Frame */}
        <div className="relative w-full max-h-[68vh] min-h-[320px] bg-slate-950 flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img
              src={file.fileUrl}
              alt={file.name}
              className="w-full h-full object-contain max-h-[68vh]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="p-12 text-center text-white space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-white/10 mx-auto flex items-center justify-center text-red-400">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold">{file.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{file.fileSize} · {file.category}</p>
            </div>
          )}

          {/* Close Button Top Right (matching Image 5) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Metadata & Controls Bar (matching Image 5) */}
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {file.name}
            </h3>
            
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>·</span>
              <span>{file.fileSize}</span>
              {parentFolder && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    📁 {parentFolder.folderName}
                  </span>
                </>
              )}
            </div>

            {/* Category Tag pill matching Image 5 */}
            <div className="pt-2">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] dark:bg-sky-950 dark:text-sky-300">
                {file.category || 'Attachment'}
              </span>
            </div>
          </div>

          {/* Action Icons matching Image 5: Share, Delete, Download, etc. */}
          <div className="flex items-center gap-2">
            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Share File"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download */}
            <a
              href={file.fileUrl}
              download={file.name}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Visiting Card Shortcut */}
            {parentFolder && onOpenVisitingCard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVisitingCard(parentFolder);
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Generate QR Visiting Card"
              >
                <QrCode className="w-4 h-4 text-red-500" />
              </button>
            )}

            {/* Delete (if admin) */}
            {isAdmin && onDeleteFile && (
              <button
                onClick={() => {
                  onDeleteFile(file.id);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-600 transition"
                title="Delete File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
