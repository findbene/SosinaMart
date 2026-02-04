import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  getPaginationParams,
  createPaginationMeta,
  withAdmin,
  ExtendedSession,
} from '@/lib/api-utils';
import { createInteractionSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/customers/[id]/interactions - List customer interactions
export const GET = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => {
  try {
    const id = context?.params?.id;
    const { page, limit, offset } = getPaginationParams(request);

    if (!id) {
      throw ApiErrors.invalidInput('Customer ID is required');
    }

    // Check if Supabase is configured
    if (!supabase) {
      return createApiResponse([], createPaginationMeta(page, limit, 0));
    }

    // Check if customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!customer) {
      throw ApiErrors.notFound('Customer');
    }

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('customer_interactions')
      .select('*', { count: 'exact' })
      .eq('customer_id', id);

    if (type) {
      query = query.eq('type', type);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: interactions, error, count } = await query;

    if (error) {
      console.error('Interactions fetch error:', error);
      throw ApiErrors.databaseError('Failed to fetch interactions');
    }

    return createApiResponse(
      interactions || [],
      createPaginationMeta(page, limit, count || 0)
    );
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/customers/[id]/interactions - Log a new interaction
export const POST = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string>; session?: ExtendedSession }
) => {
  try {
    const id = context?.params?.id;
    const session = context?.session;

    if (!id) {
      throw ApiErrors.invalidInput('Customer ID is required');
    }

    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(createInteractionSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid interaction data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { type, subject, content, metadata } = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('id', id)
      .single();

    if (!customer) {
      throw ApiErrors.notFound('Customer');
    }

    // Create interaction
    const { data: newInteraction, error } = await supabase
      .from('customer_interactions')
      .insert({
        customer_id: id,
        type,
        subject,
        content,
        metadata,
        created_by: session?.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Interaction creation error:', error);
      throw ApiErrors.databaseError('Failed to create interaction');
    }

    // Update customer's last_interaction_at
    await supabase
      .from('customers')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', id);

    return createApiResponse(newInteraction, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
