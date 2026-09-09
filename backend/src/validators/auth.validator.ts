import { z } from 'zod';

/**
 * Validator for POST /api/v1/auth/login
 */
export const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
