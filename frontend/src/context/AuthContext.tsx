'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, loginApi, getMeApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'hifeed_token';
const USER_KEY = 'hifeed_user';

function setAuthCookies(token: string, role: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `hifeed_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `hifeed_role=${role}; path=/; max-age=86400; SameSite=Lax`;
  }
}

function clearAuthCookies() {
  if (typeof document !== 'undefined') {
    document.cookie = 'hifeed_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'hifeed_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage on client mount
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setAuthCookies(savedToken, parsedUser.role);

        // Re-verify token in background
        getMeApi(savedToken)
          .then((res) => {
            setUser(res.data);
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
            setAuthCookies(savedToken, res.data.role);
          })
          .catch(() => {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            clearAuthCookies();
            setUser(null);
            setToken(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        clearAuthCookies();
        setIsLoading(false);
      }
    } catch {
      clearAuthCookies();
      setIsLoading(false);
    }
  }, []);

  const login = async (userId: string, password: string): Promise<User> => {
    const res = await loginApi(userId, password);
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
    setAuthCookies(receivedToken, receivedUser.role);

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearAuthCookies();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
