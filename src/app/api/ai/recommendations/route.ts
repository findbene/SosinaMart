import { NextRequest } from 'next/server';
import { PRODUCTS } from '@/lib/data';
import { Product } from '@/types';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
} from '@/lib/api-utils';
import { getRecommendationsSchema, validate, formatZodErrors } from '@/lib/validations';

// Get recommendations helper function
function getRecommendations(
  productIds?: string[],
  cartItems?: string[],
  limit: number = 6
): Product[] {
  // Get context products
  const contextProducts = [
    ...(productIds || []).map(id => PRODUCTS.find(p => p.id === id)),
    ...(cartItems || []).map(id => PRODUCTS.find(p => p.id === id)),
  ].filter(Boolean) as Product[];

  if (contextProducts.length === 0) {
    // Return featured products if no context
    return PRODUCTS.filter(p => p.featured).slice(0, limit);
  }

  // Get categories from context products
  const categories = Array.from(new Set(contextProducts.map(p => p.category)));

  // Build recommendations based on:
  // 1. Same category products (not already in context)
  // 2. Complementary products from other categories
  // 3. Featured products

  const contextIds = new Set(contextProducts.map(p => p.id));
  const recommendations: Product[] = [];

  // Add same-category products
  for (const category of categories) {
    const sameCategory = PRODUCTS.filter(
      p => p.category === category && !contextIds.has(p.id)
    );
    recommendations.push(...sameCategory.slice(0, 2));
  }

  // Add complementary products
  const complementaryMap: Record<string, string[]> = {
    food: ['kitchenware'], // Food items go well with kitchenware
    kitchenware: ['food', 'artifacts'], // Kitchenware complements everything
    artifacts: ['kitchenware'], // Artifacts go well with kitchenware
  };

  for (const category of categories) {
    const complementary = complementaryMap[category] || [];
    for (const compCategory of complementary) {
      const compProducts = PRODUCTS.filter(
        p => p.category === compCategory && !contextIds.has(p.id) && !recommendations.includes(p)
      );
      recommendations.push(...compProducts.slice(0, 2));
    }
  }

  // Fill remaining slots with featured products
  if (recommendations.length < limit) {
    const featured = PRODUCTS.filter(
      p => p.featured && !contextIds.has(p.id) && !recommendations.includes(p)
    );
    recommendations.push(...featured);
  }

  return recommendations.slice(0, limit);
}

// POST /api/ai/recommendations - Get personalized product recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(getRecommendationsSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid recommendations request',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { productIds, cartItems, limit } = validation.data;

    // Get recommendations
    const recommendations = getRecommendations(productIds, cartItems, limit);

    return createApiResponse({
      recommendations,
      basedOn: {
        productIds: productIds || [],
        cartItems: cartItems || [],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/ai/recommendations - Get recommendations with query params
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productIds = searchParams.get('productIds')?.split(',').filter(Boolean);
    const cartItems = searchParams.get('cartItems')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    // Get recommendations
    const recommendations = getRecommendations(productIds, cartItems, Math.min(limit, 20));

    return createApiResponse({
      recommendations,
      basedOn: {
        productIds: productIds || [],
        cartItems: cartItems || [],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
