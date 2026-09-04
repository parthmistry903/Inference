import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Password must include letters and numbers'),
});

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

function signAccessToken(userId: string, role: 'hr' | 'admin'): string {
  return jwt.sign(
    { userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] },
  );
}

function signRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] },
  );
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body as RegisterInput;
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ success: true, data: { user: user.toSafeObject() } });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account has been deactivated');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const userId = user._id.toString();
    const accessToken = signAccessToken(userId, user.role);
    const refreshToken = signRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ success: true, data: { accessToken, user: user.toSafeObject() } });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies['refresh_token'] as string | undefined;
    if (!token) {
      throw new AppError(401, 'NO_REFRESH_TOKEN', 'Refresh token missing');
    }

    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive || user.refreshToken !== token) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalid');
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalid'));
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
  } catch (error) {
    next(error);
  }
}

export const changePasswordSchema = z.object({
  name: z.string().min(1),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Password must include letters and numbers'),
});

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, currentPassword, newPassword } = req.body as ChangePasswordInput;

    
    if (req.user.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      throw new AppError(400, 'NAME_MISMATCH', 'Full name does not match your account');
    }

    
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    req.user.passwordHash = passwordHash;
    await req.user.save();

    res.status(200).json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    next(error);
  }
}

export const forgotPasswordSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().transform((value) => value.toLowerCase()),
  newPassword: z.string().min(8).regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Password must include letters and numbers'),
});

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    void req;
    throw new AppError(
      501,
      'PASSWORD_RESET_DISABLED',
      'Password reset requires an email verification token and is temporarily disabled',
    );
  } catch (error) {
    next(error);
  }
}
