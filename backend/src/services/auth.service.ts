import { createApiError } from '../middleware/errorHandler';

export interface MockUser {
  id: string;
  password: string;
  name: string;
  role: 'supervisor' | 'field_operator';
}

/**
 * Hardcoded mock users for demo/testing purposes.
 * In production, these would be in a database with hashed passwords.
 */
const MOCK_USERS: MockUser[] = [
  {
    id: 'supervisor-01',
    password: 'super123',
    name: 'Supervisor Gudang',
    role: 'supervisor',
  },
  {
    id: 'staff-01',
    password: 'staff123',
    name: 'Ahmad Fauzi',
    role: 'field_operator',
  },
  {
    id: 'staff-02',
    password: 'staff123',
    name: 'Budi Santoso',
    role: 'field_operator',
  },
  {
    id: 'staff-03',
    password: 'staff123',
    name: 'Citra Dewi',
    role: 'field_operator',
  },
];

export interface AuthTokenPayload {
  userId: string;
  userRole: string;
  userName: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

/**
 * Auth Service
 * Handles mock authentication with simple base64 tokens.
 */
export class AuthService {
  /**
   * Login with userId and password.
   * Returns a mock token and user info.
   */
  login(userId: string, password: string): LoginResult {
    const user = MOCK_USERS.find((u) => u.id === userId);

    if (!user) {
      throw createApiError(401, 'User ID tidak ditemukan');
    }

    if (user.password !== password) {
      throw createApiError(401, 'Password salah');
    }

    // Create a simple base64 mock token
    const payload: AuthTokenPayload = {
      userId: user.id,
      userRole: user.role,
      userName: user.name,
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Validate and decode a mock token.
   * Returns the payload if valid, null if invalid.
   */
  validateToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded) as AuthTokenPayload;

      // Validate that the user still exists in our mock list
      const user = MOCK_USERS.find((u) => u.id === payload.userId);
      if (!user) return null;

      // Validate role matches
      if (user.role !== payload.userRole) return null;

      return payload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
