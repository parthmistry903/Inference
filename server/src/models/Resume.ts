import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { ExtractedData, ScoreBreakdown, ScoringMetadata } from '../types/shared';

export interface IResume extends Document {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  jobId: Types.ObjectId;
  createdBy: Types.ObjectId;
  s3Key: string;
  originalFileName: string;
  fileSizeBytes: number;
  status: 'awaiting_upload' | 'queued' | 'processing' | 'completed' | 'failed';
  failureReason: string | null;
  extractedData: ExtractedData | null;
  scoreBreakdown: ScoreBreakdown | null;
  scoringMetadata: ScoringMetadata | null;
  hrStatus: 'pending' | 'shortlisted' | 'rejected' | 'review';
  hrNote: string | null;
  reviewedAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const extractedDataSchema = new Schema<ExtractedData>(
  {
    candidateName: { type: String, default: 'Unknown' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    skills: { type: [String], default: [] },
    totalExperienceYears: { type: Number, default: 0 },
    highestEducation: { type: String, default: '' },
    previousCompanies: { type: [String], default: [] },
    aiSummary: { type: String, default: '' },
  },
  { _id: false },
);

const scoreBreakdownSchema = new Schema<ScoreBreakdown>(
  {
    skillsScore: { type: Number, min: 0, max: 40, default: 0 },
    experienceScore: { type: Number, min: 0, max: 30, default: 0 },
    educationScore: { type: Number, min: 0, max: 20, default: 0 },
    fitScore: { type: Number, min: 0, max: 10, default: 0 },
    totalScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false },
);

const scoringMetadataSchema = new Schema<ScoringMetadata>(
  {
    modelId: { type: String, required: true },
    promptVersion: { type: String, required: true },
    scoredAt: { type: Date, required: true },
    isStale: { type: Boolean, default: false },
    jobSnapshot: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      requiredSkills: { type: [String], required: true },
      minExperienceYears: { type: Number, required: true },
      minEducation: { type: String, enum: ['any', 'highschool', 'bachelor', 'master', 'phd'], required: true },
    },
  },
  { _id: false },
);

const resumeSchema = new Schema<IResume>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    s3Key: { type: String, required: true },
    originalFileName: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: ['awaiting_upload', 'queued', 'processing', 'completed', 'failed'],
      default: 'awaiting_upload',
    },
    failureReason: { type: String, default: null },
    extractedData: { type: extractedDataSchema, default: null },
    scoreBreakdown: { type: scoreBreakdownSchema, default: null },
    scoringMetadata: { type: scoringMetadataSchema, default: null },
    hrStatus: { type: String, enum: ['pending', 'shortlisted', 'rejected', 'review'], default: 'pending' },
    hrNote: { type: String, maxlength: 500, default: null },
    reviewedAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

resumeSchema.index({ batchId: 1, 'scoreBreakdown.totalScore': -1 });
resumeSchema.index({ batchId: 1, hrStatus: 1 });
resumeSchema.index({ batchId: 1, status: 1 });
resumeSchema.index({ batchId: 1, hrStatus: 1, 'scoreBreakdown.totalScore': -1 });

export const Resume: Model<IResume> = model<IResume>('Resume', resumeSchema);
