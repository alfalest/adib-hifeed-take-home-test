import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  userId: string;
  userRole: string;
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
 * Reads x-user-id and x-user-role from request headers.
 * No real authentication is performed — this is for demo/testing purposes.
 */
export function mockAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const userId = (req.headers['x-user-id'] as string) || 'staff-01';
  const userRole = (req.headers['x-user-role'] as string) || 'field_operator';

  req.user = {
    userId,
    userRole,
  };

  next();
}
