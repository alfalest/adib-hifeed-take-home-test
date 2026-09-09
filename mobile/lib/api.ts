import Constants from 'expo-constants';
import { Platform } from 'react-native';

let customApiUrl: string | null = null;

export function setCustomApiUrl(url: string) {
  customApiUrl = url.trim().replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  if (customApiUrl) {
    return customApiUrl;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Dynamic host detection from Expo (gets PC's Wi-Fi IP address e.g. 192.168.x.x)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest as any)?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3001`;
    }
  }

  // Fallback to PC's active LAN IP (192.168.8.200) or Android Emulator loopback
  return Platform.OS === 'android' ? 'http://192.168.8.200:3001' : 'http://localhost:3001';
}

export interface BatchDetail {
  id: string;
  batch_number: string;
  feed_item_id: string;
  expired_date: string;
  initial_qty: number;
  current_qty: number;
  qr_payload: string;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
  is_expired: boolean;
  is_near_expiry: boolean;
  days_until_expiry: number;
  feed_item: {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
  };
}

export interface MutationResult {
  success: boolean;
  data: {
    mutation: {
      id: string;
      type: 'INBOUND' | 'DISPATCH';
      quantity: number;
    };
    batch: {
      id: string;
      batch_number: string;
      current_qty: number;
      status: string;
    };
    feed_item: {
      id: string;
      name: string;
      current_stock: number;
    };
  };
}

export interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'field_operator';
}

let activeToken: string | null = null;
let activeUser: User | null = null;

export function setAuth(token: string | null, user: User | null) {
  activeToken = token;
  activeUser = user;
}

export function getActiveUser(): User | null {
  return activeUser;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  if (activeUser) {
    headers['x-user-id'] = activeUser.id;
    headers['x-user-role'] = activeUser.role;
  } else {
    headers['x-user-id'] = 'staff-01';
    headers['x-user-role'] = 'field_operator';
  }

  return headers;
}

/**
 * Login via POST /api/v1/auth/login
 */
export async function loginApi(userId: string, password: string): Promise<{ token: string; user: User }> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login gagal. Periksa User ID dan Password.');
    }

    setAuth(data.data.token, data.data.user);
    return data.data;
  } catch (error: any) {
    if (error.message && error.message.includes('Login gagal')) {
      throw error;
    }
    throw new Error(`Gagal terhubung ke server (${baseUrl}). Pastikan HP dan PC terhubung ke Wi-Fi yang sama.`);
  }
}

/**
 * Verify token via GET /api/v1/auth/me
 */
export async function getMeApi(token: string): Promise<User> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Sesi kedaluwarsa');
  }

  return data.data;
}

/**
 * Find a batch by QR payload
 */
export async function findBatchByQR(qrPayload: string): Promise<BatchDetail | null> {
  const baseUrl = getApiBaseUrl();
  try {
    // Parse the QR payload to get batch info
    let batchNumber: string;
    try {
      const parsed = JSON.parse(qrPayload);
      batchNumber = parsed.batch_number || parsed.batch_no;
    } catch {
      // If not JSON, treat as plain batch number
      batchNumber = qrPayload;
    }

    const res = await fetch(`${baseUrl}/api/v1/inventory/batches?limit=100`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!data.success) return null;

    // Find the batch by batch_number or qr_payload
    const batch = data.data.find(
      (b: any) => b.batch_number === batchNumber || b.qr_payload === qrPayload
    );

    return batch || null;
  } catch (error: any) {
    console.error(`Error connecting to ${baseUrl}:`, error);
    throw new Error(`Gagal terhubung ke server (${baseUrl}). Pastikan HP dan PC berada dalam 1 jaringan Wi-Fi.`);
  }
}

/**
 * Process inbound (add stock)
 */
export async function processInbound(params: {
  batch_number: string;
  sku: string;
  quantity: number;
  expired_date: string;
  notes?: string;
}): Promise<MutationResult> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inventory/inbound`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Gagal memproses inbound');
  }

  return data;
}

/**
 * Process dispatch (reduce stock via QR scan)
 */
export async function processDispatch(params: {
  qr_payload?: string;
  batch_id?: string;
  quantity: number;
  notes?: string;
}): Promise<MutationResult> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inventory/scan-dispatch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Gagal memproses dispatch');
  }

  return data;
}

// ========== Dashboard Inventory APIs & Types ==========

export interface FeedItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  is_low_stock: boolean;
  active_batches_count: number;
  created_at: string;
  updated_at: string;
}

export interface StockBatch {
  id: string;
  batch_number: string;
  feed_item_id: string;
  expired_date: string;
  initial_qty: number;
  current_qty: number;
  qr_payload: string;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
  is_expired: boolean;
  is_near_expiry: boolean;
  days_until_expiry: number;
  feed_item: {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
  };
  created_at: string;
}

export interface StockMutation {
  id: string;
  batch_id: string;
  feed_item_id: string;
  type: 'INBOUND' | 'DISPATCH';
  quantity: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  feed_item: {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
  };
  batch: {
    id: string;
    batch_number: string;
    current_qty: number;
    status: string;
  };
}

export async function getInventoryItems(limit = 100): Promise<FeedItem[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inventory/items?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memuat data pakan');
  return data.data || [];
}

export async function getInventoryBatches(limit = 100): Promise<StockBatch[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inventory/batches?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memuat data batch');
  return data.data || [];
}

export async function getInventoryMutations(limit = 50): Promise<StockMutation[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inventory/mutations?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memuat data mutasi');
  return data.data || [];
}


