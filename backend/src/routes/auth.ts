import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { parseBody, signupSchema, loginSchema } from '../utils/validation';
import * as authService from '../services/authService';

const router = Router();

router.post(
  '/signup',
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'signup' }),
  asyncHandler(async (req, res) => {
    const body = parseBody(signupSchema, req.body);
    const result = await authService.signup({
      ...body,
      role: 'customer',
    });
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'login' }),
  asyncHandler(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    const result = await authService.login(body.email, body.password);
    res.json(result);
  })
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ ok: true });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken required', code: 'VALIDATION_ERROR' });
      return;
    }
    const result = await authService.refresh(refreshToken);
    res.json(result);
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user!.id);
    res.json({ user });
  })
);

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = req.body?.currentPassword as string | undefined;
    const newPassword = req.body?.newPassword as string | undefined;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({
        error: 'currentPassword and newPassword (min 8 chars) required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json(result);
  })
);

router.post(
  '/forgot-password',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'forgot' }),
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? '');
    const result = await authService.forgotPassword(email);
    res.json(result);
  })
);

router.post(
  '/reset-password',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'reset' }),
  asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    if (!token || newPassword.length < 8) {
      res.status(400).json({ error: 'token and newPassword (min 8) required', code: 'VALIDATION_ERROR' });
      return;
    }
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  })
);

router.post(
  '/accept-invite',
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'invite' }),
  asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');
    if (!token || password.length < 8) {
      res.status(400).json({ error: 'token and password (min 8) required', code: 'VALIDATION_ERROR' });
      return;
    }
    const result = await authService.acceptInvite(token, password);
    res.status(201).json(result);
  })
);

export default router;
