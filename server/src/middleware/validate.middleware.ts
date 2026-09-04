import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

function validationMessage(result: { error: { errors: { path: (string | number)[]; message: string }[] } }): string {
  return result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
}

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
  void res;
  const result = schema.safeParse(req.body);
  if (!result.success) {
    next(new AppError(400, 'VALIDATION_ERROR', validationMessage(result)));
    return;
  }
  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
  void res;
  const result = schema.safeParse(req.query);
  if (!result.success) {
    next(new AppError(400, 'VALIDATION_ERROR', validationMessage(result)));
    return;
  }
  Object.defineProperty(req, 'query', {
    value: result.data,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  next();
};
