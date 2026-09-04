import { Router } from 'express';
import { getBatchAnalytics } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.get('/:batchId', getBatchAnalytics);
