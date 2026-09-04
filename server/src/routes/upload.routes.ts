import { Router } from 'express';
import { confirm, confirmUploadSchema, presigned, presignedSchema } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';

export const uploadRouter = Router();

uploadRouter.use(authMiddleware);
uploadRouter.post('/presigned', validateBody(presignedSchema), presigned);
uploadRouter.post('/confirm', validateBody(confirmUploadSchema), confirm);
