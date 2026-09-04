import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface IJob extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  requiredSkills: string[];
  minExperienceYears: number;
  minEducation: 'any' | 'highschool' | 'bachelor' | 'master' | 'phd';
  createdBy: Types.ObjectId;
  status: 'active' | 'closed';
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 2000 },
    requiredSkills: {
      type: [String],
      required: true,
      validate: [(arr: string[]) => arr.length >= 1 && arr.length <= 30, 'Skills must be 1-30'],
    },
    minExperienceYears: { type: Number, required: true, min: 0, max: 30 },
    minEducation: { type: String, enum: ['any', 'highschool', 'bachelor', 'master', 'phd'], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

jobSchema.index({ createdBy: 1, status: 1, isDeleted: 1 });

export const Job: Model<IJob> = model<IJob>('Job', jobSchema);
