import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/aws';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { IResume } from '../models/Resume';

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const PDF_CONTENT_TYPE = 'application/pdf';
export const PRESIGNED_UPLOAD_HEADERS = {
  'Content-Type': PDF_CONTENT_TYPE,
  'x-amz-server-side-encryption': 'AES256',
} as const;

export async function generatePresignedPutUrl(s3Key: string, contentType: string, expiresIn = 900): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    logger.error('Failed to generate presigned upload URL:', error);
    throw error;
  }
}

export async function getObjectMetadata(s3Key: string) {
  try {
    return await s3Client.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: s3Key }));
  } catch (error) {
    logger.error('Failed to read S3 object metadata:', error);
    throw error;
  }
}

export async function verifyUploadedResumeObject(
  resume: Pick<IResume, 's3Key' | 'fileSizeBytes' | 'originalFileName'>,
): Promise<void> {
  const metadata = await getObjectMetadata(resume.s3Key);
  const contentLength = metadata.ContentLength ?? 0;
  const contentType = (metadata.ContentType ?? '').split(';')[0].trim().toLowerCase();

  if (contentLength !== resume.fileSizeBytes) {
    throw new Error(`Uploaded object size does not match declared size for ${resume.originalFileName}`);
  }
  if (contentLength <= 0 || contentLength > MAX_PDF_BYTES) {
    throw new Error(`Uploaded object size is outside allowed PDF limits for ${resume.originalFileName}`);
  }
  if (contentType !== PDF_CONTENT_TYPE) {
    throw new Error(`Uploaded object is not a PDF for ${resume.originalFileName}`);
  }
}

export async function getObjectBuffer(s3Key: string, maxBytes = MAX_PDF_BYTES): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: s3Key });
    const response = await s3Client.send(command);
    if ((response.ContentLength ?? 0) > maxBytes) {
      throw new Error('S3 object exceeds maximum allowed size');
    }
    if (!response.Body) {
      throw new Error('S3 object returned no body');
    }
    const stream = response.Body as AsyncIterable<Uint8Array>;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    for await (const chunk of stream) {
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        throw new Error('S3 object stream exceeds maximum allowed size');
      }
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error('Failed to read S3 object:', error);
    throw error;
  }
}

export async function deleteObjects(s3Keys: string[]): Promise<void> {
  const uniqueKeys = Array.from(new Set(s3Keys.filter(Boolean)));
  for (let index = 0; index < uniqueKeys.length; index += 1000) {
    const chunk = uniqueKeys.slice(index, index + 1000);
    if (chunk.length === 0) continue;
    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET_NAME,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
    } catch (error) {
      logger.error('Failed to delete S3 objects:', error);
      throw error;
    }
  }
}
