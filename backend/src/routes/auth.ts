import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { parseBody, signupSchema, loginSchema } from '../utils/validation';
import * as authService from '../services/authService';

const router = Router();

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = parseBody(signupSchema, req.body);
    // Public signup is always customer; admins are created via seed or admin tools
    const result = await authService.signup({
      ...body,
      role: 'customer',
    });
    res.status(201).json(result);
  })
);

router.post(
  '/login',
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
    // JWT is stateless — client discards tokens
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

export default router;
