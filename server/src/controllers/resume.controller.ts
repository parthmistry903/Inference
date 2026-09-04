import type { NextFunction, Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Job } from '../models/Job';
import { Resume, type IResume } from '../models/Resume';
import { csvHeaders, getCsvRow } from '../services/csv.service';
import { AppError } from '../utils/AppError';
import { sendResumeMessage } from '../services/sqs.service';
import { markResumeFailed, recomputeBatchProgress } from '../services/batchLifecycle.service';
import { assertObjectId, objectIdSchema } from '../utils/validation';

export const listResumesQuerySchema = z.object({
  batchId: objectIdSchema,
  hrStatus: z.enum(['pending', 'shortlisted', 'rejected', 'review']).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  skills: z.string().max(500).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['score', 'name', 'experience']).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(25),
});

export const updateResumeStatusSchema = z.object({
  hrStatus: z.enum(['pending', 'shortlisted', 'rejected', 'review']),
  hrNote: z.string().max(500).optional(),
});

export const bulkUpdateStatusSchema = z.object({
  resumeIds: z.array(objectIdSchema).min(1).max(500),
  hrStatus: z.enum(['pending', 'shortlisted', 'rejected', 'review']),
});

export const exportCsvQuerySchema = z.object({
  batchId: objectIdSchema,
  filter: z.enum(['all', 'shortlisted']).default('all'),
});

type ListResumesQuery = z.infer<typeof listResumesQuerySchema>;
type UpdateStatusInput = z.infer<typeof updateResumeStatusSchema>;
type BulkStatusInput = z.infer<typeof bulkUpdateStatusSchema>;
type ExportCsvQuery = z.infer<typeof exportCsvQuerySchema>;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { batchId, hrStatus, minScore, maxScore, skills, search, sort, order, page, limit } =
      req.query as unknown as ListResumesQuery;

    const filter: FilterQuery<IResume> = {
      batchId,
      createdBy: req.user._id,
      status: 'completed',
    };

    if (hrStatus) {
      filter.hrStatus = hrStatus;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter['scoreBreakdown.totalScore'] = {
        $gte: minScore ?? 0,
        $lte: maxScore ?? 100,
      };
    }

    if (skills) {
      filter['extractedData.skills'] = {
        $in: skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
          .map((skill) => new RegExp(escapeRegExp(skill), 'i')),
      };
    }

    if (search) {
      const pattern = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [{ 'extractedData.candidateName': pattern }, { 'extractedData.email': pattern }];
    }

    const sortObj: Record<string, 1 | -1> =
      sort === 'name'
        ? { 'extractedData.candidateName': 1 }
        : sort === 'experience'
          ? { 'extractedData.totalExperienceYears': order === 'asc' ? 1 : -1 }
          : { 'scoreBreakdown.totalScore': order === 'asc' ? 1 : -1 };

    const [total, resumes] = await Promise.all([
      Resume.countDocuments(filter),
      Resume.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const data = resumes.map((resume, index) => ({
      ...resume,
      rank: (page - 1) * limit + index + 1,
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

export async function getResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resumeId = assertObjectId(req.params.id);
    const resume = await Resume.findOne({ _id: resumeId, createdBy: req.user._id });
    if (!resume) {
      throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found');
    }
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hrStatus, hrNote } = req.body as UpdateStatusInput;
    const resumeId = assertObjectId(req.params.id);
    const resume = await Resume.findOne({ _id: resumeId, createdBy: req.user._id });
    if (!resume) {
      throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    resume.hrStatus = hrStatus;
    if (hrNote !== undefined) {
      resume.hrNote = hrNote;
    }
    resume.reviewedAt = new Date();
    await resume.save();
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resumeIds, hrStatus } = req.body as BulkStatusInput;
    const result = await Resume.updateMany(
      { _id: { $in: resumeIds }, createdBy: req.user._id },
      { hrStatus, reviewedAt: new Date() },
    );
    res.status(200).json({ success: true, data: { updated: result.modifiedCount } });
  } catch (error) {
    next(error);
  }
}

export async function exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { batchId, filter } = req.query as unknown as ExportCsvQuery;
    const batch = await Batch.findOne({ _id: batchId, createdBy: req.user._id });
    if (!batch) {
      throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');
    }

    const query: FilterQuery<IResume> = {
      batchId,
      createdBy: req.user._id,
      status: 'completed',
      ...(filter === 'shortlisted' ? { hrStatus: 'shortlisted' as const } : {}),
    };

    const job = await Job.findById(batch.jobId);
    if (!job) {
      throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = `Inference_${job.title.replace(/\s+/g, '_')}_${batchId}_${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.write(csvHeaders);

    const cursor = Resume.find(query).sort({ 'scoreBreakdown.totalScore': -1 }).cursor();
    let index = 0;
    for await (const resume of cursor) {
      res.write(getCsvRow(resume, index++));
    }
    res.end();
  } catch (error) {
    next(error);
  }
}

export async function retryResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resumeId = assertObjectId(req.params.id);
    const resume = await Resume.findOne({ _id: resumeId, createdBy: req.user._id });
    if (!resume) {
      throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    if (resume.status !== 'failed') {
      throw new AppError(400, 'INVALID_STATUS', 'Only failed resumes can be retried');
    }

    await Resume.findOneAndUpdate(
      { _id: resume._id, createdBy: req.user._id, status: 'failed' },
      {
        $set: {
          status: 'queued',
          failureReason: null,
          extractedData: null,
          scoreBreakdown: null,
          scoringMetadata: null,
          processedAt: null,
        },
      },
    );
    await Batch.updateOne(
      { _id: resume.batchId, createdBy: req.user._id, startedAt: null },
      { $set: { startedAt: new Date() } },
    );
    await Batch.updateOne(
      { _id: resume.batchId, createdBy: req.user._id },
      { $set: { status: 'processing', completedAt: null } },
    );
    await recomputeBatchProgress(resume.batchId);

    try {
      await sendResumeMessage({ resumeId: resume._id.toString(), attempt: 1 });
    } catch (error) {
      await markResumeFailed(resume._id, 'sqs_queue_error');
      throw new AppError(503, 'QUEUE_ERROR', 'Resume could not be re-queued for analysis');
    }

    res.status(200).json({ success: true, data: { message: 'Resume re-queued for analysis' } });
  } catch (error) {
    next(error);
  }
}
