import { Router } from 'express';
import { deleteBatch, getBatch, listBatches, listBatchesQuerySchema } from '../controllers/batch.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validate.middleware';

export const batchRouter = Router();

batchRouter.use(authMiddleware);
batchRouter.get('/', validateQuery(listBatchesQuerySchema), listBatches);
batchRouter.get('/:id', getBatch);
batchRouter.delete('/:id', deleteBatch);
