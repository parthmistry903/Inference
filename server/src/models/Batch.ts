import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface IBatch extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  createdBy: Types.ObjectId;
  totalResumes: number;
  processedResumes: number;
  failedResumes: number;
  status: 'queued' | 'processing' | 'completed' | 'partial';
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalResumes: { type: Number, required: true },
    processedResumes: { type: Number, default: 0 },
    failedResumes: { type: Number, default: 0 },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'partial'], default: 'queued' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

batchSchema.index({ jobId: 1, createdBy: 1 });

export const Batch: Model<IBatch> = model<IBatch>('Batch', batchSchema);
