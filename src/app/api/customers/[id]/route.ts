import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  withAdmin,
} from '@/lib/api-utils';
import { updateCustomerSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/customers/[id] - Get a single customer with full profile
export const GET = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => {
  try {
    const id = context?.params?.id;

    if (!id) {
      throw ApiErrors.invalidInput('Customer ID is required');
    }

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Fetch customer
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      throw ApiErrors.notFound('Customer');
    }

    // Fetch recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent interactions
    const { data: interactions } = await supabase
      .from('customer_interactions')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate additional stats
    const stats = {
      averageOrderValue: customer.total_orders > 0
        ? customer.total_spent / customer.total_orders
        : 0,
      daysSinceLastOrder: customer.last_order_at
        ? Math.floor((Date.now() - new Date(customer.last_order_at).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      lifetimeValue: customer.total_spent,
    };

    return createApiResponse({
      ...customer,
      stats,
      recentOrders: orders || [],
      recentInteractions: interactions || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/customers/[id] - Update a customer
export const PUT = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => {
  try {
    const id = context?.params?.id;

    if (!id) {
      throw ApiErrors.invalidInput('Customer ID is required');
    }

    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(updateCustomerSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid customer data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const updateData = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if customer exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw ApiErrors.notFound('Customer');
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.firstName) updates.first_name = updateData.firstName;
    if (updateData.lastName) updates.last_name = updateData.lastName;
    if (updateData.phone !== undefined) updates.phone = updateData.phone;
    if (updateData.address !== undefined) updates.address = updateData.address;
    if (updateData.status) updates.status = updateData.status;
    if (updateData.marketingConsent !== undefined) updates.marketing_consent = updateData.marketingConsent;
    if (updateData.notes !== undefined) updates.notes = updateData.notes;

    // Update customer
    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Customer update error:', error);
      throw ApiErrors.databaseError('Failed to update customer');
    }

    return createApiResponse(updatedCustomer);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/customers/[id] - Soft delete a customer (set status to inactive)
export const DELETE = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => {
  try {
    const id = context?.params?.id;

    if (!id) {
      throw ApiErrors.invalidInput('Customer ID is required');
    }

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if customer exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw ApiErrors.notFound('Customer');
    }

    // Soft delete by setting status to inactive
    const { error } = await supabase
      .from('customers')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Customer deletion error:', error);
      throw ApiErrors.databaseError('Failed to delete customer');
    }

    return createApiResponse({ message: 'Customer deactivated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});
