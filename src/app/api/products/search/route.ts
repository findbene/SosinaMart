import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PRODUCTS } from '@/lib/data';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { productSearchSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';
import { Product } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/products/search - Semantic search for products
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);

    // Validate query parameters
    const validation = validate(productSearchSchema, searchParams);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid search parameters',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { q: query, limit = 10 } = validation.data;

    // Check if Supabase is configured with vector search
    if (!supabase) {
      // Use simple text search on local data
      const searchLower = query.toLowerCase();
      const terms = searchLower.split(/\s+/).filter(t => t.length > 1);

      const scoredProducts = PRODUCTS.map(product => {
        let score = 0;
        const nameLower = product.name.toLowerCase();
        const descLower = (product.description || '').toLowerCase();
        const categoryLower = product.category.toLowerCase();

        // Exact match in name (highest score)
        if (nameLower === searchLower) {
          score += 100;
        }
        // Name starts with query
        else if (nameLower.startsWith(searchLower)) {
          score += 50;
        }
        // Name contains query
        else if (nameLower.includes(searchLower)) {
          score += 30;
        }

        // Term matching
        for (const term of terms) {
          if (nameLower.includes(term)) {
            score += 10;
          }
          if (descLower.includes(term)) {
            score += 5;
          }
          if (categoryLower.includes(term)) {
            score += 3;
          }
        }

        // Category-specific keywords
        const categoryKeywords: Record<string, string[]> = {
          food: ['spice', 'coffee', 'bean', 'powder', 'flour', 'honey', 'butter', 'teff', 'berbere', 'mitmita', 'shiro', 'injera'],
          kitchenware: ['pot', 'pan', 'cup', 'basket', 'tray', 'jebena', 'mitad', 'mesob', 'grinder', 'mortar', 'kettle'],
          artifacts: ['cross', 'necklace', 'jewelry', 'basket', 'drum', 'art', 'decor', 'leather', 'silver', 'brass'],
        };

        for (const term of terms) {
          for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(k => k.includes(term) || term.includes(k))) {
              if (product.category === category) {
                score += 15;
              }
            }
          }
        }

        return { product, score };
      });

      // Filter products with score > 0 and sort by score
      const results = scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          ...item.product,
          relevanceScore: item.score,
        }));

      return createApiResponse(results);
    }

    // Check if pgvector is available for semantic search
    // First, try simple text search as a fallback
    const { data: textResults, error: textError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (textError) {
      console.error('Product search error:', textError);
      throw ApiErrors.databaseError('Failed to search products');
    }

    // If we have embeddings set up, try vector search
    try {
      // Check if the embedding column exists and is populated
      const { data: vectorResults, error: vectorError } = await supabase
        .rpc('search_products_by_text', {
          search_query: query,
          match_count: limit,
        });

      if (!vectorError && vectorResults && vectorResults.length > 0) {
        return createApiResponse(vectorResults);
      }
    } catch {
      // Vector search not available, use text results
      console.log('Vector search not available, using text search');
    }

    return createApiResponse(textResults || []);
  } catch (error) {
    return handleApiError(error);
  }
}
