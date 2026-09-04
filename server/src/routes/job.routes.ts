import { Router } from 'express';
import {
  createJob,
  deleteJob,
  getJob,
  jobBodySchema,
  listJobs,
  listJobsQuerySchema,
  updateJob,
  updateJobSchema,
} from '../controllers/job.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';

export const jobRouter = Router();

jobRouter.use(authMiddleware);
jobRouter.get('/', validateQuery(listJobsQuerySchema), listJobs);
jobRouter.post('/', validateBody(jobBodySchema), createJob);
jobRouter.get('/:id', getJob);
jobRouter.put('/:id', validateBody(updateJobSchema), updateJob);
jobRouter.delete('/:id', deleteJob);
