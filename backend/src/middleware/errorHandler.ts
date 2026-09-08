import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Global error handler middleware.
 * Handles Zod validation errors and generic errors.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(e.message);
    });

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: formattedErrors,
    });
    return;
  }

  // Handle known API errors
  if ('status' in err && typeof (err as any).status === 'number') {
    const apiErr = err as any;
    res.status(apiErr.status).json({
      success: false,
      message: apiErr.message,
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

/**
 * Create a structured API error
 */
export function createApiError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}
