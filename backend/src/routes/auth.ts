import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Validates userId + password, returns token + user info.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = authService.login(input.userId, input.password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current user info from the auth token.
 * Requires valid Authorization: Bearer <token> header.
 */
router.get('/me', async (req: Request, res: Response, _next: NextFunction) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: req.user.userId,
      name: req.user.userName || req.user.userId,
      role: req.user.userRole,
    },
  });
});

export default router;
