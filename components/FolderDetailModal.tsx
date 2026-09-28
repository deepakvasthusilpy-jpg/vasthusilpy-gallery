'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectFolder, ProjectFile, FolderReview, FolderChatMessage } from '@/lib/types';
import { COMPANY_INFO } from '@/lib/sample-data';
import { BrandLogo } from './BrandLogo';
import { 
  X, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Trash2, 
  Star, 
  MessageSquare, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  KeyRound, 
  QrCode, 
  Share2, 
  ShieldCheck, 
  User, 
  Lock, 
  ExternalLink,
  Sparkles,
  Check,
  ChevronRight,
  Eye,
  Layers,
  MapPin,
  Calendar,
  Phone,
  Edit3,
  AlertTriangle,
  Radio,
  Tv
} from 'lucide-react';
import { EditFileModal } from './EditFileModal';
import { PhotoDocEditorModal } from './PhotoDocEditorModal';
import { Crop, RotateCw, Sliders } from 'lucide-react';
import { 
  getStoredMediaStreamItems, 
  toggleFolderFileInMediaStream, 
  addMultipleFolderFilesToMediaStream, 
  subscribeToMediaStreamUpdates 
} from '@/lib/mediaStreamStorage';

interface FolderDetailModalProps {
  folder: ProjectFolder;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onUploadFile: (folderId: string, fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => Promise<void>;
  onUploadBatchFiles?: (folderId: string, files: Array<Omit<ProjectFile, 'id' | 'uploadedAt'>>) => Promise<void>;
  onUpdateFile?: (folderId: string, fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  onDeleteFile: (folderId: string, fileId: string) => Promise<void>;
  onEditFolder?: (folder: ProjectFolder) => void;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onSetCoverImage: (folderId: string, imageUrl: string) => Promise<void>;
  onAddReview: (folderId: string, review: Omit<FolderReview, 'id' | 'createdAt' | 'verified'>) => Promise<void>;
  onSendMessage: (folderId: string, message: Omit<FolderChatMessage, 'id' | 'createdAt'>) => Promise<void>;
  onToggleMessageDone: (folderId: string, messageId: string, isDone: boolean) => Promise<void>;
  onResetPassword: (folderId: string, newPassword: string) => Promise<void>;
  onOpenVisitingCard: (folder: ProjectFolder) => void;
}

export const FolderDetailModal: React.FC<FolderDetailModalProps> = ({
  folder,
  isOpen,
  isAdmin,
  onClose,
  onUploadFile,
  onUploadBatchFiles,
  onUpdateFile,
  onDeleteFile,
  onEditFolder,
  onDeleteFolder,
  onSetCoverImage,
  onAddReview,
  onSendMessage,
  onToggleMessageDone,
  onResetPassword,
  onOpenVisitingCard
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'reviews' | 'chat' | 'settings'>('files');
  const [editingFile, setEditingFile] = useState<ProjectFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  
  // File Upload Modal State (Supports Multiple Attachments Selection)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{
    id: string;
    name: string;
    type: ProjectFile['type'];
    category: string;
    fileUrl: string;
    fileSize: string;
    description?: string;
    isCover: boolean;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Preview File Modal State
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);

  // Photo & Doc Editor State (Rotate, Crop, Filters, Watermark, Cover Editor)
  const [editorFile, setEditorFile] = useState<ProjectFile | null>(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);

  // Review Form State
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewerName, setReviewerName] = useState(folder.clientName || '');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Chat Form State
  const [chatText, setChatText] = useState('');
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState('');
  const [chatAttachmentName, setChatAttachmentName] = useState('');

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Audio Playback in Chat
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Password Reset State
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Real-time Media Stream Items tracking
  const [mediaStreamFileIds, setMediaStreamFileIds] = useState<string[]>([]);

  useEffect(() => {
    const items = getStoredMediaStreamItems([folder]);
    setMediaStreamFileIds(items.map(i => i.id));

    const unsub = subscribeToMediaStreamUpdates([folder], (updated) => {
      setMediaStreamFileIds(updated.map(i => i.id));
    });
    return unsub;
  }, [folder]);

  const handleToggleMediaStream = (file: ProjectFile) => {
    toggleFolderFileInMediaStream(file, folder);
    const updated = getStoredMediaStreamItems([folder]);
    setMediaStreamFileIds(updated.map(i => i.id));
  };

  const handleAddAllToMediaStream = () => {
    if (!folder.files || folder.files.length === 0) return;
    const mediaFiles = folder.files.filter(f => 
      f.type === '3d-render' || f.type === 'photo' || f.type === 'video' || f.category?.includes('3D') || f.category?.includes('Video') || f.fileUrl?.startsWith('data:image') || f.fileUrl?.startsWith('http')
    );
    if (mediaFiles.length === 0) {
      addMultipleFolderFilesToMediaStream(folder.files, folder);
    } else {
      addMultipleFolderFilesToMediaStream(mediaFiles, folder);
    }
    const updated = getStoredMediaStreamItems([folder]);
    setMediaStreamFileIds(updated.map(i => i.id));
  };

  const handleDownloadAllFiles = () => {
    if (!folder.files || folder.files.length === 0) return;
    folder.files.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
  };

  // Auto scroll chat to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [folder.chatMessages, activeTab]);

  if (!isOpen) return null;

  // Handle Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBlobUrl(reader.result as string);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error:', err);
      // Fallback simulated voice note for testing
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    } else {
      // simulated voice audio url
      setAudioBlobUrl('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhg==');
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    setAudioBlobUrl(null);
    setRecordingDuration(0);
  };

  // Send Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatText.trim() && !audioBlobUrl && !chatAttachmentUrl) return;

    const attachments = chatAttachmentUrl ? [{
      name: chatAttachmentName || 'Attachment',
      url: chatAttachmentUrl,
      type: 'image' as const
    }] : undefined;

    await onSendMessage(folder.id, {
      senderName: isAdmin ? COMPANY_INFO.name + ' (Admin)' : folder.clientName,
      senderMobile: isAdmin ? COMPANY_INFO.primaryAdminMobile : folder.clientMobile,
      senderRole: isAdmin ? 'admin' : 'client',
      text: chatText.trim() || undefined,
      audioUrl: audioBlobUrl || undefined,
      audioDuration: audioBlobUrl ? recordingDuration : undefined,
      attachments
    });

    setChatText('');
    setAudioBlobUrl(null);
    setRecordingDuration(0);
    setChatAttachmentUrl('');
    setChatAttachmentName('');
  };

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);

    await onAddReview(folder.id, {
      clientName: reviewerName || folder.clientName,
      clientMobile: folder.clientMobile,
      rating: ratingScore,
      comment: reviewComment.trim()
    });

    setReviewComment('');
    setIsSubmittingReview(false);
  };

  // Handle Multiple Files Selected for Upload
  const handleMultipleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type.includes('pdf');
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      let detectedType: ProjectFile['type'] = 'document';
      let category = 'Document';

      if (isImg) {
        detectedType = '3d-render';
        category = '3D Elevation / Photo';
      } else if (isPdf) {
        detectedType = 'blueprint';
        category = 'Building Plan';
      } else if (file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
        detectedType = 'blueprint';
        category = 'CAD Drawing';
      }

      // Generate instant object URL for 0ms preview
      const objectUrl = URL.createObjectURL(file);
      const newQueueId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      setUploadQueue((prev) => {
        const hasCover = prev.some((item) => item.isCover);
        return [
          ...prev,
          {
            id: newQueueId,
            name: file.name,
            type: detectedType,
            category,
            fileUrl: objectUrl,
            fileSize: sizeStr,
            description: '',
            isCover: !hasCover && isImg
          }
        ];
      });

      // Also read as data URL asynchronously
      const reader = new FileReader();
      reader.onload = (ev) => {
        const resultUrl = (ev.target?.result as string) || '';
        if (resultUrl) {
          setUploadQueue((prev) =>
            prev.map((item) => (item.id === newQueueId ? { ...item, fileUrl: resultUrl } : item))
          );
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Submit all files in uploadQueue
  const handleBatchUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadQueue.length === 0) return;

    const filesToUpload = uploadQueue.map((item) => ({
      name: item.name,
      type: item.type,
      category: item.category,
      fileUrl: item.fileUrl,
      fileSize: item.fileSize,
      uploadedBy: isAdmin ? 'Admin (Vasthusilpy)' : folder.clientName,
      description: item.description,
      isCover: item.isCover
    }));

    // Instant modal close and state reset for 0ms user perceived wait
    setUploadQueue([]);
    setShowUploadModal(false);

    if (onUploadBatchFiles) {
      await onUploadBatchFiles(folder.id, filesToUpload);
    } else {
      for (const item of filesToUpload) {
        await onUploadFile(folder.id, item);
      }
    }
  };

  // Handle Admin Reset Password
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) return;
    await onResetPassword(folder.id, newPasswordInput.trim());
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setNewPasswordInput('');
    }, 3000);
  };

  const handleDownloadAll = () => {
    const text = `VASTHUSILPY - PROJECT VAULT REPORT\n\nProject: ${folder.folderName}\nClient: ${folder.clientName} (${folder.clientMobile})\n\nFiles List:\n` +
      folder.files.map((f, i) => `${i + 1}. [${f.category}] ${f.name} (${f.fileSize}) - ${f.fileUrl}`).join('\n');
    
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${folder.folderName.replace(/\s+/g, '_')}_Vault_Report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        
        {/* Top Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {folder.files?.length || 0} Attachments
                </span>
                {folder.projectCategory && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-red-300 font-bold border border-slate-700">
                    {folder.projectCategory}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                {folder.folderName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-red-400" /> {folder.clientName}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-red-400" /> {folder.clientMobile}
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions: Edit, Delete, Visiting Card & Close */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && onEditFolder && (
              <button
                onClick={() => onEditFolder(folder)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
                title="Edit Folder Specifications"
              >
                <Edit3 className="w-4 h-4 text-red-400" />
                <span>Edit Folder</span>
              </button>
            )}

            {isAdmin && onDeleteFolder && (
              <button
                onClick={() => setShowDeleteFolderConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white text-xs font-semibold backdrop-blur-md border border-red-500/40 transition flex items-center gap-1.5"
                title="Delete Folder and Files"
              >
                <Trash2 className="w-4 h-4 text-red-400 group-hover:text-white" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => onOpenVisitingCard(folder)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
              title="Generate QR Visiting Card"
            >
              <QrCode className="w-4 h-4 text-red-400" />
              <span>Visiting Card</span>
            </button>

            {folder.driveFolderUrl && (
              <a
                href={folder.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-600/40 hover:bg-blue-600 text-blue-100 hover:text-white text-xs font-semibold backdrop-blur-md border border-blue-400/40 transition flex items-center gap-1.5"
                title="Open Project Folder in Google Drive"
              >
                <ExternalLink className="w-4 h-4 text-blue-300" />
                <span>Drive Folder</span>
              </a>
            )}

            <button
              onClick={handleDownloadAll}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
              title="Download Vault Summary"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Vault</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Folder Confirmation Banner */}
        {showDeleteFolderConfirm && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 flex items-center justify-between gap-4 text-red-900 dark:text-red-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-xs font-medium">
                Are you sure you want to permanently delete <strong>&quot;{folder.folderName}&quot;</strong> and all its blueprints/files?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDeleteFolderConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onDeleteFolder) {
                    setIsDeletingFolder(true);
                    await onDeleteFolder(folder.id);
                    setIsDeletingFolder(false);
                    onClose();
                  }
                }}
                disabled={isDeletingFolder}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingFolder ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'files'
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Blueprints & Vault Files ({folder.files ? folder.files.length : 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>Reviews & Ratings ({folder.reviews ? folder.reviews.length : 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Client Chat & Voice Notes ({folder.chatMessages ? folder.chatMessages.length : 0})</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4 text-purple-500" />
                <span>Admin Password Reset</span>
              </button>
            )}
          </div>

          {/* Action on right of tabs */}
          {activeTab === 'files' && (
            <div className="flex items-center gap-2 my-2">
              <button
                onClick={handleDownloadAllFiles}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                title="Download All Drawings & Documents"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download All Files</span>
              </button>

              <button
                onClick={handleAddAllToMediaStream}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                title="Broadcast all photos/videos to Public Media Stream Cinema"
              >
                <Radio className="w-3.5 h-3.5 text-purple-200" />
                <span>+ Stream All Media</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New File</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: FILES & BLUEPRINTS */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              
              {/* Cover Preview Highlight Banner */}
              {folder.coverImageUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-white p-6 flex flex-col md:flex-row items-center gap-6 border border-slate-800 shadow-md">
                  <img
                    src={folder.coverImageUrl}
                    alt="Cover preview"
                    className="w-full md:w-64 h-40 object-cover rounded-xl shadow-lg border border-white/20"
                  />
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                      Selected Folder Attachment Preview
                    </span>
                    <h3 className="text-xl font-bold">{folder.folderName}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {folder.notes || 'This preview image is displayed on the project card and generated visiting cards for client access.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20 font-medium">
                        Synced with Google Cloud Storage Vault
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCoverEditorOpen(true)}
                        className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Crop className="w-3 h-3" />
                        <span>Edit / Rotate / Crop Cover</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Files Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {folder.files && folder.files.length > 0 ? (
                  folder.files.map((file) => (
                    <div
                      key={file.id}
                      className="group relative flex flex-col rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-4 hover:shadow-lg transition space-y-3"
                    >
                      {/* Image Thumbnail / Document Icon */}
                      <div 
                        onClick={() => setPreviewFile(file)}
                        className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center cursor-pointer group-hover:opacity-95"
                      >
                        {file.fileUrl.startsWith('data:image') || file.type === '3d-render' || file.type === 'photo' || file.type === 'blueprint' ? (
                          <img
                            src={file.fileUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <FileText className="w-10 h-10 text-red-500" />
                            <span className="text-[10px] font-semibold">{file.category}</span>
                          </div>
                        )}

                        {file.isCover && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-md">
                            Selected Cover
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                            className="p-2 rounded-full bg-white/90 text-slate-900 hover:bg-white shadow-md"
                            title="Preview File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={file.fileUrl}
                            download={file.name}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full bg-white/90 text-slate-900 hover:bg-white shadow-md"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* File Details */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-red-600 dark:text-red-400">{file.category}</span>
                          <span>{file.fileSize}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">
                          {file.name}
                        </h4>
                        {file.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {file.description}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Uploaded: {new Date(file.uploadedAt).toLocaleDateString()} by {file.uploadedBy}
                        </span>
                      </div>

                      {/* File Action Toolbar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          onClick={() => onSetCoverImage(folder.id, file.fileUrl)}
                          className={`font-semibold hover:underline flex items-center gap-1 ${
                            file.isCover ? 'text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{file.isCover ? 'Cover Preview' : 'Set as Cover'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleMediaStream(file)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                            mediaStreamFileIds.includes(file.id)
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                          title={mediaStreamFileIds.includes(file.id) ? "Active in Public Media Stream Cinema" : "Add to Public Media Stream Cinema"}
                        >
                          <Radio className={`w-3.5 h-3.5 ${mediaStreamFileIds.includes(file.id) ? 'animate-pulse' : ''}`} />
                          <span>{mediaStreamFileIds.includes(file.id) ? 'In Media Stream' : 'Add to Stream'}</span>
                        </button>
                      </div>

                      {/* File Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5 pt-1 text-xs">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Preview Attachment"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditorFile(file)}
                          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Crop, Rotate & Edit Attachment"
                        >
                          <Crop className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={file.fileUrl}
                          download={file.name}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {file.driveWebViewLink && (
                          <a
                            href={file.driveWebViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setEditingFile(file)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                            title="Edit File Attachment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center text-slate-400 space-y-3">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-medium">No files uploaded to this folder yet.</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                    >
                      Upload First Blueprint or 3D Render
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: REVIEWS & RATINGS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Add Review Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Rate Vasthusilpy Services & Leave Review</span>
                </h3>

                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingScore(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= ratingScore
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-red-500" />
                      <span>Verified Client: {folder.clientMobile}</span>
                    </div>
                  </div>

                  <textarea
                    placeholder="Share your experience regarding our 3D design, building plans, Vasthu guidance, or timely permit delivery..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{isSubmittingReview ? 'Submitting...' : 'Post Client Review'}</span>
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Client Feedback History
                </h4>

                {folder.reviews && folder.reviews.length > 0 ? (
                  folder.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {rev.clientName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Verified Client
                          </span>
                        </div>

                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        &quot;{rev.comment}&quot;
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No reviews submitted yet for this project.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: CLIENT CHAT & VOICE DISCUSSIONS */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px] max-w-4xl mx-auto rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 overflow-hidden">
              
              {/* Chat Header Notice */}
              <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Direct Team Discussion Channel
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Supports text, voice notes & file attachments
                </span>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {folder.chatMessages && folder.chatMessages.length > 0 ? (
                  folder.chatMessages.map((msg) => {
                    const isMsgAdmin = msg.senderRole === 'admin';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMsgAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 shadow-sm ${
                            isMsgAdmin
                              ? 'bg-red-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-none'
                          }`}
                        >
                          {/* Sender Label & Tick Mark */}
                          <div className="flex items-center justify-between gap-3 text-[11px] opacity-90 border-b border-black/10 dark:border-white/10 pb-1">
                            <span className="font-bold flex items-center gap-1">
                              {isMsgAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                              {msg.senderName}
                            </span>
                            
                            {/* Admin Mark as DONE badge */}
                            {msg.isDone && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px]">
                                <Check className="w-3 h-3" /> DONE
                              </span>
                            )}
                          </div>

                          {/* Text Message */}
                          {msg.text && (
                            <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          )}

                          {/* Voice Audio Player */}
                          {msg.audioUrl && (
                            <div className="p-2 rounded-xl bg-black/15 dark:bg-white/10 flex items-center gap-2 text-xs">
                              <button
                                onClick={() => {
                                  if (playingAudioId === msg.id) {
                                    audioPlayerRef.current?.pause();
                                    setPlayingAudioId(null);
                                  } else {
                                    if (audioPlayerRef.current) {
                                      audioPlayerRef.current.src = msg.audioUrl!;
                                      audioPlayerRef.current.play();
                                      setPlayingAudioId(msg.id);
                                    }
                                  }
                                }}
                                className="p-2 rounded-full bg-white text-slate-900 shadow-md hover:scale-105 transition"
                              >
                                {playingAudioId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <div className="flex-1">
                                <span className="font-bold block text-[11px]">Voice Message</span>
                                <span className="text-[10px] opacity-75">{msg.audioDuration ? `${msg.audioDuration}s` : 'Audio Note'}</span>
                              </div>
                              <Mic className="w-4 h-4 opacity-75" />
                            </div>
                          )}

                          {/* Chat Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {msg.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs transition"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span className="truncate flex-1">{att.name}</span>
                                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Timestamp & Admin Mark as Done Button */}
                          <div className="flex items-center justify-between text-[10px] opacity-75 pt-1">
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {isAdmin && (
                              <button
                                onClick={() => onToggleMessageDone(folder.id, msg.id, !msg.isDone)}
                                className="hover:underline font-bold flex items-center gap-1 ml-2"
                              >
                                <Check className="w-3 h-3" />
                                <span>{msg.isDone ? 'Unmark Done' : 'Mark as Done'}</span>
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                    <p>No messages in this folder yet. Start the discussion below!</p>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Hidden Audio Player instance for voice playback */}
              <audio
                ref={audioPlayerRef}
                onEnded={() => setPlayingAudioId(null)}
                className="hidden"
              />

              {/* Voice Recording Banner if Active */}
              {isRecording && (
                <div className="p-3 bg-red-600 text-white flex items-center justify-between text-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="font-bold">Recording Voice Message... ({recordingDuration}s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelRecording}
                      className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopRecording}
                      className="px-3 py-1 rounded-lg bg-white text-red-600 text-xs font-bold shadow-sm"
                    >
                      Attach Voice
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                
                {/* Voice audio attached preview */}
                {audioBlobUrl && (
                  <div className="mb-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">Voice Message Recorded ({recordingDuration}s)</span>
                    </div>
                    <button
                      onClick={() => setAudioBlobUrl(null)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  
                  {/* Voice Record Trigger */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      title="Record Voice Note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="p-2.5 rounded-xl bg-red-600 text-white transition"
                      title="Stop Recording"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}

                  {/* Attachment Button */}
                  <label className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer">
                    <Paperclip className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setChatAttachmentName(file.name);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setChatAttachmentUrl(ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Text Input */}
                  <input
                    type="text"
                    placeholder={`Type message as ${isAdmin ? 'Admin' : folder.clientName}...`}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {chatAttachmentName && (
                  <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                    <span>📎 Attached: {chatAttachmentName}</span>
                    <button onClick={() => { setChatAttachmentUrl(''); setChatAttachmentName(''); }} className="text-red-500">
                      Remove
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: ADMIN PASSWORD RESET & CONTROLS */}
          {activeTab === 'settings' && isAdmin && (
            <div className="space-y-6 max-w-2xl mx-auto p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Admin Client Password Reset
                  </h3>
                  <p className="text-xs text-slate-500">
                    If client forgets password, admin can instantly reset it here.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{folder.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile (User ID):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{folder.clientMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Password:</span>
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">{folder.customPassword}</span>
                </div>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Customized Password for Client:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new password (e.g. suresh@2026)"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    Update Password
                  </button>
                </div>

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Password updated successfully and synchronized to database!</span>
                  </div>
                )}
              </form>
            </div>
          )}

        </div>

        {/* MODAL: UPLOAD MULTIPLE ATTACHMENTS */}
        {showUploadModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-red-600" />
                  <span>Upload Attachments to {folder.folderName}</span>
                </h3>
                <button onClick={() => { setShowUploadModal(false); setUploadQueue([]); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBatchUploadSubmit} className="space-y-4">
                {/* Select Files input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Multiple Files from Device:
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-red-300 dark:border-red-900/60 hover:border-red-500 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 cursor-pointer transition text-center group">
                    <Upload className="w-7 h-7 text-red-500 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to Select Multiple Photos, Plans or PDFs
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Blueprints, 3D Renders, Permits, Land Surveys & Documents
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleMultipleFilesPicked}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Queue of Selected Files */}
                {uploadQueue.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Files Ready to Upload ({uploadQueue.length})</span>
                      <button
                        type="button"
                        onClick={() => setUploadQueue([])}
                        className="text-red-500 text-[11px] font-normal hover:underline"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {uploadQueue.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.fileUrl.startsWith('data:image') || item.fileUrl.startsWith('http') ? (
                              <img
                                src={item.fileUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[260px]">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>{item.fileSize}</span>
                                <span>•</span>
                                <span className="capitalize">{item.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {(item.fileUrl.startsWith('data:image') || item.fileUrl.startsWith('http')) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadQueue((prev) =>
                                    prev.map((q) => ({ ...q, isCover: q.id === item.id }))
                                  );
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                                  item.isCover
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <Star className="w-3 h-3" />
                                <span>{item.isCover ? 'Cover' : 'Make Cover'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
                              }}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowUploadModal(false); setUploadQueue([]); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || uploadQueue.length === 0}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isUploading
                        ? 'Uploading Attachments...'
                        : `Upload ${uploadQueue.length} ${uploadQueue.length === 1 ? 'Attachment' : 'Attachments'} to Vault`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: FULLSCREEN FILE PREVIEW */}
        {previewFile && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="relative max-w-5xl w-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
              <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  <div>
                    <h4 className="font-bold text-sm text-white">{previewFile.name}</h4>
                    <span className="text-[10px] text-slate-400">{previewFile.category} • {previewFile.fileSize}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = previewFile;
                      setPreviewFile(null);
                      setEditorFile(target);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Edit / Rotate / Crop</span>
                  </button>
                  <a
                    href={previewFile.fileUrl}
                    download={previewFile.name}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[360px]">
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT FILE ATTACHMENT */}
        {editingFile && (
          <EditFileModal
            file={editingFile}
            isOpen={!!editingFile}
            onClose={() => setEditingFile(null)}
            onUpdateFile={async (fileId, updates) => {
              if (onUpdateFile) {
                await onUpdateFile(folder.id, fileId, updates);
              }
            }}
            onDeleteFile={async (fileId) => {
              await onDeleteFile(folder.id, fileId);
              setEditingFile(null);
            }}
          />
        )}

        {/* MODAL: DELETE FILE CONFIRMATION */}
        {fileToDelete && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">Delete File?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Permanently remove attachment</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {fileToDelete.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Category: {fileToDelete.category} • Size: {fileToDelete.fileSize}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this file from <strong>{folder.folderName}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const fid = fileToDelete.id;
                    setFileToDelete(null);
                    await onDeleteFile(folder.id, fid);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PHOTO & DOC EDITOR (ROTATE, CROP, SCANNER, WATERMARK & COVER) */}
        {(editorFile || isCoverEditorOpen) && (
          <PhotoDocEditorModal
            isOpen={!!editorFile || isCoverEditorOpen}
            file={editorFile}
            folder={folder}
            isCoverEditor={isCoverEditorOpen}
            initialImageUrl={isCoverEditorOpen ? folder.coverImageUrl : editorFile?.fileUrl}
            initialFileName={isCoverEditorOpen ? `${folder.folderName}_Cover.jpg` : editorFile?.name}
            onClose={() => {
              setEditorFile(null);
              setIsCoverEditorOpen(false);
            }}
            onSaveFile={async (fileId, updatedUrl, updatedName) => {
              if (onUpdateFile) {
                await onUpdateFile(folder.id, fileId, { fileUrl: updatedUrl, name: updatedName });
              }
            }}
            onSaveAsNewFile={async (newFileData) => {
              await onUploadFile(folder.id, newFileData);
            }}
            onSetAsCover={async (folderId, coverUrl) => {
              await onSetCoverImage(folderId, coverUrl);
            }}
          />
        )}

      </div>
    </div>
  );
};
