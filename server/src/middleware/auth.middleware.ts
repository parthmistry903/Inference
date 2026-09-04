import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type IUser } from '../models/User';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}

interface AccessTokenPayload {
  userId: string;
  role: 'hr' | 'admin';
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  void res;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'NO_TOKEN', 'Authorization token required');
    }

    const token = authHeader.slice('Bearer '.length);
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token invalid or expired');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'INVALID_TOKEN', 'Token invalid or expired'));
  }
}
