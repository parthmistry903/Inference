import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from './AppError';

export const objectIdSchema = z.string().refine((value) => mongoose.isValidObjectId(value), {
  message: 'Invalid resource ID',
});

export function assertObjectId(value: unknown, code = 'INVALID_ID'): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw new AppError(400, code, 'Invalid resource ID');
  }
  return value;
}
