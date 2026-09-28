'use client';

import { ProjectFolder, ProjectFile } from './types';

export interface MediaStreamItem {
  id: string;
  name: string;
  fileUrl: string;
  type: 'image' | 'video';
  category: string;
  folderName?: string;
  clientName?: string;
  fileSize?: string;
  durationSeconds?: number; // 5s for images, dynamic for videos
  addedAt?: string;
}

export const STORAGE_MEDIA_STREAM_KEY = 'vasthusilpy_media_stream_playlist_v2';
export const MEDIA_STREAM_UPDATE_EVENT = 'vasthusilpy_media_stream_updated';

// Curated default architectural showcase items
export const CURATED_MEDIA_SHOWCASE_ITEMS: MediaStreamItem[] = [
  {
    id: 'stream-demo-1',
    name: 'Palakkad Contemporary Luxury Villa 3D Elevation.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
    type: 'image',
    category: '3D Elevation Design',
    folderName: 'Palakkad Luxury Villa',
    clientName: 'Vasthusilpy Portfolio',
    fileSize: '4.8 MB',
    durationSeconds: 5,
    addedAt: '2026-03-20'
  },
  {
    id: 'stream-demo-video-walkthrough',
    name: 'Cinematic 3D Video Walkthrough & Virtual Tour.mp4',
    fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-design-39908-large.mp4',
    type: 'video',
    category: '3D Video Walkthrough',
    folderName: 'Modern Residence Tour',
    clientName: 'Vasthusilpy Portfolio',
    fileSize: '18.4 MB',
    addedAt: '2026-03-21'
  },
  {
    id: 'stream-demo-2',
    name: 'Traditional Kerala Nalukettu Courtyard & Vasthu Alignment.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80',
    type: 'image',
    category: 'Kerala Heritage & Vasthu',
    folderName: 'Heritage Nalukettu Villa',
    clientName: 'Vasthusilpy Portfolio',
    fileSize: '5.2 MB',
    durationSeconds: 5,
    addedAt: '2026-03-22'
  },
  {
    id: 'stream-demo-3',
    name: 'Modern Commercial Complex & CAD Structural Blueprint.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&auto=format&fit=crop&q=80',
    type: 'image',
    category: 'Commercial Architecture',
    folderName: 'Commercial Complex Keralassery',
    clientName: 'Vasthusilpy Portfolio',
    fileSize: '6.1 MB',
    durationSeconds: 5,
    addedAt: '2026-03-23'
  }
];

// Extract default media items from folders (images and videos only)
export function getDefaultMediaStreamItems(folders: ProjectFolder[] = []): MediaStreamItem[] {
  const items: MediaStreamItem[] = [];

  folders.forEach((folder) => {
    folder.files?.forEach((file) => {
      const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.webm');
      const isImg = file.type === '3d-render' || file.type === 'photo' || file.fileUrl?.startsWith('data:image') || file.name.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i);

      if (isVid || isImg) {
        items.push({
          id: file.id,
          name: file.name,
          fileUrl: file.fileUrl,
          type: isVid ? 'video' : 'image',
          category: file.category || (isVid ? '3D Video Walkthrough' : '3D Elevation Design'),
          folderName: folder.folderName,
          clientName: folder.clientName,
          fileSize: file.fileSize,
          durationSeconds: isVid ? undefined : 5,
          addedAt: file.uploadedAt || new Date().toISOString()
        });
      }
    });
  });

  if (items.length === 0) {
    return [...CURATED_MEDIA_SHOWCASE_ITEMS];
  }

  // Prepend curated showcase video if folders only have images
  const hasVideo = items.some((i) => i.type === 'video');
  if (!hasVideo) {
    const defaultVideo = CURATED_MEDIA_SHOWCASE_ITEMS.find((i) => i.type === 'video');
    if (defaultVideo) {
      return [defaultVideo, ...items];
    }
  }

  return items;
}

// Get the authoritative list of Media Stream items from storage.
// IMPORTANT: If user deleted files, returns ONLY the remaining files in storage. Never resurrects deleted files!
export function getStoredMediaStreamItems(folders: ProjectFolder[] = []): MediaStreamItem[] {
  if (typeof window === 'undefined') {
    return getDefaultMediaStreamItems(folders);
  }

  try {
    const raw = localStorage.getItem(STORAGE_MEDIA_STREAM_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Return exactly what is in storage (even if empty, or filtered by user deletions)
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading media stream storage:', e);
  }

  // Initial load when never modified by user: set defaults and persist
  const defaults = getDefaultMediaStreamItems(folders);
  try {
    localStorage.setItem(STORAGE_MEDIA_STREAM_KEY, JSON.stringify(defaults));
  } catch (e) {
    // ignore
  }
  return defaults;
}

// Save the authoritative Media Stream playlist and broadcast update to all listening components
export function saveStoredMediaStreamItems(items: MediaStreamItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_MEDIA_STREAM_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(MEDIA_STREAM_UPDATE_EVENT, { detail: items }));
  } catch (e) {
    console.warn('Error saving media stream playlist:', e);
  }
}

// Subscribe to real-time changes made to the media stream playlist
export function subscribeToMediaStreamUpdates(
  folders: ProjectFolder[],
  callback: (items: MediaStreamItem[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<MediaStreamItem[]>;
    if (customEvent.detail && Array.isArray(customEvent.detail)) {
      callback(customEvent.detail);
    } else {
      callback(getStoredMediaStreamItems(folders));
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_MEDIA_STREAM_KEY) {
      callback(getStoredMediaStreamItems(folders));
    }
  };

  window.addEventListener(MEDIA_STREAM_UPDATE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(MEDIA_STREAM_UPDATE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// Check if a file is currently in the public Media Stream playlist
export function isFolderFileInMediaStream(fileId: string): boolean {
  if (typeof window === 'undefined') return false;
  const items = getStoredMediaStreamItems();
  return items.some((item) => item.id === fileId);
}

// Add or toggle a file in the Media Stream
export function toggleFolderFileInMediaStream(file: ProjectFile, folder: ProjectFolder): boolean {
  const current = getStoredMediaStreamItems([folder]);
  const exists = current.some((item) => item.id === file.id);

  if (exists) {
    const updated = current.filter((item) => item.id !== file.id);
    saveStoredMediaStreamItems(updated);
    return false;
  } else {
    const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video') || file.name.endsWith('.mp4');
    const newItem: MediaStreamItem = {
      id: file.id,
      name: file.name,
      fileUrl: file.fileUrl,
      type: isVid ? 'video' : 'image',
      category: file.category || (isVid ? '3D Video Walkthrough' : '3D Elevation Design'),
      folderName: folder.folderName,
      clientName: folder.clientName,
      fileSize: file.fileSize,
      durationSeconds: isVid ? undefined : 5,
      addedAt: new Date().toISOString()
    };
    saveStoredMediaStreamItems([newItem, ...current]);
    return true;
  }
}

// Add multiple files from a folder to the Media Stream
export function addMultipleFolderFilesToMediaStream(files: ProjectFile[], folder: ProjectFolder): void {
  const current = getStoredMediaStreamItems([folder]);
  const newItems: MediaStreamItem[] = [];

  files.forEach((file) => {
    if (!current.some((item) => item.id === file.id) && !newItems.some((item) => item.id === file.id)) {
      const isVid = file.type === 'video' || file.category?.toLowerCase().includes('video') || file.name.endsWith('.mp4');
      newItems.push({
        id: file.id,
        name: file.name,
        fileUrl: file.fileUrl,
        type: isVid ? 'video' : 'image',
        category: file.category || (isVid ? '3D Video Walkthrough' : '3D Elevation Design'),
        folderName: folder.folderName,
        clientName: folder.clientName,
        fileSize: file.fileSize,
        durationSeconds: isVid ? undefined : 5,
        addedAt: new Date().toISOString()
      });
    }
  });

  if (newItems.length > 0) {
    saveStoredMediaStreamItems([...newItems, ...current]);
  }
}

