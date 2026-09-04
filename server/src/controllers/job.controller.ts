import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Job, type IJob } from '../models/Job';
import { Resume } from '../models/Resume';
import { AppError } from '../utils/AppError';
import { deleteBatchProgress } from '../services/firebase.service';
import { deleteObjects } from '../services/s3.service';
import { assertObjectId } from '../utils/validation';

export const jobBodySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  requiredSkills: z.array(z.string().min(1)).min(1).max(30),
  minExperienceYears: z.number().min(0).max(30),
  minEducation: z.enum(['any', 'highschool', 'bachelor', 'master', 'phd']),
});

export const updateJobSchema = jobBodySchema.partial().extend({
  status: z.enum(['active', 'closed']).optional(),
});

export const listJobsQuerySchema = z.object({
  status: z.enum(['active', 'closed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

type JobInput = z.infer<typeof jobBodySchema>;
type UpdateJobInput = z.infer<typeof updateJobSchema>;
type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;

const criteriaFields: (keyof UpdateJobInput)[] = [
  'title',
  'description',
  'requiredSkills',
  'minExperienceYears',
  'minEducation',
];

function criteriaChanged(job: IJob, updates: UpdateJobInput): boolean {
  return criteriaFields.some((field) => {
    if (updates[field] === undefined) return false;
    return JSON.stringify(job[field]) !== JSON.stringify(updates[field]);
  });
}

export async function createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as JobInput;
    const job = await Job.create({ ...body, createdBy: req.user._id, status: 'active' });
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page, limit } = req.query as unknown as ListJobsQuery;
    const query = {
      createdBy: req.user._id,
      isDeleted: false,
      ...(status ? { status } : {}),
    };

    const [total, jobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const jobIds = jobs.map(j => j._id);
    const [batchCounts, resumeCounts] = await Promise.all([
      Batch.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } }
      ]),
      Resume.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } }
      ])
    ]);

    const batchMap = new Map(batchCounts.map(b => [b._id.toString(), b.count]));
    const resumeMap = new Map(resumeCounts.map(r => [r._id.toString(), r.count]));

    const data = jobs.map(job => ({
      ...job.toObject(),
      batchCount: batchMap.get(job._id.toString()) || 0,
      totalCandidates: resumeMap.get(job._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = assertObjectId(req.params.id);
    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id, isDeleted: false });
    if (!job) {
      throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    const [batchCount, totalCandidates] = await Promise.all([
      Batch.countDocuments({ jobId: job._id, createdBy: req.user._id }),
      Resume.countDocuments({ jobId: job._id, createdBy: req.user._id }),
    ]);

    res.status(200).json({ success: true, data: { ...job.toObject(), batchCount, totalCandidates } });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updates = req.body as UpdateJobInput;
    const jobId = assertObjectId(req.params.id);
    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id, isDeleted: false });
    if (!job) {
      throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }
    const markScoresStale = criteriaChanged(job, updates);
    Object.assign(job, updates);
    await job.save();
    if (markScoresStale) {
      await Resume.updateMany(
        { jobId: job._id, createdBy: req.user._id, status: 'completed' },
        { $set: { 'scoringMetadata.isStale': true } },
      );
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = assertObjectId(req.params.id);
    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id, isDeleted: false });
    if (!job) {
      throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    const [batches, resumes] = await Promise.all([
      Batch.find({ jobId: job._id, createdBy: req.user._id }).select('_id'),
      Resume.find({ jobId: job._id, createdBy: req.user._id }).select('s3Key'),
    ]);

    await deleteObjects(resumes.map((resume) => resume.s3Key));
    await Resume.deleteMany({ jobId: job._id, createdBy: req.user._id });
    await Batch.deleteMany({ jobId: job._id, createdBy: req.user._id });
    await Promise.all(batches.map((batch) => deleteBatchProgress(batch._id.toString())));

    job.isDeleted = true;
    job.deletedAt = new Date();
    await job.save();
    res.status(200).json({ success: true, data: { message: 'Job deleted' } });
  } catch (error) {
    next(error);
  }
}
