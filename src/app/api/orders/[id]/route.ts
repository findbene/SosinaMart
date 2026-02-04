import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  handleApiError,
  withAuth,
  ExtendedSession,
} from '@/lib/api-utils';
import { ApiErrors } from '@/lib/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id] - Get a single order
export const GET = withAuth(async (
  request: NextRequest,
  context?: { params?: Record<string, string>; session?: ExtendedSession }
) => {
  try {
    const id = context?.params?.id;
    const session = context?.session;

    if (!id) {
      throw ApiErrors.invalidInput('Order ID is required');
    }

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Fetch order
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      throw ApiErrors.notFound('Order');
    }

    // Non-admin users can only see their own orders
    if (session?.user.role !== 'admin' && order.customer_email !== session?.user.email) {
      throw ApiErrors.forbidden('You can only view your own orders');
    }

    // Fetch status history
    const { data: statusHistory } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    return createApiResponse({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      statusHistory: statusHistory || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PATCH /api/orders/[id] - Update order (admin only for most fields, user can cancel)
export const PATCH = withAuth(async (
  request: NextRequest,
  context?: { params?: Record<string, string>; session?: ExtendedSession }
) => {
  try {
    const id = context?.params?.id;
    const session = context?.session;

    if (!id) {
      throw ApiErrors.invalidInput('Order ID is required');
    }

    const body = await request.json();

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Fetch existing order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      throw ApiErrors.notFound('Order');
    }

    // Non-admin users can only cancel their own pending orders
    if (session?.user.role !== 'admin') {
      if (order.customer_email !== session?.user.email) {
        throw ApiErrors.forbidden('You can only modify your own orders');
      }
      if (body.status && body.status !== 'cancelled') {
        throw ApiErrors.forbidden('You can only cancel orders');
      }
      if (order.status !== 'pending') {
        throw ApiErrors.invalidInput('Only pending orders can be cancelled');
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updates.status = body.status;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      throw ApiErrors.databaseError('Failed to update order');
    }

    // Add status history entry if status changed
    if (body.status && body.status !== order.status) {
      await supabase.from('order_status_history').insert({
        order_id: id,
        status: body.status,
        note: body.statusNote || `Status changed to ${body.status}`,
        created_by: session?.user.id,
        created_at: new Date().toISOString(),
      });
    }

    return createApiResponse({
      ...updatedOrder,
      items: typeof updatedOrder.items === 'string'
        ? JSON.parse(updatedOrder.items)
        : updatedOrder.items,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
