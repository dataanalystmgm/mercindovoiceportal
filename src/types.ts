export type Role = 'employee' | 'compliance' | 'pic' | 'admin';

export interface PicMember {
  id: string;
  nik: string;
  name: string;
  section: string;
  user: string;
  domain: string;
  emailPic: string;
  emailManagerSpv: string;
  emailDirektur: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  createdAt: string;
  nik?: string;
}

export type ProgressStatus = 'submitted' | 'reviewed' | 'in_progress' | 'management' | 'resolved';

export interface ProgressLog {
  id: string;
  status: ProgressStatus;
  description: string;
  updatedBy: string;
  createdAt: string;
  feedbackPhotoUrl?: string;
}

export interface Aspirasi {
  id: string;
  trackingCode: string;
  title: string;
  content: string;
  originalClassification: 'ide' | 'kritik_saran'; // what user selected (if any, or general)
  aiClassification: 'ide' | 'kritik_saran'; // what AI detected
  aiReason: string; // analysis text from AI
  topic: string; // AI detected topic (e.g. Fasilitas, Hubungan Kerja, Produktivitas, Quality, etc.)
  isPublic: boolean; // whether approved by compliance for public view
  isReviewed: boolean; // reviewed by compliance or not
  status: ProgressStatus;
  picName?: string;
  picDepartment?: string;
  authorId: string | null; // null if anonymous
  authorName?: string; // name of author if not anonymous
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
  progressHistory: ProgressLog[];
  feedback?: string;
  correctiveAction?: string;
  targetCompletionDate?: string;
  photoUrl?: string;
  feedbackPhotoUrl?: string;
}
