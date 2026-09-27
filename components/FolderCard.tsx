'use client';

import React, { useState } from 'react';
import { ProjectFolder } from '@/lib/types';
import { 
  Folder, 
  FileText, 
  Star, 
  Calendar, 
  Phone, 
  QrCode, 
  MessageSquare, 
  Share2, 
  Lock, 
  Eye, 
  Trash2, 
  KeyRound, 
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  Cloud,
  ExternalLink
} from 'lucide-react';

interface FolderCardProps {
  folder: ProjectFolder;
  isAdmin: boolean;
  onOpenFolder: (folder: ProjectFolder) => void;
  onOpenVisitingCard: (folder: ProjectFolder) => void;
  onEditFolder?: (folder: ProjectFolder) => void;
  onResetPassword?: (folder: ProjectFolder) => void;
  onDeleteFolder?: (folderId: string) => void;
  onShareWhatsApp: (folder: ProjectFolder) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  isAdmin,
  onOpenFolder,
  onOpenVisitingCard,
  onEditFolder,
  onResetPassword,
  onDeleteFolder,
  onShareWhatsApp
}) => {
  const [showPass, setShowPass] = useState(false);

  // Calculate average rating
  const avgRating = folder.reviews && folder.reviews.length > 0
    ? (folder.reviews.reduce((acc, r) => acc + r.rating, 0) / folder.reviews.length).toFixed(1)
    : '5.0';

  const fileCount = folder.files ? folder.files.length : 0;
  const unreadMsgCount = folder.chatMessages ? folder.chatMessages.filter(m => !m.isDone).length : 0;

  return (
    <div className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-red-500/40 transition-all duration-300 overflow-hidden">
      
      {/* Top Preview Attachment Image with Hover Zoom */}
      <div 
        onClick={() => onOpenFolder(folder)}
        className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
      >
        {folder.coverImageUrl ? (
          <img
            src={folder.coverImageUrl}
            alt={folder.folderName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
            <Folder className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
            <span className="text-xs">No attachment preview uploaded</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges: Category & File Count */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {folder.projectCategory ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
              <span>{folder.projectCategory}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-600/80 backdrop-blur-md text-white border border-white/20">
              <span>Vault</span>
            </span>
          )}

          <div className="flex items-center gap-1">
            {folder.driveFolderUrl && (
              <a
                href={folder.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md text-white border border-white/20 flex items-center gap-1 transition"
                title="Open in Google Drive"
              >
                <Cloud className="w-3 h-3" />
                <span>Drive</span>
              </a>
            )}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
              {fileCount} {fileCount === 1 ? 'File' : 'Files'}
            </span>
          </div>
        </div>

        {/* Bottom Banner on Image: Client Name */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <div className="font-bold flex items-center gap-1.5 drop-shadow">
            <Folder className="w-4 h-4 text-red-400" />
            <span className="truncate max-w-[200px]">{folder.clientName}</span>
          </div>
        </div>
      </div>

      {/* Folder Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Title and Details */}
        <div className="space-y-2">
          <h3 
            onClick={() => onOpenFolder(folder)}
            className="font-black text-base text-slate-900 dark:text-white leading-snug hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
          >
            {folder.folderName}
          </h3>

          {/* Client Phone & Creation Date */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-red-500" />
              <span className="font-mono font-medium">{folder.clientMobile}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 justify-end">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(folder.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Client Password Pill (Admin can see or reset) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Password:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {showPass ? folder.customPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPass(!showPass)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Rating & Reviews Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">
              {avgRating}
            </span>
            <span className="text-[10px] text-slate-400">
              ({folder.reviews?.length || 1})
            </span>
          </div>

          {unreadMsgCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
              <MessageSquare className="w-3 h-3" />
              {unreadMsgCount} open
            </span>
          )}
        </div>

        {/* Card Action Buttons Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          
          {/* Open Vault Folder */}
          <button
            onClick={() => onOpenFolder(folder)}
            className="col-span-2 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Open Vault</span>
          </button>

          {/* Visiting Card Generator */}
          <button
            onClick={() => onOpenVisitingCard(folder)}
            className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition"
            title="Generate QR Visiting Card"
          >
            <QrCode className="w-3.5 h-3.5 text-red-500" />
            <span>Card</span>
          </button>

          {/* Share on WhatsApp */}
          <button
            onClick={() => onShareWhatsApp(folder)}
            className="py-2 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1 transition border border-emerald-200 dark:border-emerald-800"
            title="Share Access on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

        </div>

        {/* Admin Quick Options (Edit Folder, Reset password, Delete) */}
        {isAdmin && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              {onEditFolder && (
                <button
                  onClick={() => onEditFolder(folder)}
                  className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-semibold flex items-center gap-1 transition"
                  title="Edit Folder Details"
                >
                  <Edit3 className="w-3 h-3 text-red-500" /> Edit
                </button>
              )}

              {onResetPassword && (
                <button
                  onClick={() => onResetPassword(folder)}
                  className="hover:text-red-600 flex items-center gap-1 transition text-slate-500"
                  title="Reset Client Password"
                >
                  <KeyRound className="w-3 h-3" /> Password
                </button>
              )}
            </div>

            {onDeleteFolder && (
              <button
                onClick={() => onDeleteFolder(folder.id)}
                className="hover:text-red-600 flex items-center gap-1 transition text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-1.5 py-0.5 rounded-md"
                title="Delete Project Folder"
              >
                <Trash2 className="w-3 h-3 text-red-500" /> Delete
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
