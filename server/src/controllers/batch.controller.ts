import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Resume } from '../models/Resume';
import { AppError } from '../utils/AppError';
import { deleteBatchProgress } from '../services/firebase.service';
import { deleteObjects } from '../services/s3.service';
import { assertObjectId, objectIdSchema } from '../utils/validation';

export const listBatchesQuerySchema = z.object({
  jobId: objectIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(10),
});

type ListBatchesQuery = z.infer<typeof listBatchesQuerySchema>;

export async function listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobId, page, limit } = req.query as unknown as ListBatchesQuery;
    const query = { jobId, createdBy: req.user._id };
    const [total, batches] = await Promise.all([
      Batch.countDocuments(query),
      Batch.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: batches,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batchId = assertObjectId(req.params.id);
    const batch = await Batch.findOne({ _id: batchId, createdBy: req.user._id });
    if (!batch) {
      throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');
    }
    res.status(200).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

export async function deleteBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batchId = assertObjectId(req.params.id);
    const batch = await Batch.findOne({ _id: batchId, createdBy: req.user._id });
    if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');
    const resumes = await Resume.find({ batchId: batch._id, createdBy: req.user._id }).select('s3Key');
    await deleteObjects(resumes.map((resume) => resume.s3Key));
    await Resume.deleteMany({ batchId: batch._id, createdBy: req.user._id });
    await deleteBatchProgress(batch._id.toString());
    await batch.deleteOne();
    res.status(200).json({ success: true, data: { message: 'Batch deleted' } });
  } catch (error) {
    next(error);
  }
}
