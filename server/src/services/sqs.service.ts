import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/aws';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { SQSResumeMessage } from '../types/shared';

export async function sendResumeMessage(msg: SQSResumeMessage): Promise<void> {
  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(msg),
      }),
    );
  } catch (error) {
    logger.error(`Failed to send SQS resume message for ${msg.resumeId}:`, error);
    throw error;
  }
}

export async function receiveMessages(queueUrl: string, max = 10): Promise<Message[]> {
  try {
    const result = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: max,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 120,
      }),
    );
    return result.Messages ?? [];
  } catch (error) {
    logger.error(`Failed to receive SQS messages from ${queueUrl}:`, error);
    throw error;
  }
}

export async function deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
  try {
    await sqsClient.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
  } catch (error) {
    logger.error(`Failed to delete SQS message from ${queueUrl}:`, error);
    throw error;
  }
}

export async function changeMessageVisibility(queueUrl: string, receiptHandle: string, visibilityTimeout: number): Promise<void> {
  try {
    await sqsClient.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: visibilityTimeout,
      }),
    );
  } catch (error) {
    logger.error(`Failed to change SQS message visibility for ${queueUrl}:`, error);
    throw error;
  }
}
