import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Job } from '../models/Job';
import { Resume } from '../models/Resume';
import {
  MAX_PDF_BYTES,
  PDF_CONTENT_TYPE,
  PRESIGNED_UPLOAD_HEADERS,
  generatePresignedPutUrl,
  verifyUploadedResumeObject,
} from '../services/s3.service';
import { sendResumeMessage } from '../services/sqs.service';
import { initBatchProgress, updateBatchProgress } from '../services/firebase.service';
import { markResumeFailed, recomputeBatchProgress } from '../services/batchLifecycle.service';
import { AppError } from '../utils/AppError';
import { objectIdSchema } from '../utils/validation';

export const presignedSchema = z.object({
  jobId: objectIdSchema,
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        size: z.number().int().positive().max(MAX_PDF_BYTES),
        mimeType: z.literal(PDF_CONTENT_TYPE),
      }),
    )
    .min(1)
    .max(500),
});

export const confirmUploadSchema = z.object({
  batchId: objectIdSchema,
});

type PresignedInput = z.infer<typeof presignedSchema>;
type ConfirmInput = z.infer<typeof confirmUploadSchema>;

function isPdf(file: PresignedInput['files'][number]): boolean {
  return file.mimeType === PDF_CONTENT_TYPE && file.name.toLowerCase().endsWith('.pdf');
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function presigned(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobId, files } = req.body as PresignedInput;
    for (const file of files) {
      if (!isPdf(file)) {
        throw new AppError(400, 'INVALID_FILE_TYPE', 'Only PDF resume files are allowed');
      }
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user._id, isDeleted: false });
    if (!job) {
      throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found');
    }
    if (job.status === 'closed') {
      throw new AppError(400, 'JOB_CLOSED', 'Cannot upload to a closed job');
    }

    const batchId = new mongoose.Types.ObjectId();
    const prepared = await Promise.all(
      files.map(async (file) => {
        const resumeId = new mongoose.Types.ObjectId();
        const s3Key = `resumes/${req.user._id.toString()}/${batchId.toString()}/${randomUUID()}_${sanitizeFileName(file.name)}`;
        const presignedUrl = await generatePresignedPutUrl(s3Key, PDF_CONTENT_TYPE, 900);
        return {
          resumeId,
          s3Key,
          presignedUrl,
          originalFileName: file.name,
          fileSizeBytes: file.size,
        };
      }),
    );

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Batch.create([{
        _id: batchId,
        jobId,
        createdBy: req.user._id,
        totalResumes: files.length,
      }], { session });

      await Resume.insertMany(
        prepared.map((item) => ({
          _id: item.resumeId,
          batchId,
          jobId,
          createdBy: req.user._id,
          s3Key: item.s3Key,
          originalFileName: item.originalFileName,
          fileSizeBytes: item.fileSizeBytes,
          status: 'awaiting_upload',
        })),
        { session }
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await initBatchProgress(batchId.toString(), files.length);

    res.status(200).json({
      success: true,
      data: {
        batchId: batchId.toString(),
        files: prepared.map((item) => ({
          resumeId: item.resumeId.toString(),
          presignedUrl: item.presignedUrl,
          uploadHeaders: PRESIGNED_UPLOAD_HEADERS,
          s3Key: item.s3Key,
          originalFileName: item.originalFileName,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { batchId } = req.body as ConfirmInput;
    const existingBatch = await Batch.findOne({ _id: batchId, createdBy: req.user._id });
    if (!existingBatch) {
      throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');
    }
    if (existingBatch.status !== 'queued') {
      throw new AppError(400, 'ALREADY_PROCESSING', 'Batch already confirmed');
    }

    const resumes = await Resume.find({ batchId, createdBy: req.user._id, status: 'awaiting_upload' });
    if (resumes.length !== existingBatch.totalResumes) {
      throw new AppError(400, 'UPLOAD_INCOMPLETE', 'All resumes must be uploaded before confirming the batch');
    }

    try {
      await Promise.all(resumes.map((resume) => verifyUploadedResumeObject(resume)));
    } catch (error) {
      throw new AppError(400, 'UPLOAD_VERIFICATION_FAILED', error instanceof Error ? error.message : 'Uploaded files could not be verified');
    }

    const batch = await Batch.findOneAndUpdate(
      { _id: batchId, createdBy: req.user._id, status: 'queued' },
      { $set: { status: 'processing', startedAt: new Date(), completedAt: null } },
      { new: true },
    );
    if (!batch) {
      throw new AppError(400, 'ALREADY_PROCESSING', 'Batch already confirmed');
    }

    await Resume.updateMany(
      { batchId, createdBy: req.user._id, status: 'awaiting_upload' },
      { $set: { status: 'queued', failureReason: null } },
    );

    let totalQueued = 0;
    await Promise.all(
      resumes.map(async (resume) => {
        try {
          await sendResumeMessage({
            resumeId: resume._id.toString(),
            attempt: 1,
          });
          totalQueued += 1;
        } catch (error) {
          await markResumeFailed(resume._id, 'sqs_queue_error');
        }
      })
    );

    await recomputeBatchProgress(batch._id);
    await updateBatchProgress(batchId, { status: 'processing', startedAt: Date.now() });
    res.status(200).json({ success: true, data: { batchId, totalQueued } });
  } catch (error) {
    next(error);
  }
}
