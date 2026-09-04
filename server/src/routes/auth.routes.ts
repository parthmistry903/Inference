import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, loginSchema, logout, me, refresh, register, registerSchema, changePassword, changePasswordSchema, forgotPassword, forgotPasswordSchema } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

authRouter.post('/register', registerLimiter, validateBody(registerSchema), register);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', authMiddleware, logout);
authRouter.get('/me', authMiddleware, me);
authRouter.post('/change-password', authMiddleware, validateBody(changePasswordSchema), changePassword);
authRouter.post('/forgot-password', registerLimiter, validateBody(forgotPasswordSchema), forgotPassword);
