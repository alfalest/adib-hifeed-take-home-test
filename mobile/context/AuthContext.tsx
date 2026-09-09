import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../lib/storage';
import { User, loginApi, setAuth, getMeApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@hifeed_mobile_token';
const USER_KEY = '@hifeed_mobile_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSavedAuth() {
      try {
        const savedToken = await safeStorage.getItem(TOKEN_KEY);
        const savedUserStr = await safeStorage.getItem(USER_KEY);

        if (savedToken && savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          setToken(savedToken);
          setUser(savedUser);
          setAuth(savedToken, savedUser);

          // Verify token in background
          getMeApi(savedToken)
            .then((freshUser) => {
              setUser(freshUser);
              setAuth(savedToken, freshUser);
              safeStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            })
            .catch(async () => {
              // Token invalid
              await safeStorage.removeItem(TOKEN_KEY);
              await safeStorage.removeItem(USER_KEY);
              setUser(null);
              setToken(null);
              setAuth(null, null);
            });
        }
      } catch (err) {
        console.warn('Session restore note:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedAuth();
  }, []);

  const login = async (userId: string, password: string): Promise<User> => {
    const result = await loginApi(userId, password);
    setToken(result.token);
    setUser(result.user);
    setAuth(result.token, result.user);

    await safeStorage.setItem(TOKEN_KEY, result.token);
    await safeStorage.setItem(USER_KEY, JSON.stringify(result.user));

    return result.user;
  };

  const logout = async () => {
    await safeStorage.removeItem(TOKEN_KEY);
    await safeStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    setAuth(null, null);
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
