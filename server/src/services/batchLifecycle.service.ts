import type { Types } from 'mongoose';
import { Batch, type IBatch } from '../models/Batch';
import { Resume } from '../models/Resume';
import { updateBatchProgress } from './firebase.service';

function asString(value: string | Types.ObjectId): string {
  return typeof value === 'string' ? value : value.toString();
}

function trimReason(reason: string): string {
  return reason.slice(0, 500);
}

export async function recomputeBatchProgress(batchId: string | Types.ObjectId): Promise<IBatch | null> {
  const id = asString(batchId);
  const batch = await Batch.findById(id);
  if (!batch) return null;

  const [processedResumes, failedResumes] = await Promise.all([
    Resume.countDocuments({ batchId: batch._id, status: 'completed' }),
    Resume.countDocuments({ batchId: batch._id, status: 'failed' }),
  ]);

  const terminalCount = processedResumes + failedResumes;
  const isFinal = batch.totalResumes > 0 && terminalCount >= batch.totalResumes;
  const status = isFinal ? (failedResumes > 0 ? 'partial' : 'completed') : batch.status === 'queued' ? 'queued' : 'processing';
  const now = new Date();

  const updated = await Batch.findByIdAndUpdate(
    batch._id,
    {
      $set: {
        processedResumes,
        failedResumes,
        status,
        completedAt: isFinal ? batch.completedAt ?? now : null,
        ...(status === 'processing' && !batch.startedAt ? { startedAt: now } : {}),
      },
    },
    { new: true },
  );

  if (updated) {
    await updateBatchProgress(id, {
      total: updated.totalResumes,
      processed: updated.processedResumes,
      failed: updated.failedResumes,
      status: updated.status,
      startedAt: updated.startedAt?.getTime() ?? null,
      completedAt: updated.completedAt?.getTime() ?? null,
    });
  }

  return updated;
}

export async function markResumeFailed(resumeId: string | Types.ObjectId, reason: string): Promise<void> {
  const resume = await Resume.findById(resumeId).select('_id batchId status');
  if (!resume || resume.status === 'completed') return;

  await Resume.updateOne(
    { _id: resume._id, status: { $ne: 'completed' } },
    {
      $set: {
        status: 'failed',
        failureReason: trimReason(reason),
        processedAt: new Date(),
      },
    },
  );
  await recomputeBatchProgress(resume.batchId);
}
