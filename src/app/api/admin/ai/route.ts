import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  withAdmin,
} from '@/lib/api-utils';
import {
  answerNaturalLanguageQuery,
  generateCustomerInsight,
  generateSmartAlerts,
  type NLQueryContext,
  type CustomerInsightInput,
  type SmartAlertInput,
} from '@/lib/ai-crm';

// Simple in-memory rate limiter: 20 queries per hour per session
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

// POST /api/admin/ai — Handle AI CRM requests
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { type, query, customerId, context } = body as {
      type: 'query' | 'insight' | 'alerts';
      query?: string;
      customerId?: string;
      context?: Record<string, unknown>;
    };

    if (!type) {
      return createApiError('BAD_REQUEST', 'Missing "type" field', 400);
    }

    // Check API key availability
    if (!process.env.GEMINI_API_KEY && type !== 'alerts') {
      return createApiError('AI_NOT_CONFIGURED', 'AI features require GEMINI_API_KEY to be configured', 503);
    }

    // Rate limit
    const rateLimitKey = 'admin-ai'; // Single admin for now
    if (!checkRateLimit(rateLimitKey)) {
      return createApiError('RATE_LIMITED', 'Rate limit exceeded. Max 20 AI queries per hour.', 429);
    }

    switch (type) {
      case 'query': {
        if (!query) {
          return createApiError('BAD_REQUEST', 'Missing "query" field', 400);
        }

        // Build context from DB or use provided context
        const nlContext = await buildQueryContext(context);
        const result = await answerNaturalLanguageQuery(query, nlContext);

        if (!result) {
          return createApiError('AI_UNAVAILABLE', 'AI service unavailable', 503);
        }

        return createApiResponse(result);
      }

      case 'insight': {
        if (!customerId) {
          return createApiError('BAD_REQUEST', 'Missing "customerId" field', 400);
        }

        const customerData = await getCustomerData(customerId);
        if (!customerData) {
          return createApiError('NOT_FOUND', 'Customer not found', 404);
        }

        const insight = await generateCustomerInsight(customerData);
        if (!insight) {
          return createApiError('AI_UNAVAILABLE', 'AI service unavailable', 503);
        }

        return createApiResponse(insight);
      }

      case 'alerts': {
        const alertInput = await buildAlertInput();
        const alerts = await generateSmartAlerts(alertInput);
        return createApiResponse(alerts);
      }

      default:
        return createApiError('BAD_REQUEST', `Unknown type: ${type}`, 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
});

// =============================================
// Context Builders
// =============================================

async function buildQueryContext(override?: Record<string, unknown>): Promise<NLQueryContext> {
  const defaults: NLQueryContext = {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
  };

  if (override) {
    return { ...defaults, ...override } as NLQueryContext;
  }

  if (!supabase) return defaults;

  try {
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('customer_name, total, status, created_at').not('status', 'eq', 'cancelled').order('created_at', { ascending: false }).limit(20),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
    ]);

    const orders = ordersRes.data ?? [];
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCustomers: customersRes.count ?? 0,
      totalProducts: productsRes.count ?? 0,
      recentOrders: orders.slice(0, 5).map(o => ({
        customerName: o.customer_name,
        total: Number(o.total),
        status: o.status,
        createdAt: o.created_at,
      })),
    };
  } catch {
    return defaults;
  }
}

async function getCustomerData(customerId: string): Promise<CustomerInsightInput | null> {
  if (!supabase) return null;

  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (!customer) return null;

    const { data: orders } = await supabase
      .from('orders')
      .select('order_number, total, status, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10);

    const now = new Date();
    const lastOrderAt = customer.last_order_at ? new Date(customer.last_order_at) : null;
    const daysSinceLastOrder = lastOrderAt
      ? Math.floor((now.getTime() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate health score inline
    const { calculateHealthScore } = await import('@/lib/customer-health');
    const health = calculateHealthScore({
      totalOrders: customer.total_orders,
      totalSpent: Number(customer.total_spent),
      lastOrderAt: customer.last_order_at,
      customerSince: customer.customer_since,
      averageOrderValue: Number(customer.average_order_value),
      daysSinceLastOrder,
    });

    return {
      name: `${customer.first_name} ${customer.last_name}`,
      totalOrders: customer.total_orders,
      totalSpent: Number(customer.total_spent),
      averageOrderValue: Number(customer.average_order_value),
      daysSinceLastOrder,
      customerSince: customer.customer_since,
      healthScore: health.score,
      healthLabel: health.label,
      churnRisk: health.churnRisk,
      recentOrders: (orders ?? []).map(o => ({
        orderNumber: o.order_number,
        total: Number(o.total),
        status: o.status,
        createdAt: o.created_at,
      })),
    };
  } catch {
    return null;
  }
}

async function buildAlertInput(): Promise<SmartAlertInput> {
  const defaults: SmartAlertInput = {
    totalOrders: 0,
    totalRevenue: 0,
    ordersChange: 0,
    revenueChange: 0,
    atRiskCustomers: 0,
    totalCustomers: 0,
    topProducts: [],
    recentOrders: [],
  };

  if (!supabase) return defaults;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [ordersRes, customersRes, atRiskRes] = await Promise.all([
      supabase.from('orders').select('customer_name, total, status, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('status', 'eq', 'cancelled'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true })
        .lt('last_order_at', ninetyDaysAgo.toISOString()),
    ]);

    const orders = ordersRes.data ?? [];
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      ordersChange: 0, // Would need previous period comparison
      revenueChange: 0,
      atRiskCustomers: atRiskRes.count ?? 0,
      totalCustomers: customersRes.count ?? 0,
      topProducts: [],
      recentOrders: orders.slice(0, 5).map(o => ({
        customerName: o.customer_name,
        total: Number(o.total),
        status: o.status,
      })),
    };
  } catch {
    return defaults;
  }
}
