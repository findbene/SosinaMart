import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  withAdmin,
  ExtendedSession,
} from '@/lib/api-utils';
import { updateOrderStatusSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/orders/[id]/status - Update order status (admin only)
export const PATCH = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string>; session?: ExtendedSession }
) => {
  try {
    const id = context?.params?.id;
    const session = context?.session;

    if (!id) {
      throw ApiErrors.invalidInput('Order ID is required');
    }

    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(updateOrderStatusSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid status data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { status, note } = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Fetch existing order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, customer_id, order_number')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      throw ApiErrors.notFound('Order');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw ApiErrors.invalidInput(
        `Cannot transition from '${order.status}' to '${status}'`
      );
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Order status update error:', updateError);
      throw ApiErrors.databaseError('Failed to update order status');
    }

    // Create status history entry
    await supabase.from('order_status_history').insert({
      order_id: id,
      status,
      note: note || `Status updated to ${status}`,
      created_by: session?.user.id,
      created_at: new Date().toISOString(),
    });

    // Log customer interaction
    if (order.customer_id) {
      await supabase.from('customer_interactions').insert({
        customer_id: order.customer_id,
        type: 'order',
        subject: `Order ${order.order_number} status updated`,
        content: `Order status changed from ${order.status} to ${status}`,
        metadata: { orderId: id, oldStatus: order.status, newStatus: status },
        created_at: new Date().toISOString(),
      });
    }

    // TODO: Send status update email based on new status
    // - confirmed: Order confirmation
    // - shipped: Shipping notification with tracking
    // - delivered: Delivery confirmation
    // - cancelled: Cancellation notice

    return createApiResponse({
      id: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      previousStatus: order.status,
      currentStatus: status,
      updatedAt: updatedOrder.updated_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
