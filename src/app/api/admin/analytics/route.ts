import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  handleApiError,
  withAdmin,
} from '@/lib/api-utils';

// GET /api/admin/analytics - Aggregate analytics data for admin dashboard
export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'dashboard';
    const range = request.nextUrl.searchParams.get('range') || '30d';

    // If Supabase is not configured, return null so hooks fall back to mock data
    if (!supabase) {
      return createApiResponse(null);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Previous period for comparison
    const periodMs = now.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodMs);

    if (type === 'dashboard') {
      return createApiResponse(await getDashboardStats(startDate, prevStartDate));
    }

    // Full analytics
    const [dashboard, revenue, ordersByStatus, topProducts, topCategories, customerStats] = await Promise.all([
      getDashboardStats(startDate, prevStartDate),
      getRevenueByMonth(),
      getOrdersByStatus(),
      getTopProducts(),
      getTopCategories(),
      getCustomerStats(startDate),
    ]);

    const dashboardData = dashboard ?? {
      totalOrders: 0, totalRevenue: 0, totalCustomers: 0,
      totalProducts: 0, ordersChange: 0, revenueChange: 0, customersChange: 0,
    };

    return createApiResponse({
      ...dashboardData,
      revenue: {
        total: dashboardData.totalRevenue,
        change: dashboardData.revenueChange,
        monthly: revenue,
      },
      orders: {
        total: dashboardData.totalOrders,
        change: dashboardData.ordersChange,
        byStatus: ordersByStatus,
      },
      customers: customerStats,
      topProducts,
      topCategories,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

async function getDashboardStats(startDate: Date, prevStartDate: Date) {
  if (!supabase) return null;

  // Current period orders
  const { count: currentOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .not('status', 'eq', 'cancelled');

  // Previous period orders
  const { count: prevOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', prevStartDate.toISOString())
    .lt('created_at', startDate.toISOString())
    .not('status', 'eq', 'cancelled');

  // Total orders (all time)
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // Revenue current period
  const { data: currentRevData } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', startDate.toISOString())
    .not('status', 'eq', 'cancelled');
  const currentRevenue = currentRevData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  // Revenue previous period
  const { data: prevRevData } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', prevStartDate.toISOString())
    .lt('created_at', startDate.toISOString())
    .not('status', 'eq', 'cancelled');
  const prevRevenue = prevRevData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  // Total revenue (all time)
  const { data: totalRevData } = await supabase
    .from('orders')
    .select('total')
    .not('status', 'eq', 'cancelled');
  const totalRevenue = totalRevData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  // Total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  // New customers current period
  const { count: currentNewCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('customer_since', startDate.toISOString());

  // New customers previous period
  const { count: prevNewCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('customer_since', prevStartDate.toISOString())
    .lt('customer_since', startDate.toISOString());

  // Total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Calculate % changes
  const ordersChange = prevOrders && prevOrders > 0
    ? Number((((currentOrders ?? 0) - prevOrders) / prevOrders * 100).toFixed(1))
    : 0;
  const revenueChange = prevRevenue > 0
    ? Number(((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1))
    : 0;
  const customersChange = prevNewCustomers && prevNewCustomers > 0
    ? Number((((currentNewCustomers ?? 0) - prevNewCustomers) / prevNewCustomers * 100).toFixed(1))
    : 0;

  return {
    totalOrders: totalOrders ?? 0,
    totalRevenue,
    totalCustomers: totalCustomers ?? 0,
    totalProducts: totalProducts ?? 0,
    ordersChange,
    revenueChange,
    customersChange,
  };
}

async function getRevenueByMonth() {
  if (!supabase) return [];

  const { data: orders } = await supabase
    .from('orders')
    .select('total, created_at')
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: true });

  if (!orders || orders.length === 0) return [];

  // Group by month
  const monthMap = new Map<string, number>();
  for (const order of orders) {
    const date = new Date(order.created_at);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(order.total));
  }

  // Return last 6 months
  const entries = Array.from(monthMap.entries());
  return entries.slice(-6).map(([month, amount]) => ({
    month: month.split(' ')[0], // Just the month name
    amount: Number(amount.toFixed(2)),
  }));
}

async function getOrdersByStatus() {
  if (!supabase) return [];

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase!
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      return { status: status.charAt(0).toUpperCase() + status.slice(1), count: count ?? 0 };
    })
  );

  return results.filter(r => r.count > 0);
}

async function getTopProducts() {
  if (!supabase) return [];

  // Get all non-cancelled orders with items
  const { data: orders } = await supabase
    .from('orders')
    .select('items, total')
    .not('status', 'eq', 'cancelled');

  if (!orders || orders.length === 0) return [];

  // Aggregate product sales from order items
  const productMap = new Map<string, { name: string; sold: number; revenue: number }>();

  for (const order of orders) {
    let items: { productName?: string; name?: string; quantity?: number; price?: number }[] = [];
    if (typeof order.items === 'string') {
      try { items = JSON.parse(order.items); } catch { continue; }
    } else if (Array.isArray(order.items)) {
      items = order.items;
    }

    for (const item of items) {
      const name = item.productName || item.name || 'Unknown';
      const existing = productMap.get(name) || { name, sold: 0, revenue: 0 };
      existing.sold += item.quantity || 1;
      existing.revenue += (item.price || 0) * (item.quantity || 1);
      productMap.set(name, existing);
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p, i) => ({ id: String(i + 1), ...p, revenue: Number(p.revenue.toFixed(2)) }));
}

async function getTopCategories() {
  if (!supabase) return [];

  // Get all orders with items, then cross-reference with products for categories
  const { data: orders } = await supabase
    .from('orders')
    .select('items')
    .not('status', 'eq', 'cancelled');

  const { data: products } = await supabase
    .from('products')
    .select('name, category');

  if (!orders || !products) return [];

  // Build name-to-category map
  const categoryMap = new Map<string, string>();
  for (const p of products) {
    categoryMap.set(p.name.toLowerCase(), p.category);
  }

  // Aggregate by category
  const catStats = new Map<string, { orders: number; revenue: number }>();

  for (const order of orders) {
    let items: { productName?: string; name?: string; quantity?: number; price?: number }[] = [];
    if (typeof order.items === 'string') {
      try { items = JSON.parse(order.items); } catch { continue; }
    } else if (Array.isArray(order.items)) {
      items = order.items;
    }

    for (const item of items) {
      const name = (item.productName || item.name || '').toLowerCase();
      const category = categoryMap.get(name) || 'Other';
      const displayCat = category.charAt(0).toUpperCase() + category.slice(1);
      const existing = catStats.get(displayCat) || { orders: 0, revenue: 0 };
      existing.orders += item.quantity || 1;
      existing.revenue += (item.price || 0) * (item.quantity || 1);
      catStats.set(displayCat, existing);
    }
  }

  return Array.from(catStats.entries())
    .map(([category, stats]) => ({ category, ...stats, revenue: Number(stats.revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

async function getCustomerStats(startDate: Date) {
  if (!supabase) return { total: 0, newThisMonth: 0, returning: 0 };

  const { count: total } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  const { count: newThisMonth } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('customer_since', startDate.toISOString());

  return {
    total: total ?? 0,
    newThisMonth: newThisMonth ?? 0,
    returning: Math.max(0, (total ?? 0) - (newThisMonth ?? 0)),
  };
}
