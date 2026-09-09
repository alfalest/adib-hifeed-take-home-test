import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Resilient storage wrapper for Expo Go / React Native.
 * If AsyncStorage native module is unavailable (e.g. in certain Expo Go builds),
 * it seamlessly falls back to an in-memory cache without crashing or throwing.
 */
const memoryCache: Record<string, string> = {};

export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) return value;
    } catch {
      // AsyncStorage native module not available or null in Expo Go
    }
    return memoryCache[key] ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryCache[key] = value;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // AsyncStorage native module is null, safely stored in memoryCache
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryCache[key];
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Native error safely ignored
    }
  },
};
