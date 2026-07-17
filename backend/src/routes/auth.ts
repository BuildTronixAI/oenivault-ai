import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import {
  parseBody,
  signupSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  acceptInviteSchema,
  refreshSchema,
} from '../utils/validation';
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
    const body = parseBody(refreshSchema, req.body);
    const result = await authService.refresh(body.refreshToken);
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
    const body = parseBody(changePasswordSchema, req.body);
    const result = await authService.changePassword(
      req.user!.id,
      body.currentPassword,
      body.newPassword
    );
    res.json(result);
  })
);

router.post(
  '/forgot-password',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'forgot' }),
  asyncHandler(async (req, res) => {
    const body = parseBody(forgotPasswordSchema, req.body);
    const result = await authService.forgotPassword(body.email);
    res.json(result);
  })
);

router.post(
  '/reset-password',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'reset' }),
  asyncHandler(async (req, res) => {
    const body = parseBody(resetPasswordSchema, req.body);
    const result = await authService.resetPassword(body.token, body.newPassword);
    res.json(result);
  })
);

router.post(
  '/accept-invite',
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'invite' }),
  asyncHandler(async (req, res) => {
    const body = parseBody(acceptInviteSchema, req.body);
    const result = await authService.acceptInvite(body.token, body.password);
    res.status(201).json(result);
  })
);

export default router;
