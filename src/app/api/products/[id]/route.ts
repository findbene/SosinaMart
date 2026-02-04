import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getProductById } from '@/lib/data';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  getRequiredParam,
  withAdmin,
} from '@/lib/api-utils';
import { updateProductSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const id = params.id;

    // Check if Supabase is configured
    if (!supabase) {
      // Use local data
      const product = getProductById(id);
      if (!product) {
        throw ApiErrors.notFound('Product');
      }
      return createApiResponse(product);
    }

    // Use Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      throw ApiErrors.notFound('Product');
    }

    return createApiResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/products/[id] - Update a product (admin only)
export const PUT = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => {
  try {
    const id = getRequiredParam(context?.params, 'id');
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(updateProductSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid product data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const updateData = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw ApiErrors.notFound('Product');
    }

    // Update product
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.price !== undefined && { price: updateData.price }),
        ...(updateData.category && { category: updateData.category }),
        ...(updateData.image && { image: updateData.image }),
        ...(updateData.inStock !== undefined && { in_stock: updateData.inStock }),
        ...(updateData.featured !== undefined && { featured: updateData.featured }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Product update error:', error);
      throw ApiErrors.databaseError('Failed to update product');
    }

    return createApiResponse(updatedProduct);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/products/[id] - Delete a product (admin only)
export const DELETE = withAdmin(async (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => {
  try {
    const id = getRequiredParam(context?.params, 'id');

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw ApiErrors.notFound('Product');
    }

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Product deletion error:', error);
      throw ApiErrors.databaseError('Failed to delete product');
    }

    return createApiResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});
