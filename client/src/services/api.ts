import { User } from '../types';

let currentDemoUser: User | null = null;

export function setApiDemoUser(user: User | null) {
  currentDemoUser = user;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentDemoUser) {
    headers.set('x-demo-user-id', currentDemoUser.id);
    headers.set('x-demo-role', currentDemoUser.role);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth & Roles
  getDemoUsers: () => fetchJson<{ users: User[]; currentUser: any }>('/api/auth/demo-users'),
  getMe: () => fetchJson<{ user: any }>('/api/auth/me'),

  // Public / Marketplace
  getShops: () => fetchJson<{ shops: any[] }>('/api/shops'),
  getTaxConfigs: () => fetchJson<{ configs: any[]; disclaimer: string }>('/api/tax-configs'),
  getProducts: (params?: { category?: string; shopId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.shopId) query.set('shopId', params.shopId);
    if (params?.search) query.set('search', params.search);
    return fetchJson<{ products: any[] }>(`/api/products?${query.toString()}`);
  },
  getProductById: (id: string) => fetchJson<{ product: any }>(`/api/products/${id}`),

  // Orders
  createOrder: (data: any) => fetchJson<{ success: boolean; message: string; order: any }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getOrders: () => fetchJson<{ orders: any[] }>('/api/orders'),
  getOrderById: (id: string) => fetchJson<{ order: any; lines: any[] }>(`/api/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => fetchJson<{ success: boolean; result: any }>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Invoice
  getInvoice: (id: string) => fetchJson<{ invoice: any }>(`/api/invoices/${id}`),

  // Retailer
  getRetailerDashboard: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return fetchJson<{ metrics: any; shopId: string }>(`/api/retailer/dashboard?${query.toString()}`);
  },
  getRetailerInventory: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return fetchJson<{ inventory: any[] }>(`/api/retailer/inventory?${query.toString()}`);
  },
  adjustInventory: (data: { productId: string; quantityDelta: number; reason: string }) => 
    fetchJson<{ success: boolean; message: string; result: any }>('/api/retailer/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStockMovements: (productId?: string) => {
    const query = productId ? `?productId=${productId}` : '';
    return fetchJson<{ movements: any[] }>(`/api/retailer/inventory/movements${query}`);
  },
  getReorderSuggestions: () => fetchJson<{ suggestions: any[]; disclaimer: string }>('/api/retailer/inventory/reorder-suggestions'),
  getPurchases: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return fetchJson<{ purchases: any[] }>(`/api/retailer/purchases?${query.toString()}`);
  },
  recordPurchase: (data: any) => fetchJson<{ success: boolean; message: string; purchaseId: string; grandTotalPaise: number }>('/api/retailer/purchases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getExpenses: () => fetchJson<{ expenses: any[] }>('/api/retailer/expenses'),
  recordExpense: (data: any) => fetchJson<{ success: boolean; message: string; expenseId: string }>('/api/retailer/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSalesRegister: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return fetchJson<{ register: any[] }>(`/api/retailer/registers/sales?${query.toString()}`);
  },

  // Supplier
  getSupplierProducts: () => fetchJson<{ products: any[] }>('/api/supplier/products'),
  createSupplierProduct: (data: any) => fetchJson<{ success: boolean; message: string; productId: string }>('/api/supplier/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSupplierProduct: (id: string, data: any) => fetchJson<{ success: boolean; message: string }>(`/api/supplier/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleProductActive: (id: string) => fetchJson<{ success: boolean; active: number }>(`/api/supplier/products/${id}/toggle`, {
    method: 'PATCH',
  }),
  getSupplierOrders: () => fetchJson<{ orders: any[] }>('/api/supplier/orders'),

  // Admin
  getAdminSystemStatus: () => fetchJson<{
    system: any;
    shops?: any[];
    suppliers?: any[];
    recentOrders?: any[];
    auditEvents: any[];
    environment: string;
  }>('/api/admin/system-status'),
  resetDemoData: () => fetchJson<{ success: boolean; message: string }>('/api/admin/reset-demo-data', {
    method: 'POST',
    body: JSON.stringify({ confirmed: true }),
  }),
};

export function formatInr(paise: number): string {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}
