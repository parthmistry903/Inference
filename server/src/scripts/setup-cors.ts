import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

async function setupCors() {
  try {
    const command = new PutBucketCorsCommand({
      Bucket: env.S3_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['Content-Type', 'x-amz-server-side-encryption'],
            AllowedMethods: ['PUT', 'HEAD'],
            AllowedOrigins: env.CLIENT_ORIGIN,
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    await s3Client.send(command);
    console.log('Successfully set S3 CORS configuration');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
    process.exit(1);
  }
}

setupCors();
