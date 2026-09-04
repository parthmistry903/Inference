export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'hr' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  minExperienceYears: number;
  minEducation: 'any' | 'highschool' | 'bachelor' | 'master' | 'phd';
  createdBy: string;
  status: 'active' | 'closed';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  batchCount?: number;
  totalCandidates?: number;
}

export interface Batch {
  _id: string;
  jobId: string;
  createdBy: string;
  totalResumes: number;
  processedResumes: number;
  failedResumes: number;
  status: 'queued' | 'processing' | 'completed' | 'partial';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreBreakdown {
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  fitScore: number;
  totalScore: number;
}

export interface ExtractedData {
  candidateName: string;
  email: string;
  phone: string;
  skills: string[];
  totalExperienceYears: number;
  highestEducation: string;
  previousCompanies: string[];
  aiSummary: string;
}

export interface Resume {
  _id: string;
  batchId: string;
  jobId: string;
  createdBy: string;
  s3Key: string;
  originalFileName: string;
  fileSizeBytes: number;
  status: 'awaiting_upload' | 'queued' | 'processing' | 'completed' | 'failed';
  failureReason?: string;
  extractedData?: ExtractedData;
  scoreBreakdown?: ScoreBreakdown;
  scoringMetadata?: {
    modelId: string;
    promptVersion: string;
    scoredAt: string;
    isStale: boolean;
    jobSnapshot: {
      title: string;
      description: string;
      requiredSkills: string[];
      minExperienceYears: number;
      minEducation: Job['minEducation'];
    };
  };
  hrStatus: 'pending' | 'shortlisted' | 'rejected' | 'review';
  hrNote?: string;
  reviewedAt?: string;
  processedAt?: string;
  createdAt: string;
  rank?: number;
}

export interface BatchAnalytics {
  scoreDistribution: { range: string; count: number }[];
  topSkills: { skill: string; count: number }[];
  averageScore: number;
  passRate: number;
  processingTimeMs: number;
}

export interface PresignedFileItem {
  resumeId: string;
  presignedUrl: string;
  uploadHeaders: Record<string, string>;
  s3Key: string;
  originalFileName: string;
}

export interface PresignedUploadResponse {
  batchId: string;
  files: PresignedFileItem[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SQSResumeMessage {
  resumeId: string;
  attempt: number;
}
