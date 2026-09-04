import 'dotenv/config';
import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

connectDB()
  .then(() => {
    app.listen(env.PORT, () => logger.info(`Inference API listening on port ${env.PORT} [${env.NODE_ENV}]`));
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
