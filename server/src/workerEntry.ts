import 'dotenv/config';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { startWorker } from './worker/processor';
import { startDLQProcessor } from './worker/dlqProcessor';

connectDB()
  .then(() => {
    logger.info('Inference Worker connected to MongoDB');
    void startWorker();
    startDLQProcessor();
  })
  .catch((error) => {
    logger.error('Worker failed to connect:', error);
    process.exit(1);
  });
