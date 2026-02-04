import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  getPaginationParams,
  createPaginationMeta,
  withAuth,
  ExtendedSession,
} from '@/lib/api-utils';
import {
  orderQuerySchema,
  createOrderSchema,
  validate,
  formatZodErrors,
} from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';
import { generateOrderNumber } from '@/lib/utils';

// GET /api/orders - List orders (authenticated)
export const GET = withAuth(async (
  request: NextRequest,
  context?: { params?: Record<string, string>; session?: ExtendedSession }
) => {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const session = context?.session;

    // Validate query parameters
    const validation = validate(orderQuerySchema, searchParams);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const {
      status,
      customerId,
      customerEmail,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = validation.data;
    const offset = (page - 1) * limit;

    // Check if Supabase is configured
    if (!supabase) {
      // Return empty array in dev mode
      return createApiResponse([], createPaginationMeta(page, limit, 0));
    }

    let query = supabase.from('orders').select('*', { count: 'exact' });

    // Non-admin users can only see their own orders
    if (session?.user.role !== 'admin') {
      query = query.eq('customer_email', session?.user.email);
    } else {
      // Admin filters
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      }
    }

    // Apply common filters
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting
    const orderColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      throw ApiErrors.databaseError('Failed to fetch orders');
    }

    return createApiResponse(
      orders || [],
      createPaginationMeta(page, limit, count || 0)
    );
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/orders - Create a new order (public for checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(createOrderSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid order data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { customer, items, notes } = validation.data;
    const orderNumber = generateOrderNumber();

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Check if Supabase is configured
    if (!supabase) {
      // Development mode - return mock order
      return createApiResponse(
        {
          id: `dev-${Date.now()}`,
          orderNumber,
          customer,
          items,
          total,
          status: 'pending',
          createdAt: new Date().toISOString(),
          notes,
        },
        undefined,
        201
      );
    }

    // Find or create customer
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customer.email.toLowerCase())
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const nameParts = customer.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: customer.email.toLowerCase(),
          phone: customer.phone,
          first_name: firstName,
          last_name: lastName,
          address: customer.address,
          status: 'active',
          customer_since: new Date().toISOString(),
          total_orders: 0,
          total_spent: 0,
        })
        .select('id')
        .single();

      if (!customerError && newCustomer) {
        customerId = newCustomer.id;
      }
    }

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customer.name,
        customer_email: customer.email.toLowerCase(),
        customer_phone: customer.phone,
        customer_address: customer.address,
        items: JSON.stringify(items),
        total,
        status: 'pending',
        notes,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw ApiErrors.databaseError('Failed to create order');
    }

    // Create initial status history entry
    await supabase.from('order_status_history').insert({
      order_id: newOrder.id,
      status: 'pending',
      note: 'Order placed',
      created_at: new Date().toISOString(),
    });

    // Update customer stats
    if (customerId) {
      await supabase.rpc('update_customer_stats', {
        p_customer_id: customerId,
        p_order_total: total,
      });

      // Log interaction
      await supabase.from('customer_interactions').insert({
        customer_id: customerId,
        type: 'order',
        subject: `Order ${orderNumber} placed`,
        content: `Order total: $${total.toFixed(2)}`,
        metadata: { orderId: newOrder.id, orderNumber },
        created_at: new Date().toISOString(),
      });
    }

    // TODO: Send order confirmation email

    return createApiResponse(
      {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        customer,
        items,
        total,
        status: newOrder.status,
        createdAt: newOrder.created_at,
        notes: newOrder.notes,
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
