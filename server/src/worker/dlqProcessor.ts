import { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { deleteMessage, receiveMessages } from '../services/sqs.service';
import { markResumeFailed } from '../services/batchLifecycle.service';
import { objectIdSchema } from '../utils/validation';

const dlqPayloadSchema = z.object({
  resumeId: objectIdSchema,
});

async function processDLQOnce(): Promise<void> {
  try {
    const messages = await receiveMessages(env.SQS_DLQ_URL, 10);
    for (const message of messages) {
      if (!message.Body || !message.ReceiptHandle) continue;
      const payload = dlqPayloadSchema.parse(JSON.parse(message.Body) as unknown);
      await markResumeFailed(payload.resumeId, 'max_retries_exceeded');
      await deleteMessage(env.SQS_DLQ_URL, message.ReceiptHandle);
      logger.error(`[DLQ] Marked resume ${payload.resumeId} as failed after max retries`);
    }
  } catch (error) {
    logger.error('[DLQ] Processor error:', error);
  }
}

export function startDLQProcessor(): void {
  void processDLQOnce();
  setInterval(() => {
    void processDLQOnce();
  }, 5 * 60 * 1000);
}
