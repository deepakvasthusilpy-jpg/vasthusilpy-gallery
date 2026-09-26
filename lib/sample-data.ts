import { ProjectFolder, ActivityNotification } from './types';

export const COMPANY_INFO = {
  name: 'VASTHUSILPY',
  location: 'KERALASSERY',
  fullName: 'VASTHUSILPY PLANS 3D DESIGNS & VASTU CONSULTATION',
  subtitle: 'Landscape Architectural Services, Building Plans, 3D Designs & Permits',
  phones: ['9747995961', '9567627277', '7012383137'],
  primaryAdminMobile: '9747995961',
  secondaryAdminMobile: '9567627277',
  thirdAdminMobile: '7012383137',
  email: 'deepak.vasthusilpy@gmail.com',
  address: 'VASTHUSILPY, Near Keralassery Panchayath Office, Pathirippala-Kongad Road, Palakkad',
  workingHours: 'Mon - Sat: 9:00 AM - 7:30 PM',
  services: [
    { title: 'Building Plans', desc: 'Precision 2D architectural blueprints, structural, electrical, and plumbing drafts compliant with Kerala Building Rules (KMBR).', icon: 'FileText' },
    { title: '3D Design', desc: 'Ultra-photorealistic exterior and interior 3D visualizations with modern, contemporary, and Kerala traditional aesthetics.', icon: 'Layers' },
    { title: 'Video Rendering Works', desc: '4K cinematic architectural walkthroughs, dynamic sun-path simulations, and virtual tours.', icon: 'Video' },
    { title: 'Vasthu Consultation', desc: 'Authentic Vasthu Shastra analysis for plot orientation, room placement, Brahmasthanam, and energy harmonization.', icon: 'Compass' },
    { title: 'Land Survey', desc: 'Total station contour plotting, digital boundary mapping, and elevation leveling.', icon: 'Map' },
    { title: 'Valuation Certificate', desc: 'Certified building & property valuation reports for banking, taxation, and legal documentation.', icon: 'Award' },
    { title: 'Building Permit', desc: 'Fast-track Panchayat, Municipality & Corporation building permit drawing preparation and approval guidance.', icon: 'ShieldCheck' },
    { title: 'Landscape Architectural', desc: 'Lush tropical landscaping, courtyard layouts, water bodies, and outdoor illumination design.', icon: 'Trees' },
  ]
};

// Clean slate: No mock images - all images and designs will be created by the user
export const GALLERY_SHOWCASE: Array<{
  id: string;
  title: string;
  category: string;
  location: string;
  imageUrl: string;
  description: string;
}> = [];

// Clean slate: No mock folders - all folders and files will be created by the user
export const INITIAL_FOLDERS: ProjectFolder[] = [];

export const INITIAL_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: 'notif-system-welcome',
    folderName: 'VASTHUSILPY Portal',
    type: 'drive_sync',
    title: 'Welcome to VASTHUSILPY, Keralassery',
    description: 'System initialized in clean state. Ready for Admin (9747995961) to create client folders and upload drawings.',
    timestamp: new Date().toISOString(),
    actor: 'System',
    read: false
  }
];
