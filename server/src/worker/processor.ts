import type { Message } from '@aws-sdk/client-sqs';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Job, type IJob } from '../models/Job';
import { Resume, type IResume } from '../models/Resume';
import { MAX_PDF_BYTES, getObjectBuffer } from '../services/s3.service';
import { deleteMessage, receiveMessages } from '../services/sqs.service';
import { updateBatchProgress } from '../services/firebase.service';
import { SCORING_PROMPT_VERSION, scoreResume } from '../services/scoring.service';
import { markResumeFailed, recomputeBatchProgress } from '../services/batchLifecycle.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { SQSResumeMessage } from '../types/shared';
import { extractPDFText } from './pdfExtractor';
import { objectIdSchema } from '../utils/validation';

const sqsPayloadSchema = z.object({
  resumeId: objectIdSchema,
  attempt: z.number().int().min(1).default(1),
});

function parsePayload(body: string): SQSResumeMessage {
  return sqsPayloadSchema.parse(JSON.parse(body) as unknown);
}

async function callWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.message?.includes('429');
      if (is429 && attempt < maxRetries) {
        const wait = attempt * 8000; 
        logger.warn(`[Worker] Rate limited. Waiting ${wait/1000}s before retry ${attempt}/${maxRetries}`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

function isRetryableRateLimit(error: unknown): boolean {
  return (error as { status?: number })?.status === 429
    || (error as Error)?.message?.includes('429')
    || (error as Error)?.message?.includes('Max retries exceeded')
    || (error as Error)?.message?.includes('rate_limit');
}

function ensurePdfMagic(buffer: Buffer): void {
  if (buffer.length < 5 || buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new Error('Uploaded file is not a valid PDF');
  }
}

function jobSnapshot(job: IJob) {
  return {
    title: job.title,
    description: job.description,
    requiredSkills: job.requiredSkills,
    minExperienceYears: job.minExperienceYears,
    minEducation: job.minEducation,
  };
}

export async function processMessage(sqsMsg: Message): Promise<void> {
  if (!sqsMsg.Body || !sqsMsg.ReceiptHandle) return;
  let payload: SQSResumeMessage;
  try {
    payload = parsePayload(sqsMsg.Body);
  } catch (error) {
    logger.warn('[Worker] Invalid SQS payload; deleting message', { reason: error instanceof Error ? error.message : 'unknown' });
    await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
    return;
  }
  const { resumeId } = payload;
  let claimedResume: IResume | null = null;

  try {
    claimedResume = await Resume.findOneAndUpdate(
      { _id: resumeId, status: 'queued' },
      { $set: { status: 'processing', failureReason: null } },
      { new: true },
    );
    if (!claimedResume) {
      await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
      return;
    }

    await Batch.updateOne(
      { _id: claimedResume.batchId, createdBy: claimedResume.createdBy, startedAt: null },
      { $set: { startedAt: new Date(), status: 'processing' } },
    );
    await updateBatchProgress(claimedResume.batchId.toString(), { status: 'processing' });

    const [batch, job] = await Promise.all([
      Batch.findOne({ _id: claimedResume.batchId, createdBy: claimedResume.createdBy }),
      Job.findOne({ _id: claimedResume.jobId, createdBy: claimedResume.createdBy, isDeleted: false }),
    ]);
    if (!batch) {
      await markResumeFailed(claimedResume._id, 'batch_not_found');
      await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
      return;
    }
    if (!job) {
      await markResumeFailed(claimedResume._id, 'job_not_found');
      await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
      return;
    }

    try {
      const buffer = await getObjectBuffer(claimedResume.s3Key, MAX_PDF_BYTES);
      ensurePdfMagic(buffer);
      const resumeText = await extractPDFText(buffer);
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error('Could not extract text from PDF');
      }
      const scoringResult = await callWithBackoff(() => scoreResume(resumeText, job));
      const completed = await Resume.findOneAndUpdate(
        { _id: claimedResume._id, status: 'processing' },
        {
          $set: {
            status: 'completed',
            processedAt: new Date(),
            extractedData: {
              candidateName: scoringResult.candidateName,
              email: scoringResult.email,
              phone: scoringResult.phone,
              skills: scoringResult.skills,
              totalExperienceYears: scoringResult.totalExperienceYears,
              highestEducation: scoringResult.highestEducation,
              previousCompanies: scoringResult.previousCompanies,
              aiSummary: scoringResult.aiSummary,
            },
            scoreBreakdown: {
              skillsScore: scoringResult.skillsScore,
              experienceScore: scoringResult.experienceScore,
              educationScore: scoringResult.educationScore,
              fitScore: scoringResult.fitScore,
              totalScore: scoringResult.totalScore,
            },
            scoringMetadata: {
              modelId: env.AI_MODEL_ID,
              promptVersion: SCORING_PROMPT_VERSION,
              scoredAt: new Date(),
              isStale: false,
              jobSnapshot: jobSnapshot(job),
            },
          },
        },
        { new: true },
      );

      if (completed) {
        await recomputeBatchProgress(claimedResume.batchId);
      }

      await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
      logger.info(`[Worker] Processed resume ${resumeId} - score: ${scoringResult.totalScore}`);
    } catch (error: any) {
      if (isRetryableRateLimit(error)) {
        await Resume.updateOne(
          { _id: claimedResume._id, status: 'processing' },
          { $set: { status: 'queued', failureReason: 'temporary_rate_limit' } },
        );
        await recomputeBatchProgress(claimedResume.batchId);
        logger.warn(`[Worker] API rate limited for ${resumeId} - leaving in queue for retry`);
        return;
      }
      
      const reason = error instanceof Error ? error.message : 'ai_parse_error';
      await markResumeFailed(claimedResume._id, reason);
      await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
    }
  } catch (error) {
    logger.error(`[Worker] processMessage error for resume ${resumeId}:`, error);
    if (claimedResume && sqsMsg.ReceiptHandle) {
      await markResumeFailed(claimedResume._id, error instanceof Error ? error.message : 'worker_error');
      await deleteMessage(env.SQS_QUEUE_URL, sqsMsg.ReceiptHandle);
    }
  }
}

export async function startWorker(): Promise<void> {
  logger.info('[Worker] Inference Worker started. Polling SQS...');
  while (true) {
    try {
      
      const messages = await receiveMessages(env.SQS_QUEUE_URL, 3);
      if (messages.length > 0) {
        for (const sqsMsg of messages) {
          await processMessage(sqsMsg);
        }
      } else {
        
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error) {
      logger.error('[Worker] Polling error:', error);
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }
  }
}
