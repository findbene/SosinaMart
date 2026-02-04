import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  createPaginationMeta,
  withAdmin,
} from '@/lib/api-utils';
import {
  customerQuerySchema,
  createCustomerSchema,
  validate,
  formatZodErrors,
} from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';

// GET /api/customers - List customers (admin only)
export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);

    // Validate query parameters
    const validation = validate(customerQuerySchema, searchParams);
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
      segment,
      search,
      minOrders,
      minSpent,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = validation.data;
    const offset = (page - 1) * limit;

    // Check if Supabase is configured
    if (!supabase) {
      return createApiResponse([], createPaginationMeta(page, limit, 0));
    }

    let query = supabase.from('customers').select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }
    if (minOrders !== undefined) {
      query = query.gte('total_orders', minOrders);
    }
    if (minSpent !== undefined) {
      query = query.gte('total_spent', minSpent);
    }

    // Handle segment filtering
    if (segment) {
      // Built-in segments
      const now = new Date();
      switch (segment) {
        case 'vip':
          query = query.gte('total_spent', 500);
          break;
        case 'repeat':
          query = query.gte('total_orders', 3);
          break;
        case 'new':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query = query.gte('customer_since', thirtyDaysAgo.toISOString());
          break;
        case 'at-risk':
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          query = query.lte('last_order_at', ninetyDaysAgo.toISOString());
          break;
        default:
          // Custom segment - fetch from segments table
          const { data: customSegment } = await supabase
            .from('customer_segments')
            .select('rules')
            .eq('id', segment)
            .single();

          if (customSegment?.rules) {
            // Apply custom segment rules
            // This is a simplified implementation
            // Using type assertions to prevent excessive type inference depth
            for (const rule of customSegment.rules) {
              switch (rule.operator) {
                case 'gte':
                  query = (query as any).gte(rule.field, rule.value);
                  break;
                case 'lte':
                  query = (query as any).lte(rule.field, rule.value);
                  break;
                case 'eq':
                  query = (query as any).eq(rule.field, rule.value);
                  break;
              }
            }
          }
      }
    }

    // Apply sorting
    const sortColumn = sortBy === 'createdAt' ? 'customer_since' :
                       sortBy === 'totalOrders' ? 'total_orders' :
                       sortBy === 'totalSpent' ? 'total_spent' :
                       sortBy === 'lastName' ? 'last_name' : 'customer_since';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('Customers fetch error:', error);
      throw ApiErrors.databaseError('Failed to fetch customers');
    }

    return createApiResponse(
      customers || [],
      createPaginationMeta(page, limit, count || 0)
    );
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/customers - Create a new customer (admin only)
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(createCustomerSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid customer data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { email, phone, firstName, lastName, address, marketingConsent } = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      throw ApiErrors.alreadyExists('Customer with this email');
    }

    // Create customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        email: email.toLowerCase(),
        phone,
        first_name: firstName,
        last_name: lastName,
        address,
        marketing_consent: marketingConsent,
        status: 'active',
        customer_since: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Customer creation error:', error);
      throw ApiErrors.databaseError('Failed to create customer');
    }

    return createApiResponse(newCustomer, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
