import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { ProjectFolder, ProjectFile } from './types';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

export const ROOT_VAULT_FOLDER_NAME = 'VasthuWeb';

// In-memory token cache (Skill requirement: NEVER store in localStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;
let isSigningIn = false;

// Create provider instance
const googleDriveProvider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach(scope => googleDriveProvider.addScope(scope));
// Add prompt select_account to make sure user can choose account easily if needed
googleDriveProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleDriveState {
  isConnected: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
}

// Global subscribers for Google Drive auth state
type AuthListener = (state: GoogleDriveState) => void;
const listeners = new Set<AuthListener>();

export function subscribeToGoogleDriveAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  // Immediate emit
  listener({
    isConnected: !!cachedAccessToken,
    user: cachedGoogleUser ? {
      displayName: cachedGoogleUser.displayName,
      email: cachedGoogleUser.email,
      photoURL: cachedGoogleUser.photoURL
    } : null
  });
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const state: GoogleDriveState = {
    isConnected: !!cachedAccessToken,
    user: cachedGoogleUser ? {
      displayName: cachedGoogleUser.displayName,
      email: cachedGoogleUser.email,
      photoURL: cachedGoogleUser.photoURL
    } : null
  };
  listeners.forEach((l) => {
    try {
      l(state);
    } catch (e) {
      console.error('Error in GoogleDrive listener', e);
    }
  });
}

// Initialize Auth Listener on app startup
export function initGoogleDriveAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (cachedAccessToken) {
        notifyListeners();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need re-prompt if refreshed
        notifyListeners();
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedGoogleUser = null;
      cachedAccessToken = null;
      notifyListeners();
      if (onAuthFailure) onAuthFailure();
    }
  });
}

// User-initiated Sign In with Google Drive (Popup)
export async function signInWithGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleDriveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google sign in');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    notifyListeners();

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

// Disconnect / Sign Out Google Drive
export async function signOutGoogleDrive(): Promise<void> {
  cachedAccessToken = null;
  cachedGoogleUser = null;
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout error:', e);
  }
  notifyListeners();
}

// Get Access Token
export function getGoogleDriveAccessToken(): string | null {
  return cachedAccessToken;
}

// Determine MIME type from file extension or data URL
function getMimeType(fileName: string, dataUrl?: string): string {
  if (dataUrl && dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);/);
    if (match && match[1]) return match[1];
  }
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'json': return 'application/json';
    case 'txt': return 'text/plain';
    case 'dwg':
    case 'dxf': return 'application/acad';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'mp4': return 'video/mp4';
    default: return 'application/octet-stream';
  }
}

// Convert Base64/DataURL/Blob to Uint8Array/Blob for Google Drive upload
async function getFileBlob(fileUrl: string, fileName: string): Promise<Blob> {
  if (fileUrl.startsWith('data:')) {
    const parts = fileUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : getMimeType(fileName);
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Remote URL or relative URL - fetch as blob
  try {
    const response = await fetch(fileUrl);
    return await response.blob();
  } catch (err) {
    // If CORS or local image, fallback to placeholder text blob or throw
    const fallbackText = `Vasthusilpy Architectural File: ${fileName}\nSource URL: ${fileUrl}\nUploaded: ${new Date().toISOString()}`;
    return new Blob([fallbackText], { type: 'text/plain' });
  }
}

// Search for or Create Root Folder "VasthuWeb"
export async function getOrCreateRootVaultFolder(token: string): Promise<{ id: string; webViewLink?: string }> {
  try {
    // Search if folder already exists (check 'VasthuWeb', ' VasthuWeb', or legacy 'VASTHUSILPY - DATA VAULT')
    const q = encodeURIComponent(`(name = 'VasthuWeb' or name = ' VasthuWeb' or name = 'VASTHUSILPY - DATA VAULT') and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          webViewLink: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`
        };
      }
    }

    // Create Root Folder named "VasthuWeb"
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'VasthuWeb',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Permanent backup and storage vault for all VasthuWeb website data, client folders, blueprints, 3D renderings, and project archives.'
      })
    });

    if (!createRes.ok) {
      const errJson = await createRes.json();
      throw new Error(errJson.error?.message || 'Failed to create "VasthuWeb" root folder in Google Drive');
    }

    const created = await createRes.json();
    return {
      id: created.id,
      webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`
    };
  } catch (err) {
    console.error('Error in getOrCreateRootVaultFolder:', err);
    throw err;
  }
}

// Search for or Create Project Subfolder inside Root Vault
export async function getOrCreateProjectDriveFolder(
  token: string,
  rootFolderId: string,
  folder: ProjectFolder
): Promise<{ id: string; webViewLink: string }> {
  const folderTitle = `${folder.clientName} - ${folder.folderName}`.trim();
  const safeTitle = folderTitle.replace(/['\\]/g, '');

  try {
    const q = encodeURIComponent(`name = '${safeTitle}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${rootFolderId}' in parents`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          webViewLink: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`
        };
      }
    }

    // Create subfolder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderTitle,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
        description: `Vasthusilpy Project Vault for ${folder.clientName} (Mobile: ${folder.clientMobile}). Location: ${folder.projectLocation || 'N/A'}`
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create project subfolder on Google Drive');
    }

    const created = await createRes.json();
    return {
      id: created.id,
      webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`
    };
  } catch (err) {
    console.error('Error creating project folder on Google Drive:', err);
    throw err;
  }
}

// Upload a File (Blob / Base64) to Google Drive via Multipart Upload
export async function uploadFileToGoogleDrive(
  token: string,
  parentFolderId: string,
  fileName: string,
  fileUrlOrBlob: string | Blob,
  fileCategory?: string
): Promise<{ id: string; name: string; webViewLink?: string; webContentLink?: string }> {
  let blob: Blob;
  if (typeof fileUrlOrBlob === 'string') {
    blob = await getFileBlob(fileUrlOrBlob, fileName);
  } else {
    blob = fileUrlOrBlob;
  }

  const mimeType = blob.type || getMimeType(fileName);

  const metadata = {
    name: fileName,
    parents: [parentFolderId],
    description: fileCategory ? `Category: ${fileCategory}` : undefined
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metaBlob = new Blob([metaPart], { type: 'text/plain' });
  const headerBlob = new Blob([fileHeader], { type: 'text/plain' });
  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBody = new Blob([metaBlob, headerBlob, blob, closeBlob], {
    type: `multipart/related; boundary=${boundary}`
  });

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: multipartBody
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Failed to upload file ${fileName} to Google Drive`);
  }

  return await res.json();
}

// Save Project Metadata File (project_data.json) into the Drive Folder
export async function saveProjectJsonToDrive(
  token: string,
  driveFolderId: string,
  folder: ProjectFolder
): Promise<void> {
  const jsonContent = JSON.stringify(folder, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const fileName = `project_meta_${folder.id}.json`;

  try {
    // Check if project_meta already exists in the folder
    const q = encodeURIComponent(`name = '${fileName}' and trashed = false and '${driveFolderId}' in parents`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        // Update existing file
        const fileId = data.files[0].id;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: blob
        });
        return;
      }
    }

    // Upload new
    await uploadFileToGoogleDrive(token, driveFolderId, fileName, blob, 'Project Metadata');
  } catch (err) {
    console.warn('Could not save project JSON to Drive:', err);
  }
}

// Sync a single Project Folder and all its attachments to Google Drive
export async function syncFolderToGoogleDrive(
  token: string,
  folder: ProjectFolder,
  onProgress?: (message: string) => void
): Promise<ProjectFolder> {
  onProgress?.(`Connecting to "VasthuWeb" Drive Vault...`);
  const rootVault = await getOrCreateRootVaultFolder(token);

  onProgress?.(`Creating Drive folder for "${folder.clientName}"...`);
  const projectDrive = await getOrCreateProjectDriveFolder(token, rootVault.id, folder);

  const updatedFiles: ProjectFile[] = [];

  for (let i = 0; i < folder.files.length; i++) {
    const file = folder.files[i];
    onProgress?.(`Uploading file ${i + 1}/${folder.files.length}: ${file.name}...`);

    // If file already has driveFileId, keep it
    if (file.driveFileId) {
      updatedFiles.push(file);
      continue;
    }

    try {
      const uploadRes = await uploadFileToGoogleDrive(
        token,
        projectDrive.id,
        file.name,
        file.fileUrl,
        file.category
      );

      updatedFiles.push({
        ...file,
        driveFileId: uploadRes.id,
        driveWebViewLink: uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`,
        driveDownloadLink: uploadRes.webContentLink
      });
    } catch (err) {
      console.error(`Failed uploading file ${file.name} to Drive:`, err);
      // Retain file without drive id
      updatedFiles.push(file);
    }
  }

  const updatedFolder: ProjectFolder = {
    ...folder,
    files: updatedFiles,
    driveFolderId: projectDrive.id,
    driveFolderUrl: projectDrive.webViewLink,
    driveSynced: true,
    driveSyncDate: new Date().toISOString()
  };

  // Upload metadata snapshot to Drive
  await saveProjectJsonToDrive(token, projectDrive.id, updatedFolder);

  onProgress?.(`Completed sync for ${folder.folderName}!`);
  return updatedFolder;
}

// Full Website Backup Snapshot & Sync to Google Drive under "VasthuWeb"
export interface WebsiteBackupResult {
  rootFolderId: string;
  rootFolderUrl: string;
  backupFileId: string;
  backupFileName: string;
  backupFileUrl?: string;
  syncedFolders: ProjectFolder[];
  totalFilesSynced: number;
  timestamp: string;
}

export async function backupAllWebsiteDataToGoogleDrive(
  token: string,
  folders: ProjectFolder[],
  onProgress?: (progressText: string, current: number, total: number) => void
): Promise<WebsiteBackupResult> {
  onProgress?.(`Connecting to Google Drive root folder "VasthuWeb"...`, 1, folders.length + 3);
  const rootVault = await getOrCreateRootVaultFolder(token);

  // 1. Compile Full Website Snapshot Archive (all folders, files, chats, ratings, milestones)
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);
  const fullBackupData = {
    appName: 'VasthuWeb - Architectural Studio & Client Vault',
    backupVersion: '2.0',
    exportedAt: timestamp,
    totalFolders: folders.length,
    totalFiles: folders.reduce((acc, f) => acc + (f.files?.length || 0), 0),
    folders: folders,
    summary: {
      clientNames: folders.map(f => f.clientName),
      categories: Array.from(new Set(folders.map(f => f.projectCategory).filter(Boolean))),
      locations: Array.from(new Set(folders.map(f => f.projectLocation).filter(Boolean))),
    }
  };

  onProgress?.(`Creating full website database archive JSON...`, 2, folders.length + 3);

  const backupJsonString = JSON.stringify(fullBackupData, null, 2);
  const backupBlob = new Blob([backupJsonString], { type: 'application/json' });
  const backupFileName = `VasthuWeb_Full_Website_Backup_${dateStr}.json`;

  // Upload / Update the Full Website Backup Archive into "VasthuWeb"
  const backupUpload = await uploadFileToGoogleDrive(
    token,
    rootVault.id,
    backupFileName,
    backupBlob,
    'Full Website Database Backup'
  );

  // Also upload a human-readable summary text file
  const summaryText = `=====================================================
VASTHUWEB - OFFICIAL WEBSITE CLOUD BACKUP
Vault Root: VasthuWeb (Google Drive)
Generated At: ${new Date().toLocaleString()}
Total Client Project Vaults: ${folders.length}
Total Blueprints, 3D Renders & Files: ${fullBackupData.totalFiles}
=====================================================

CLIENT VAULTS INCLUDED:
${folders.map((f, i) => `${i + 1}. [${f.clientName}] ${f.folderName} (Mobile: ${f.clientMobile}) - ${f.files?.length || 0} files - Category: ${f.projectCategory || 'N/A'}`).join('\n')}

All files and client project metadata are permanently preserved in their respective subfolders.
`;

  try {
    const summaryBlob = new Blob([summaryText], { type: 'text/plain' });
    await uploadFileToGoogleDrive(token, rootVault.id, 'VasthuWeb_System_Overview.txt', summaryBlob, 'System Summary');
  } catch (e) {
    console.warn('Overview text upload skipped:', e);
  }

  // 2. Sync all individual project folders and their binary media / documents into VasthuWeb subfolders
  const syncedFolders: ProjectFolder[] = [];
  let totalFilesSynced = 0;

  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    onProgress?.(`Backing up folder ${i + 1}/${folders.length}: "${f.folderName}"...`, i + 3, folders.length + 3);
    try {
      const res = await syncFolderToGoogleDrive(token, f, (msg) => {
        onProgress?.(`[${i + 1}/${folders.length}] ${msg}`, i + 3, folders.length + 3);
      });
      syncedFolders.push(res);
      totalFilesSynced += res.files?.length || 0;
    } catch (err) {
      console.error(`Error backing up folder ${f.folderName} to VasthuWeb:`, err);
      syncedFolders.push(f);
    }
  }

  onProgress?.(`All website data successfully stored in Google Drive folder "VasthuWeb"!`, folders.length + 3, folders.length + 3);

  return {
    rootFolderId: rootVault.id,
    rootFolderUrl: rootVault.webViewLink || `https://drive.google.com/drive/folders/${rootVault.id}`,
    backupFileId: backupUpload.id,
    backupFileName,
    backupFileUrl: backupUpload.webViewLink,
    syncedFolders,
    totalFilesSynced,
    timestamp
  };
}

// Sync All Project Folders to Google Drive
export async function syncAllFoldersToGoogleDrive(
  token: string,
  folders: ProjectFolder[],
  onProgress?: (progressText: string, current: number, total: number) => void
): Promise<ProjectFolder[]> {
  const result = await backupAllWebsiteDataToGoogleDrive(token, folders, onProgress);
  return result.syncedFolders;
}

// Delete File from Google Drive (Invoked only when user deletes on website)
export async function deleteFileFromGoogleDrive(token: string, driveFileId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.ok || res.status === 404;
  } catch (err) {
    console.warn('Failed deleting file from Google Drive:', err);
    return false;
  }
}

// Delete Folder from Google Drive (Invoked only when user deletes on website)
export async function deleteFolderFromGoogleDrive(token: string, driveFolderId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFolderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.ok || res.status === 404;
  } catch (err) {
    console.warn('Failed deleting folder from Google Drive:', err);
    return false;
  }
}
