import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { ProjectFolder, ActivityNotification, DataVaultBackup, ProjectFile, FolderReview, FolderChatMessage } from './types';
import { INITIAL_FOLDERS, INITIAL_NOTIFICATIONS, COMPANY_INFO } from './sample-data';
import { 
  getGoogleDriveAccessToken, 
  uploadFileToGoogleDrive, 
  getOrCreateRootVaultFolder, 
  getOrCreateProjectDriveFolder, 
  saveProjectJsonToDrive,
  deleteFileFromGoogleDrive,
  deleteFolderFromGoogleDrive
} from './googleDrive';

const FOLDERS_COLLECTION = 'vasthusilpy_project_folders';
const NOTIFICATIONS_COLLECTION = 'vasthusilpy_notifications';
const LOCAL_STORAGE_KEY_FOLDERS = 'vasthusilpy_cached_folders_v1';
const LOCAL_STORAGE_KEY_NOTIFS = 'vasthusilpy_cached_notifications_v1';
const LOCAL_STORAGE_KEY_AUTH = 'vasthusilpy_auth_session_v1';

// In-memory fallback if Firestore is initializing or offline
let memoryFolders: ProjectFolder[] = [...INITIAL_FOLDERS];
let memoryNotifications: ActivityNotification[] = [...INITIAL_NOTIFICATIONS];

export interface AuthSession {
  role: 'admin' | 'client' | 'guest';
  mobile: string;
  name: string;
  folderId?: string;
  token?: string;
  loginTime: string;
}

// Load cached data from browser if present
export function initializeStorage() {
  if (typeof window === 'undefined') return;
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_FOLDERS);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        memoryFolders = parsed;
      }
    }

    const cachedNotifs = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIFS);
    if (cachedNotifs) {
      const parsedNotifs = JSON.parse(cachedNotifs);
      if (Array.isArray(parsedNotifs)) {
        memoryNotifications = parsedNotifs;
      }
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

// Save local cache
function persistLocal() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_FOLDERS, JSON.stringify(memoryFolders));
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFS, JSON.stringify(memoryNotifications));
  } catch (e) {
    console.warn('Failed to persist local cache:', e);
  }
}

// Add activity notification
export async function addNotification(notif: Omit<ActivityNotification, 'id' | 'timestamp' | 'read'>) {
  const newNotif: ActivityNotification = {
    ...notif,
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    read: false,
  };

  memoryNotifications = [newNotif, ...memoryNotifications].slice(0, 50);
  persistLocal();

  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, newNotif.id);
    await setDoc(notifRef, newNotif);
  } catch (e) {
    // silently continue with local memory
  }

  return newNotif;
}

// Fetch all project folders
export async function getProjectFolders(): Promise<ProjectFolder[]> {
  try {
    const snap = await getDocs(collection(db, FOLDERS_COLLECTION));
    if (!snap.empty) {
      const folders: ProjectFolder[] = [];
      snap.forEach((d) => {
        const data = d.data() as ProjectFolder;
        if (data && data.id) {
          folders.push(data);
        }
      });
      if (folders.length > 0) {
        memoryFolders = folders;
        persistLocal();
        return folders;
      }
    }
  } catch (e) {
    console.warn('Firestore fetch fallback to memory:', e);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_FOLDERS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryFolders = parsed;
        }
      } catch (err) {}
    }
  }
  return memoryFolders;
}

// Subscribe to real-time folder updates
export function subscribeToProjectFolders(callback: (folders: ProjectFolder[]) => void) {
  // immediately call with local state
  callback(memoryFolders);

  try {
    const colRef = collection(db, FOLDERS_COLLECTION);
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const folders: ProjectFolder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ProjectFolder;
          if (data && data.id) {
            folders.push(data);
          }
        });
        if (folders.length > 0 || snapshot.size === 0) {
          memoryFolders = folders;
          persistLocal();
          callback(folders);
        }
      },
      (error) => {
        console.warn('Snapshot listener error, using local state:', error);
        callback(memoryFolders);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Firestore subscription failed, using local polling:', err);
    return () => {};
  }
}

// Seed initial data to Firestore (only if INITIAL_FOLDERS has items)
export async function seedInitialData() {
  try {
    for (const folder of INITIAL_FOLDERS) {
      const folderRef = doc(db, FOLDERS_COLLECTION, folder.id);
      await setDoc(folderRef, folder, { merge: true });
    }
    for (const notif of INITIAL_NOTIFICATIONS) {
      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notif.id);
      await setDoc(notifRef, notif, { merge: true });
    }
  } catch (err) {
    console.warn('Seeding initial data to Firestore failed:', err);
  }
}

// Clear all folders and files (Admin reset)
export async function clearAllProjectFolders(): Promise<void> {
  const toDelete = [...memoryFolders];
  memoryFolders = [];
  persistLocal();
  for (const f of toDelete) {
    try {
      const folderRef = doc(db, FOLDERS_COLLECTION, f.id);
      await deleteDoc(folderRef);
    } catch (e) {}
  }
  await addNotification({
    type: 'file_delete',
    title: 'All Project Folders Cleared',
    description: 'Clean slate established. Ready to create your own folders.',
    actor: 'Admin'
  });
}

// Save or Update a folder
export async function saveProjectFolder(folder: ProjectFolder): Promise<void> {
  folder.updatedAt = new Date().toISOString();
  
  // Update memory & local cache
  const idx = memoryFolders.findIndex((f) => f.id === folder.id);
  if (idx >= 0) {
    memoryFolders[idx] = folder;
  } else {
    memoryFolders.unshift(folder);
  }
  persistLocal();

  try {
    const folderRef = doc(db, FOLDERS_COLLECTION, folder.id);
    await setDoc(folderRef, folder, { merge: true });
  } catch (err) {
    console.warn('Firestore save error, saved locally:', err);
  }

  // If Google Drive token is present, ensure root and project folder exist and save metadata snapshot
  const driveToken = getGoogleDriveAccessToken();
  if (driveToken) {
    (async () => {
      try {
        const rootVault = await getOrCreateRootVaultFolder(driveToken);
        const projectDrive = await getOrCreateProjectDriveFolder(driveToken, rootVault.id, folder);
        if (folder.driveFolderId !== projectDrive.id || folder.driveFolderUrl !== projectDrive.webViewLink) {
          folder.driveFolderId = projectDrive.id;
          folder.driveFolderUrl = projectDrive.webViewLink;
          folder.driveSynced = true;
          folder.driveSyncDate = new Date().toISOString();
          persistLocal();
          const fRef = doc(db, FOLDERS_COLLECTION, folder.id);
          await setDoc(fRef, { 
            driveFolderId: projectDrive.id, 
            driveFolderUrl: projectDrive.webViewLink,
            driveSynced: true,
            driveSyncDate: folder.driveSyncDate
          }, { merge: true });
        }
        await saveProjectJsonToDrive(driveToken, projectDrive.id, folder);
      } catch (driveErr) {
        console.warn('Background Google Drive folder sync notice:', driveErr);
      }
    })();
  }

  // Trigger sync notification
  await addNotification({
    folderId: folder.id,
    folderName: folder.folderName,
    type: 'file_update',
    title: `Folder Updated: ${folder.folderName}`,
    description: `Details and attachments synchronized.`,
    actor: 'Admin'
  });
}

// Update existing folder attributes (Admin only)
export async function updateProjectFolder(folderId: string, updates: Partial<ProjectFolder>): Promise<ProjectFolder | null> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    Object.assign(folder, updates);
    folder.updatedAt = new Date().toISOString();
    await saveProjectFolder(folder);
    return folder;
  }
  return null;
}

// Delete a folder
export async function deleteProjectFolder(folderId: string): Promise<void> {
  const target = memoryFolders.find((f) => f.id === folderId);
  memoryFolders = memoryFolders.filter((f) => f.id !== folderId);
  persistLocal();

  try {
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await deleteDoc(folderRef);
  } catch (err) {
    console.warn('Firestore delete error, removed locally:', err);
  }

  // Delete from Google Drive if synced and token available
  const driveToken = getGoogleDriveAccessToken();
  if (driveToken && target?.driveFolderId) {
    deleteFolderFromGoogleDrive(driveToken, target.driveFolderId).catch((err) => {
      console.warn('Drive folder delete error:', err);
    });
  }

  if (target) {
    await addNotification({
      folderId,
      folderName: target.folderName,
      type: 'file_delete',
      title: `Folder Deleted: ${target.folderName}`,
      description: `Project folder and related files removed by Admin.`,
      actor: 'Admin'
    });
  }
}

// Add a file to a folder
export async function addFileToFolder(folderId: string, file: Omit<ProjectFile, 'id' | 'uploadedAt'>): Promise<ProjectFile> {
  const newFile: ProjectFile = {
    ...file,
    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    uploadedAt: new Date().toISOString()
  };

  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    if (newFile.isCover || !folder.coverImageUrl) {
      if (newFile.fileUrl.startsWith('http') || newFile.fileUrl.startsWith('data:image') || newFile.fileUrl.startsWith('blob:')) {
        folder.coverImageUrl = newFile.fileUrl;
      }
    }
    folder.files = [newFile, ...folder.files];
    saveProjectFolder(folder).catch(() => {});

    // If Google Drive token is present, upload file to project subfolder on Drive in detached promise
    const driveToken = getGoogleDriveAccessToken();
    if (driveToken) {
      (async () => {
        try {
          const rootVault = await getOrCreateRootVaultFolder(driveToken);
          const projectDrive = await getOrCreateProjectDriveFolder(driveToken, rootVault.id, folder);
          const uploadRes = await uploadFileToGoogleDrive(
            driveToken,
            projectDrive.id,
            newFile.name,
            newFile.fileUrl,
            newFile.category
          );
          newFile.driveFileId = uploadRes.id;
          newFile.driveWebViewLink = uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`;
          newFile.driveDownloadLink = uploadRes.webContentLink;
          folder.driveFolderId = projectDrive.id;
          folder.driveFolderUrl = projectDrive.webViewLink;
          folder.driveSynced = true;
          folder.driveSyncDate = new Date().toISOString();
          persistLocal();
          const folderRef = doc(db, FOLDERS_COLLECTION, folder.id);
          await setDoc(folderRef, folder, { merge: true });
        } catch (e) {
          console.warn('Background Google Drive upload notice:', e);
        }
      })();
    }

    addNotification({
      folderId: folder.id,
      folderName: folder.folderName,
      type: 'file_upload',
      title: `New File: ${newFile.name}`,
      description: `${newFile.category} uploaded to ${folder.folderName}.`,
      actor: newFile.uploadedBy
    }).catch(() => {});
  }

  return newFile;
}

// Add batch files to a folder instantly
export async function addBatchFilesToFolder(folderId: string, files: Array<Omit<ProjectFile, 'id' | 'uploadedAt'>>): Promise<ProjectFile[]> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (!folder) return [];

  const createdFiles: ProjectFile[] = files.map((file, idx) => ({
    ...file,
    id: 'f_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
    uploadedAt: new Date().toISOString()
  }));

  const coverCandidate = createdFiles.find(f => f.isCover) || (!folder.coverImageUrl ? createdFiles.find(f => f.fileUrl.startsWith('http') || f.fileUrl.startsWith('data:image') || f.fileUrl.startsWith('blob:')) : undefined);
  if (coverCandidate) {
    folder.coverImageUrl = coverCandidate.fileUrl;
  }

  folder.files = [...createdFiles, ...folder.files];
  saveProjectFolder(folder).catch(() => {});

  // Background Google Drive Upload
  const driveToken = getGoogleDriveAccessToken();
  if (driveToken) {
    (async () => {
      try {
        const rootVault = await getOrCreateRootVaultFolder(driveToken);
        const projectDrive = await getOrCreateProjectDriveFolder(driveToken, rootVault.id, folder);
        for (const f of createdFiles) {
          try {
            const uploadRes = await uploadFileToGoogleDrive(
              driveToken,
              projectDrive.id,
              f.name,
              f.fileUrl,
              f.category
            );
            f.driveFileId = uploadRes.id;
            f.driveWebViewLink = uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`;
            f.driveDownloadLink = uploadRes.webContentLink;
          } catch (itemErr) {}
        }
        folder.driveFolderId = projectDrive.id;
        folder.driveFolderUrl = projectDrive.webViewLink;
        folder.driveSynced = true;
        folder.driveSyncDate = new Date().toISOString();
        persistLocal();
        const folderRef = doc(db, FOLDERS_COLLECTION, folder.id);
        await setDoc(folderRef, folder, { merge: true });
      } catch (e) {
        console.warn('Background Google Drive batch upload notice:', e);
      }
    })();
  }

  addNotification({
    folderId: folder.id,
    folderName: folder.folderName,
    type: 'file_upload',
    title: `${createdFiles.length} New Files Uploaded`,
    description: `Batch files added to ${folder.folderName}.`,
    actor: 'Admin'
  }).catch(() => {});

  return createdFiles;
}

// Delete a file from folder
export async function deleteFileFromFolder(folderId: string, fileId: string): Promise<void> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    const file = folder.files.find((f) => f.id === fileId);
    folder.files = folder.files.filter((f) => f.id !== fileId);
    
    // If cover image was deleted, fallback to next image file
    if (file && folder.coverImageUrl === file.fileUrl) {
      const nextImg = folder.files.find((f) => f.type === '3d-render' || f.type === 'photo' || f.type === 'blueprint');
      folder.coverImageUrl = nextImg ? nextImg.fileUrl : undefined;
    }

    await saveProjectFolder(folder);

    // If file was synced to Google Drive, remove it from Drive
    const driveToken = getGoogleDriveAccessToken();
    if (driveToken && file?.driveFileId) {
      deleteFileFromGoogleDrive(driveToken, file.driveFileId).catch((err) => {
        console.warn('Drive file delete error:', err);
      });
    }

    if (file) {
      await addNotification({
        folderId: folder.id,
        folderName: folder.folderName,
        type: 'file_delete',
        title: `File Deleted: ${file.name}`,
        description: `Removed from ${folder.folderName}.`,
        actor: 'Admin'
      });
    }
  }
}

// Update an existing file's details in a folder (Admin only)
export async function updateFileInFolder(
  folderId: string, 
  fileId: string, 
  updates: Partial<ProjectFile>
): Promise<ProjectFile | null> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder && folder.files) {
    const fileIndex = folder.files.findIndex((f) => f.id === fileId);
    if (fileIndex >= 0) {
      const currentFile = folder.files[fileIndex];
      const updatedFile: ProjectFile = {
        ...currentFile,
        ...updates
      };
      
      folder.files[fileIndex] = updatedFile;
      
      // If marked as cover
      if (updates.isCover) {
        folder.coverImageUrl = updatedFile.fileUrl;
        folder.files.forEach((f) => {
          f.isCover = f.id === fileId;
        });
      } else if (updates.isCover === false && folder.coverImageUrl === currentFile.fileUrl) {
        const nextImg = folder.files.find((f) => f.id !== fileId && (f.type === '3d-render' || f.type === 'photo' || f.type === 'blueprint'));
        folder.coverImageUrl = nextImg ? nextImg.fileUrl : undefined;
      }

      await saveProjectFolder(folder);

      await addNotification({
        folderId: folder.id,
        folderName: folder.folderName,
        type: 'file_update',
        title: `File Updated: ${updatedFile.name}`,
        description: `Modified category or details in ${folder.folderName}.`,
        actor: 'Admin'
      });

      return updatedFile;
    }
  }
  return null;
}

// Set cover file
export async function setFolderCoverImage(folderId: string, imageUrl: string): Promise<void> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    folder.coverImageUrl = imageUrl;
    folder.files.forEach((f) => {
      f.isCover = (f.fileUrl === imageUrl);
    });
    await saveProjectFolder(folder);
  }
}

// Admin Reset Client Password
export async function resetClientPassword(folderId: string, newPassword: string): Promise<boolean> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    folder.customPassword = newPassword;
    await saveProjectFolder(folder);
    await addNotification({
      folderId: folder.id,
      folderName: folder.folderName,
      type: 'password_reset',
      title: `Password Reset for ${folder.clientName}`,
      description: `Client access password updated for mobile ${folder.clientMobile}.`,
      actor: 'Admin'
    });
    return true;
  }
  return false;
}

// Add Review with Star Rating
export async function addFolderReview(folderId: string, review: Omit<FolderReview, 'id' | 'createdAt' | 'verified'>): Promise<FolderReview> {
  const newReview: FolderReview = {
    ...review,
    id: 'rev_' + Date.now(),
    createdAt: new Date().toISOString(),
    verified: true
  };

  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    folder.reviews = [newReview, ...folder.reviews];
    await saveProjectFolder(folder);

    await addNotification({
      folderId: folder.id,
      folderName: folder.folderName,
      type: 'review_added',
      title: `${newReview.rating}-Star Review by ${newReview.clientName}`,
      description: `"${newReview.comment.slice(0, 60)}..."`,
      actor: newReview.clientName
    });
  }

  return newReview;
}

// Send Message in Folder Chat (Text, Audio, Attachments)
export async function sendFolderChatMessage(folderId: string, message: Omit<FolderChatMessage, 'id' | 'createdAt'>): Promise<FolderChatMessage> {
  const newMsg: FolderChatMessage = {
    ...message,
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    isDone: false
  };

  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder) {
    if (!folder.chatMessages) folder.chatMessages = [];
    folder.chatMessages.push(newMsg);
    await saveProjectFolder(folder);

    await addNotification({
      folderId: folder.id,
      folderName: folder.folderName,
      type: 'chat_message',
      title: `Message from ${newMsg.senderName}`,
      description: newMsg.text ? newMsg.text.slice(0, 60) : (newMsg.audioUrl ? '🎤 Voice message recorded' : '📎 Attachment sent'),
      actor: newMsg.senderName
    });
  }

  return newMsg;
}

// Mark Message as DONE by Admin
export async function toggleMessageDoneStatus(folderId: string, messageId: string, isDone: boolean): Promise<void> {
  const folder = memoryFolders.find((f) => f.id === folderId);
  if (folder && folder.chatMessages) {
    const msg = folder.chatMessages.find((m) => m.id === messageId);
    if (msg) {
      msg.isDone = isDone;
      msg.doneAt = isDone ? new Date().toISOString() : undefined;
      await saveProjectFolder(folder);
    }
  }
}

// Export Backup for "VASTHUSILPY - DATA VAULT"
export function createDataVaultBackup(): DataVaultBackup {
  let totalFiles = 0;
  memoryFolders.forEach((f) => {
    totalFiles += (f.files ? f.files.length : 0);
  });

  return {
    exportDate: new Date().toISOString(),
    version: '2.0.0',
    company: COMPANY_INFO.fullName,
    folderCount: memoryFolders.length,
    totalFiles,
    folders: memoryFolders
  };
}

// Restore Data from Backup
export async function restoreDataVaultBackup(backup: DataVaultBackup): Promise<number> {
  if (!backup || !Array.isArray(backup.folders)) {
    throw new Error('Invalid backup data format');
  }

  memoryFolders = backup.folders;
  persistLocal();

  for (const folder of backup.folders) {
    try {
      const folderRef = doc(db, FOLDERS_COLLECTION, folder.id);
      await setDoc(folderRef, folder, { merge: true });
    } catch (e) {
      console.warn('Failed restoring folder to Firestore:', folder.id);
    }
  }

  await addNotification({
    type: 'drive_sync',
    title: 'Data Vault Restored Successfully',
    description: `Restored ${backup.folders.length} project folders from backup archive.`,
    actor: 'Admin'
  });

  return backup.folders.length;
}

// Auth State Helpers
export function getSavedAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(session));
  } catch (e) {}
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
  } catch (e) {}
}
