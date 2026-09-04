import { Router } from 'express';
import {
  bulkUpdateStatus,
  bulkUpdateStatusSchema,
  exportCSV,
  exportCsvQuerySchema,
  getResume,
  listResumes,
  listResumesQuerySchema,
  updateResumeStatusSchema,
  updateStatus,
  retryResume,
} from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';

export const resumeRouter = Router();

resumeRouter.use(authMiddleware);
resumeRouter.get('/', validateQuery(listResumesQuerySchema), listResumes);
resumeRouter.get('/export', validateQuery(exportCsvQuerySchema), exportCSV);
resumeRouter.patch('/bulk-status', validateBody(bulkUpdateStatusSchema), bulkUpdateStatus);
resumeRouter.get('/:id', getResume);
resumeRouter.put('/:id/status', validateBody(updateResumeStatusSchema), updateStatus);
resumeRouter.patch('/:id/retry', retryResume);
