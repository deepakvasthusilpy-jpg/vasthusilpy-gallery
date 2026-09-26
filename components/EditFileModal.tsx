'use client';

import React, { useState } from 'react';
import { ProjectFile } from '@/lib/types';
import { 
  X, 
  Edit3, 
  FileText, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Upload,
  Crop
} from 'lucide-react';
import { PhotoDocEditorModal } from './PhotoDocEditorModal';

interface EditFileModalProps {
  file: ProjectFile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFile: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
}

interface InnerEditFormProps {
  file: ProjectFile;
  onClose: () => void;
  onUpdateFile: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
}

const EditFileModalContent: React.FC<InnerEditFormProps> = ({
  file,
  onClose,
  onUpdateFile,
  onDeleteFile
}) => {
  const [fileName, setFileName] = useState(file.name || '');
  const [category, setCategory] = useState<ProjectFile['category']>(file.category || '3D Design');
  const [fileType, setFileType] = useState<ProjectFile['type']>(file.type || '3d-render');
  const [fileUrl, setFileUrl] = useState(file.fileUrl || '');
  const [fileSize, setFileSize] = useState(file.fileSize || '2.5 MB');
  const [description, setDescription] = useState(file.description || '');
  const [isCover, setIsCover] = useState(!!file.isCover);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFile = e.target.files?.[0];
    if (pickedFile) {
      setFileName(pickedFile.name);
      setFileSize((pickedFile.size / (1024 * 1024)).toFixed(1) + ' MB');
      
      if (pickedFile.type.includes('image')) {
        setFileType('3d-render');
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) setFileUrl(ev.target.result as string);
        };
        reader.readAsDataURL(pickedFile);
      } else if (pickedFile.type.includes('pdf')) {
        setFileType('blueprint');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsSubmitting(true);
    await onUpdateFile(file.id, {
      name: fileName.trim(),
      category,
      type: fileType,
      fileUrl: fileUrl.trim() || file.fileUrl,
      fileSize: fileSize.trim() || file.fileSize,
      description: description.trim(),
      isCover
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDeleteFile(file.id);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Edit File Attachment
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Update blueprint category, cover status, or replace file.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner if toggled */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 dark:bg-red-950/80 border-b border-red-200 dark:border-red-800 flex items-start justify-between gap-3 text-red-900 dark:text-red-200 animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-950 dark:text-red-100">Delete this file?</h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  <strong>&quot;{file.name}&quot;</strong> will be permanently removed from this project folder.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* File Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              File / Blueprint Title *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Ground Floor Vasthu Layout Draft.dwg"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="3D Design">3D Design</option>
                <option value="Building Plans">Building Plans</option>
                <option value="Vasthu Consultation">Vasthu Consultation</option>
                <option value="Building Permit">Building Permit</option>
                <option value="Land Survey">Land Survey</option>
                <option value="Valuation Certificate">Valuation Certificate</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                File Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="3d-render">3D Render Image</option>
                <option value="blueprint">Blueprint / CAD PDF</option>
                <option value="doc">Document / Certificate</option>
                <option value="photo">Site Photo</option>
                <option value="other">Other File</option>
              </select>
            </div>
          </div>

          {/* File Size & File URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                File / Image URL
              </label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                File Size
              </label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="e.g. 4.2 MB"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Replace file & Crop/Rotate Studio buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition">
              <Upload className="w-3.5 h-3.5 text-red-500" />
              <span>Replace File with Local Upload</span>
              <input
                type="file"
                onChange={handleFilePicked}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsPhotoEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800 transition cursor-pointer"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Rotate, Crop & Edit In Studio</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Verified Vasthu layout approved by Deepak C with Pooja room East orientation."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Set as Cover Checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="edit-is-cover"
              checked={isCover}
              onChange={(e) => setIsCover(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
            />
            <label htmlFor="edit-is-cover" className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Set as Folder Attachment Preview & Visiting Card Cover</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold transition flex items-center gap-1.5 border border-red-200 dark:border-red-800"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete File</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save File Changes'}</span>
              </button>
            </div>
          </div>

        </form>

        {/* PHOTO & DOC STUDIO MODAL */}
        {isPhotoEditorOpen && (
          <PhotoDocEditorModal
            isOpen={isPhotoEditorOpen}
            file={file}
            initialImageUrl={fileUrl || file.fileUrl}
            initialFileName={fileName || file.name}
            onClose={() => setIsPhotoEditorOpen(false)}
            onSaveFile={async (fileId, updatedUrl, updatedName) => {
              setFileUrl(updatedUrl);
              if (updatedName) setFileName(updatedName);
              setIsPhotoEditorOpen(false);
            }}
          />
        )}

      </div>
    </div>
  );
};

export const EditFileModal: React.FC<EditFileModalProps> = ({
  file,
  isOpen,
  onClose,
  onUpdateFile,
  onDeleteFile
}) => {
  if (!isOpen || !file) return null;

  return (
    <EditFileModalContent
      key={file.id}
      file={file}
      onClose={onClose}
      onUpdateFile={onUpdateFile}
      onDeleteFile={onDeleteFile}
    />
  );
};
