import { NextRequest } from 'next/server';
import { getRecommendations } from '@/lib/ai';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
} from '@/lib/api-utils';
import { getRecommendationsSchema, validate, formatZodErrors } from '@/lib/validations';

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
    const recommendations = await getRecommendations(productIds, cartItems, limit);

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
    const recommendations = await getRecommendations(productIds, cartItems, Math.min(limit, 20));

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
