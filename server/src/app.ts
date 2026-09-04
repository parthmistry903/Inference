import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes';
import { jobRouter } from './routes/job.routes';
import { batchRouter } from './routes/batch.routes';
import { resumeRouter } from './routes/resume.routes';
import { uploadRouter } from './routes/upload.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { pageViewAnalyticsRouter } from './routes/pageViewAnalytics.routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { morganStream } from './utils/logger';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  void req;
  res.setHeader('X-Powered-By', 'Inference');
  next();
});
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use('/api/_analytics/page-view', express.raw({ type: '*/*', limit: '1mb' }), pageViewAnalyticsRouter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: morganStream }));
app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.get('/api/v1/health', (req, res) => {
  void req;
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'Inference API',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    },
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/batches', batchRouter);
app.use('/api/v1/resumes', resumeRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/analytics', analyticsRouter);

app.use(errorHandler);
