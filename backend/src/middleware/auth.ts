import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export interface AuthUser {
  userId: string;
  userRole: string;
  userName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Mock authentication middleware.
 * Supports two modes:
 * 1. Authorization: Bearer <token> — decodes mock token to get user info.
 * 2. x-user-id / x-user-role headers — fallback for backward compatibility.
 */
export function mockAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // 1. Try Bearer token first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = authService.validateToken(token);
    if (payload) {
      req.user = {
        userId: payload.userId,
        userRole: payload.userRole,
        userName: payload.userName,
      };
      next();
      return;
    }
  }

  // 2. Fallback to mock headers (backward compatible)
  const userId = (req.headers['x-user-id'] as string) || 'staff-01';
  const userRole = (req.headers['x-user-role'] as string) || 'field_operator';

  req.user = {
    userId,
    userRole,
  };

  next();
}

/**
 * Role-based access control middleware.
 * Restricts access to users with the specified roles.
 * Must be used AFTER mockAuthMiddleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
      return;
    }

    if (!roles.includes(req.user.userRole)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Role "${req.user.userRole}" tidak memiliki izin. Diperlukan salah satu dari: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
