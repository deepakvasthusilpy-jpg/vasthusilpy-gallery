export interface ProjectFile {
  id: string;
  name: string;
  type: 'blueprint' | '3d-render' | 'document' | 'permit' | 'valuation' | 'survey' | 'video' | 'photo';
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  category: string;
  description?: string;
  isCover?: boolean;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveDownloadLink?: string;
}

export interface FolderReview {
  id: string;
  clientName: string;
  clientMobile: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verified: boolean;
}

export interface ChatAttachment {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'audio' | 'doc';
  size?: string;
}

export interface FolderChatMessage {
  id: string;
  senderName: string;
  senderMobile: string;
  senderRole: 'admin' | 'client';
  text?: string;
  audioUrl?: string; // base64 or blob url for voice messages
  audioDuration?: number; // in seconds
  attachments?: ChatAttachment[];
  isDone?: boolean; // Admin tick mark on message
  doneAt?: string;
  createdAt: string;
}

export interface ProjectFolder {
  id: string;
  folderName: string;
  clientName: string;
  clientMobile: string; // User ID for client login
  customPassword: string; // customized password
  projectCategory?: 'Building Plans' | '3D Design' | 'Vasthu Consultation' | 'Land Survey' | 'Valuation Certificate' | 'Building Permit' | 'Video Rendering Works' | 'Complete Villa Package' | string;
  projectLocation?: string;
  estimatedArea?: string;
  status?: string;
  coverImageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  files: ProjectFile[];
  reviews: FolderReview[];
  chatMessages: FolderChatMessage[];
  cardTheme?: 'monochrome-color-preview' | 'professional-corporate' | 'signature-red' | 'luxury-slate' | 'blueprint-cyan' | 'kerala-teak' | 'dark-gold';
  driveSynced?: boolean;
  driveSyncDate?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
}

export interface ActivityNotification {
  id: string;
  folderId?: string;
  folderName?: string;
  type: 'file_upload' | 'file_delete' | 'file_update' | 'chat_message' | 'review_added' | 'password_reset' | 'drive_sync';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  read: boolean;
}

export interface DataVaultBackup {
  exportDate: string;
  version: string;
  company: string;
  folderCount: number;
  totalFiles: number;
  folders: ProjectFolder[];
}
