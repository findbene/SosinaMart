'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PRODUCTS } from '@/lib/data';
import type { Product } from '@/types';

// =============================================
// Types
// =============================================

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: number | string;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface AdminCustomer {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  name: string; // computed: firstName + lastName
  address?: string;
  status: 'active' | 'inactive' | 'blocked';
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  customerSince: string;
  createdAt: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  stats: {
    averageOrderValue: number;
    daysSinceLastOrder: number | null;
    lifetimeValue: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  recentInteractions: {
    id: string;
    type: string;
    subject: string;
    content?: string;
    createdBy?: string;
    createdAt: string;
  }[];
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  ordersChange: number;
  revenueChange: number;
  customersChange: number;
}

export interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    monthly: { month: string; amount: number }[];
  };
  orders: {
    total: number;
    change: number;
    byStatus: { status: string; count: number }[];
  };
  customers: {
    total: number;
    newThisMonth: number;
    returning: number;
  };
  topProducts: {
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }[];
  topCategories: {
    category: string;
    orders: number;
    revenue: number;
  }[];
}

export interface OrderFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerFilters {
  status?: string;
  search?: string;
  segment?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =============================================
// Snake_case to camelCase transform helpers
// =============================================

function transformOrder(raw: Record<string, unknown>): AdminOrder {
  const items = raw.items;
  let itemCount: number | string;
  if (typeof items === 'string') {
    try {
      itemCount = JSON.parse(items).length;
    } catch {
      itemCount = items;
    }
  } else if (Array.isArray(items)) {
    itemCount = items.length;
  } else {
    itemCount = 0;
  }

  return {
    id: raw.id as string,
    orderNumber: (raw.order_number ?? raw.orderNumber) as string,
    customerName: (raw.customer_name ?? raw.customerName) as string,
    customerEmail: (raw.customer_email ?? raw.customerEmail) as string,
    customerPhone: (raw.customer_phone ?? raw.customerPhone ?? '') as string,
    items: itemCount,
    total: Number(raw.total) || 0,
    status: (raw.status as AdminOrder['status']) || 'pending',
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt) as string | undefined,
  };
}

function transformCustomer(raw: Record<string, unknown>): AdminCustomer {
  const firstName = (raw.first_name ?? raw.firstName ?? '') as string;
  const lastName = (raw.last_name ?? raw.lastName ?? '') as string;
  return {
    id: raw.id as string,
    email: raw.email as string,
    phone: raw.phone as string | undefined,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    address: raw.address as string | undefined,
    status: (raw.status as AdminCustomer['status']) || 'active',
    totalOrders: Number(raw.total_orders ?? raw.totalOrders) || 0,
    totalSpent: Number(raw.total_spent ?? raw.totalSpent) || 0,
    averageOrderValue: Number(raw.average_order_value ?? raw.averageOrderValue) || 0,
    lastOrderAt: (raw.last_order_at ?? raw.lastOrderAt ?? null) as string | null,
    customerSince: (raw.customer_since ?? raw.customerSince ?? raw.created_at ?? raw.createdAt) as string,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  };
}

function transformCustomerDetail(raw: Record<string, unknown>): AdminCustomerDetail {
  const base = transformCustomer(raw);
  const stats = raw.stats as Record<string, unknown> | undefined;
  const recentOrders = (raw.recentOrders ?? raw.recent_orders ?? []) as Record<string, unknown>[];
  const recentInteractions = (raw.recentInteractions ?? raw.recent_interactions ?? []) as Record<string, unknown>[];

  return {
    ...base,
    stats: {
      averageOrderValue: Number(stats?.averageOrderValue ?? stats?.average_order_value ?? base.averageOrderValue) || 0,
      daysSinceLastOrder: stats?.daysSinceLastOrder as number | null ?? stats?.days_since_last_order as number | null ?? null,
      lifetimeValue: Number(stats?.lifetimeValue ?? stats?.lifetime_value ?? base.totalSpent) || 0,
    },
    recentOrders: recentOrders.map(o => ({
      id: o.id as string,
      orderNumber: (o.order_number ?? o.orderNumber) as string,
      total: Number(o.total) || 0,
      status: o.status as string,
      createdAt: (o.created_at ?? o.createdAt) as string,
    })),
    recentInteractions: recentInteractions.map(i => ({
      id: i.id as string,
      type: i.type as string,
      subject: (i.subject ?? '') as string,
      content: i.content as string | undefined,
      createdBy: (i.created_by ?? i.createdBy) as string | undefined,
      createdAt: (i.created_at ?? i.createdAt) as string,
    })),
  };
}

// =============================================
// Mock Data (fallback when API returns empty)
// =============================================

const MOCK_ORDERS: AdminOrder[] = [
  { id: '1', orderNumber: 'SM-2024-001', customerName: 'Abebe Kebede', customerEmail: 'abebe@example.com', customerPhone: '+1 470-359-7924', items: 3, total: 89.99, status: 'pending', createdAt: new Date().toISOString() },
  { id: '2', orderNumber: 'SM-2024-002', customerName: 'Sara Hailu', customerEmail: 'sara@example.com', customerPhone: '+1 404-555-0123', items: 5, total: 156.50, status: 'processing', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', orderNumber: 'SM-2024-003', customerName: 'Dawit Mengistu', customerEmail: 'dawit@example.com', customerPhone: '', items: 2, total: 245.00, status: 'shipped', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', orderNumber: 'SM-2024-004', customerName: 'Tigist Alemu', customerEmail: 'tigist@example.com', customerPhone: '+1 678-555-0456', items: 1, total: 78.25, status: 'delivered', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: '5', orderNumber: 'SM-2024-005', customerName: 'Yonas Bekele', customerEmail: 'yonas@example.com', customerPhone: '', items: 4, total: 312.75, status: 'pending', createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: '6', orderNumber: 'SM-2024-006', customerName: 'Hana Tesfaye', customerEmail: 'hana@example.com', customerPhone: '', items: 2, total: 125.00, status: 'cancelled', createdAt: new Date(Date.now() - 432000000).toISOString() },
];

const MOCK_CUSTOMERS: AdminCustomer[] = [
  { id: '1', email: 'abebe@example.com', phone: '+1 470-359-7924', firstName: 'Abebe', lastName: 'Kebede', name: 'Abebe Kebede', status: 'active', totalOrders: 12, totalSpent: 1245.50, averageOrderValue: 103.79, lastOrderAt: new Date().toISOString(), customerSince: new Date(Date.now() - 90 * 86400000).toISOString(), createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: '2', email: 'sara@example.com', phone: '+1 404-555-0123', firstName: 'Sara', lastName: 'Hailu', name: 'Sara Hailu', status: 'active', totalOrders: 5, totalSpent: 456.25, averageOrderValue: 91.25, lastOrderAt: new Date(Date.now() - 7 * 86400000).toISOString(), customerSince: new Date(Date.now() - 60 * 86400000).toISOString(), createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: '3', email: 'dawit@example.com', firstName: 'Dawit', lastName: 'Mengistu', name: 'Dawit Mengistu', status: 'active', totalOrders: 3, totalSpent: 189.00, averageOrderValue: 63.00, lastOrderAt: new Date(Date.now() - 14 * 86400000).toISOString(), customerSince: new Date(Date.now() - 45 * 86400000).toISOString(), createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: '4', email: 'tigist@example.com', phone: '+1 678-555-0456', firstName: 'Tigist', lastName: 'Alemu', name: 'Tigist Alemu', status: 'inactive', totalOrders: 1, totalSpent: 78.25, averageOrderValue: 78.25, lastOrderAt: new Date(Date.now() - 60 * 86400000).toISOString(), customerSince: new Date(Date.now() - 120 * 86400000).toISOString(), createdAt: new Date(Date.now() - 120 * 86400000).toISOString() },
  { id: '5', email: 'yonas@example.com', firstName: 'Yonas', lastName: 'Bekele', name: 'Yonas Bekele', status: 'active', totalOrders: 8, totalSpent: 892.50, averageOrderValue: 111.56, lastOrderAt: new Date(Date.now() - 3 * 86400000).toISOString(), customerSince: new Date(Date.now() - 180 * 86400000).toISOString(), createdAt: new Date(Date.now() - 180 * 86400000).toISOString() },
];

const MOCK_CUSTOMER_DETAIL: Record<string, AdminCustomerDetail> = {
  '1': {
    ...MOCK_CUSTOMERS[0],
    stats: { averageOrderValue: 103.79, daysSinceLastOrder: 0, lifetimeValue: 1245.50 },
    recentOrders: [
      { id: '1', orderNumber: 'SM-2024-001', total: 89.99, status: 'delivered', createdAt: new Date().toISOString() },
      { id: '2', orderNumber: 'SM-2024-002', total: 156.50, status: 'shipped', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: '3', orderNumber: 'SM-2023-045', total: 245.00, status: 'delivered', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    ],
    recentInteractions: [
      { id: '1', type: 'note', subject: 'Delivery preference', content: 'Customer prefers delivery in the evening.', createdBy: 'Admin', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: '2', type: 'email', subject: 'Ethiopian New Year sale', content: 'Sent promotional email for Ethiopian New Year sale.', createdBy: 'System', createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    ],
  },
};

const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalOrders: 156,
  totalRevenue: 12450.00,
  totalCustomers: 89,
  totalProducts: 45,
  ordersChange: 12.5,
  revenueChange: 8.3,
  customersChange: 15.2,
};

const MOCK_ANALYTICS: AnalyticsData = {
  revenue: {
    total: 12450.00,
    change: 8.3,
    monthly: [
      { month: 'Sep', amount: 8200 },
      { month: 'Oct', amount: 9100 },
      { month: 'Nov', amount: 10500 },
      { month: 'Dec', amount: 11200 },
      { month: 'Jan', amount: 12450 },
    ],
  },
  orders: {
    total: 156,
    change: 12.5,
    byStatus: [
      { status: 'Pending', count: 12 },
      { status: 'Processing', count: 8 },
      { status: 'Shipped', count: 15 },
      { status: 'Delivered', count: 118 },
      { status: 'Cancelled', count: 3 },
    ],
  },
  customers: {
    total: 89,
    newThisMonth: 12,
    returning: 77,
  },
  topProducts: [
    { id: '1', name: 'Berbere Spice (1lb)', sold: 45, revenue: 584.55 },
    { id: '2', name: 'Ethiopian Coffee (1lb)', sold: 38, revenue: 721.62 },
    { id: '3', name: 'Injera (Pack of 5)', sold: 32, revenue: 511.68 },
    { id: '4', name: 'Mitmita Spice (8oz)', sold: 28, revenue: 307.72 },
    { id: '5', name: 'Teff Flour (5lb)', sold: 25, revenue: 374.75 },
  ],
  topCategories: [
    { category: 'Spices', orders: 85, revenue: 1892.45 },
    { category: 'Coffee', orders: 52, revenue: 1456.00 },
    { category: 'Food', orders: 48, revenue: 1124.50 },
    { category: 'Traditional Clothes', orders: 25, revenue: 2875.00 },
    { category: 'Kitchenware', orders: 18, revenue: 892.25 },
  ],
};

// =============================================
// Generic fetch helper
// =============================================

async function fetchApi<T>(url: string): Promise<{ data: T | null; error: string | null; meta?: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { data: null, error: null }; // Not authenticated — use mock
      }
      return { data: null, error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    if (json.success) {
      return { data: json.data as T, error: null, meta: json.meta };
    }
    return { data: null, error: json.error?.message || 'Unknown error' };
  } catch {
    return { data: null, error: null }; // Network error — use mock
  }
}

// =============================================
// Hooks
// =============================================

/**
 * Fetch orders with optional filters. Falls back to mock data when API is unavailable.
 */
export function useOrders(filters?: OrderFilters): ApiResult<AdminOrder[]> & { meta?: Record<string, unknown> } {
  const [data, setData] = useState<AdminOrder[] | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(JSON.stringify(filters));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const url = `/api/orders${params.toString() ? '?' + params.toString() : ''}`;
    const result = await fetchApi<Record<string, unknown>[]>(url);

    if (result.data && result.data.length > 0) {
      setData(result.data.map(transformOrder));
      setMeta(result.meta);
    } else if (result.error) {
      setError(result.error);
      setData(MOCK_ORDERS);
    } else {
      // API returned empty or not available — use mock
      setData(MOCK_ORDERS);
    }
    setIsLoading(false);
  }, [filters?.status, filters?.search, filters?.page, filters?.limit, filters?.sortBy, filters?.sortOrder]);

  useEffect(() => {
    const newFilters = JSON.stringify(filters);
    if (newFilters !== filtersRef.current) {
      filtersRef.current = newFilters;
    }
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, meta };
}

/**
 * Fetch customers with optional filters. Falls back to mock data when API is unavailable.
 */
export function useCustomers(filters?: CustomerFilters): ApiResult<AdminCustomer[]> & { meta?: Record<string, unknown> } {
  const [data, setData] = useState<AdminCustomer[] | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.segment) params.set('segment', filters.segment);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const url = `/api/customers${params.toString() ? '?' + params.toString() : ''}`;
    const result = await fetchApi<Record<string, unknown>[]>(url);

    if (result.data && result.data.length > 0) {
      setData(result.data.map(transformCustomer));
      setMeta(result.meta);
    } else if (result.error) {
      setError(result.error);
      setData(MOCK_CUSTOMERS);
    } else {
      setData(MOCK_CUSTOMERS);
    }
    setIsLoading(false);
  }, [filters?.status, filters?.search, filters?.segment, filters?.page, filters?.limit, filters?.sortBy, filters?.sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, meta };
}

/**
 * Fetch a single customer with full profile. Falls back to mock data.
 */
export function useCustomer(id: string): ApiResult<AdminCustomerDetail> {
  const [data, setData] = useState<AdminCustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchApi<Record<string, unknown>>(`/api/customers/${id}`);

    if (result.data && result.data.id) {
      setData(transformCustomerDetail(result.data));
    } else if (result.error) {
      setError(result.error);
      // Fall back to mock detail or construct from mock list
      const mock = MOCK_CUSTOMER_DETAIL[id];
      if (mock) {
        setData(mock);
      } else {
        const fromList = MOCK_CUSTOMERS.find(c => c.id === id);
        if (fromList) {
          setData({
            ...fromList,
            stats: { averageOrderValue: fromList.averageOrderValue, daysSinceLastOrder: null, lifetimeValue: fromList.totalSpent },
            recentOrders: [],
            recentInteractions: [],
          });
        }
      }
    } else {
      // No data — use mock
      const mock = MOCK_CUSTOMER_DETAIL[id];
      if (mock) {
        setData(mock);
      } else {
        const fromList = MOCK_CUSTOMERS.find(c => c.id === id);
        if (fromList) {
          setData({
            ...fromList,
            stats: { averageOrderValue: fromList.averageOrderValue, daysSinceLastOrder: null, lifetimeValue: fromList.totalSpent },
            recentOrders: [],
            recentInteractions: [],
          });
        }
      }
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Fetch dashboard stats. Falls back to mock data.
 */
export function useDashboardStats(): ApiResult<DashboardStats> {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchApi<DashboardStats>('/api/admin/analytics?type=dashboard');

    if (result.data && result.data.totalOrders !== undefined) {
      setData(result.data);
    } else {
      // API not available yet — use mock
      setData(MOCK_DASHBOARD_STATS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Fetch analytics data for a time range. Falls back to mock data.
 */
export function useAnalytics(timeRange: string): ApiResult<AnalyticsData> {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchApi<AnalyticsData>(`/api/admin/analytics?type=full&range=${timeRange}`);

    if (result.data && result.data.revenue) {
      setData(result.data);
    } else {
      setData(MOCK_ANALYTICS);
    }
    setIsLoading(false);
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Fetch products. Uses PRODUCTS from data.ts as primary, API as override when Supabase is live.
 */
export function useProducts(): ApiResult<Product[]> {
  const [data, setData] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchApi<Product[]>('/api/products?limit=100');

    if (result.data && result.data.length > 0) {
      setData(result.data);
    } else {
      // Use local PRODUCTS data
      setData(PRODUCTS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Submit a customer interaction (note, email, call).
 */
export async function submitInteraction(
  customerId: string,
  interaction: { type: string; subject: string; content: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/customers/${customerId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(interaction),
    });
    const json = await res.json();
    if (json.success) return { success: true };
    return { success: false, error: json.error?.message || 'Failed to save' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
