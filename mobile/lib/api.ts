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

const defaultHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': 'staff-01',
  'x-user-role': 'field_operator',
};

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
      headers: defaultHeaders,
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
    headers: defaultHeaders,
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
    headers: defaultHeaders,
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Gagal memproses dispatch');
  }

  return data;
}

