import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().min(1, 'JWT_EXPIRES_IN is required'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, 'REFRESH_TOKEN_EXPIRES_IN is required'),
  
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().default('placeholder'),
  AWS_SECRET_ACCESS_KEY: z.string().default('placeholder'),
  S3_BUCKET_NAME: z.string().default('placeholder'),
  SQS_QUEUE_URL: z.string().default('https://sqs.ap-south-1.amazonaws.com/000000000000/placeholder'),
  SQS_DLQ_URL: z.string().default('https://sqs.ap-south-1.amazonaws.com/000000000000/placeholder-dlq'),
  
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.string().url().default('https://bedrock-mantle.ap-south-1.api.aws/v1'),
  AI_MODEL_ID: z.string().default('nvidia.nemotron-super-3-120b'),
  
  // One or more origins, comma-separated. The first is the app's own origin;
  // add the static demo's origin here so its page-view beacon is accepted.
  CLIENT_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .refine(
      (origins) => origins.length > 0 && origins.every((origin) => /^https?:\/\/[^\s,]+$/.test(origin)),
      { message: 'CLIENT_ORIGIN must be a comma-separated list of http(s) origins' },
    ),
  
  ANALYTICS_DATABASE_URL: z.string().min(1).optional(),
  ANALYTICS_PROJECT_NAME: z.string().regex(/^[a-z0-9_-]{1,64}$/).default('inference'),
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') return;

  const requiredProductionValues: (keyof typeof value)[] = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'SQS_QUEUE_URL',
    'SQS_DLQ_URL',
    'OPENAI_API_KEY',
  ];
  for (const key of requiredProductionValues) {
    const raw = String(value[key] ?? '').trim();
    const lower = raw.toLowerCase();
    if (
      raw.length === 0
      || lower === 'placeholder'
      || lower.includes('placeholder')
      || lower.startsWith('test_')
      || raw === 'test-key'
      || raw === 'sk-test'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must be a real production value`,
      });
    }
  }

  if (value.JWT_SECRET === value.REFRESH_TOKEN_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['REFRESH_TOKEN_SECRET'],
      message: 'REFRESH_TOKEN_SECRET must differ from JWT_SECRET',
    });
  }

  if (value.JWT_SECRET.length < 32 || value.REFRESH_TOKEN_SECRET.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'Production JWT secrets must be at least 32 characters',
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Inference environment validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
};
