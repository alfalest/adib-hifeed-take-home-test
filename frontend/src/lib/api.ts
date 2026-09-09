const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hifeed_token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      authHeaders['x-user-id'] = 'supervisor-01';
      authHeaders['x-user-role'] = 'supervisor';
    }
  } else {
    authHeaders['x-user-id'] = 'supervisor-01';
    authHeaders['x-user-role'] = 'supervisor';
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// ========== Auth Types & Functions ==========

export interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'field_operator';
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export async function loginApi(userId: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login gagal');
  }

  return data;
}

export async function getMeApi(token: string): Promise<{ success: boolean; data: User }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Gagal memverifikasi sesi');
  }

  return data;
}

// ========== Types ==========

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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ========== API Functions ==========

export async function getItems(params?: Record<string, string>): Promise<PaginatedResponse<FeedItem>> {
  const searchParams = new URLSearchParams(params);
  return apiFetch(`/api/v1/inventory/items?${searchParams}`);
}

export async function getBatches(params?: Record<string, string>): Promise<PaginatedResponse<StockBatch>> {
  const searchParams = new URLSearchParams(params);
  return apiFetch(`/api/v1/inventory/batches?${searchParams}`);
}

export async function getMutations(params?: Record<string, string>): Promise<PaginatedResponse<StockMutation>> {
  const searchParams = new URLSearchParams(params);
  return apiFetch(`/api/v1/inventory/mutations?${searchParams}`);
}
