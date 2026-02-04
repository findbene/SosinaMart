import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PRODUCTS } from '@/lib/data';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
  getPaginationParams,
  createPaginationMeta,
  withAdmin,
} from '@/lib/api-utils';
import {
  productQuerySchema,
  createProductSchema,
  validate,
  formatZodErrors,
} from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';
import { Product } from '@/types';

// GET /api/products - List all products with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);

    // Validate query parameters
    const validation = validate(productQuerySchema, searchParams);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const {
      category,
      search,
      featured,
      inStock,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = validation.data;
    const offset = (page - 1) * limit;

    // Check if Supabase is configured
    if (!supabase) {
      // Use local data
      let filteredProducts = [...PRODUCTS];

      // Apply filters
      if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          p => p.name.toLowerCase().includes(searchLower) ||
               p.description?.toLowerCase().includes(searchLower)
        );
      }
      if (featured !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.featured === featured);
      }
      if (inStock !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.inStock === inStock);
      }
      if (minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price >= minPrice);
      }
      if (maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
      }

      // Apply sorting
      if (sortBy) {
        filteredProducts.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            default:
              comparison = 0;
          }
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      return createApiResponse(paginatedProducts, createPaginationMeta(page, limit, total));
    }

    // Use Supabase
    let query = supabase.from('products').select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (featured !== undefined) {
      query = query.eq('featured', featured);
    }
    if (inStock !== undefined) {
      query = query.eq('in_stock', inStock);
    }
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Apply sorting
    const orderColumn = sortBy === 'createdAt' ? 'created_at' : sortBy || 'created_at';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      throw ApiErrors.databaseError('Failed to fetch products');
    }

    return createApiResponse(
      products || [],
      createPaginationMeta(page, limit, count || 0)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/products - Create a new product (admin only)
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(createProductSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid product data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const productData = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        image: productData.image || '/images/products/placeholder.jpg',
        in_stock: productData.inStock,
        featured: productData.featured,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
      throw ApiErrors.databaseError('Failed to create product');
    }

    return createApiResponse(newProduct, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
