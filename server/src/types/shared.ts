export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role: 'hr' | 'admin';
  isActive: boolean;
  createdAt: string;
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

export interface JobCriteriaSnapshot {
  title: string;
  description: string;
  requiredSkills: string[];
  minExperienceYears: number;
  minEducation: 'any' | 'highschool' | 'bachelor' | 'master' | 'phd';
}

export interface ScoringMetadata {
  modelId: string;
  promptVersion: string;
  scoredAt: Date;
  isStale: boolean;
  jobSnapshot: JobCriteriaSnapshot;
}

export interface SQSResumeMessage {
  resumeId: string;
  attempt: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
