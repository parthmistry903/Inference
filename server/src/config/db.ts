import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDB(): Promise<void> {
  try {
    mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
    mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}
