import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiError, ApiErrors, isApiError } from '@/lib/api-error';

/**
 * Standard API response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create a successful API response
 */
export function createApiResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function createApiError(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status: statusCode }
  );
}

/**
 * Create an error response from an ApiError instance
 */
export function createApiErrorFromError(error: ApiError): NextResponse<ApiResponse> {
  return createApiError(error.code, error.message, error.statusCode, error.details);
}

/**
 * Handle errors consistently across API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (isApiError(error)) {
    return createApiErrorFromError(error);
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message;
    return createApiError('INTERNAL_ERROR', message, 500);
  }

  return createApiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

/**
 * Extended session type with user role
 */
export interface ExtendedSession extends Session {
  user: Session['user'] & {
    id: string;
    role?: 'customer' | 'admin';
  };
}

/**
 * API Handler type with optional session parameter
 */
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context?: { params?: Record<string, string>; session?: ExtendedSession }
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Wrap an API handler with authentication check
 */
export function withAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      const session = await getServerSession(authOptions) as ExtendedSession | null;

      if (!session?.user) {
        throw ApiErrors.unauthorized();
      }

      return handler(request, { ...context, session });
    } catch (error) {
      return handleApiError(error) as NextResponse<ApiResponse<T>>;
    }
  };
}

/**
 * Wrap an API handler with admin role check
 */
export function withAdmin<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      const session = await getServerSession(authOptions) as ExtendedSession | null;

      if (!session?.user) {
        throw ApiErrors.unauthorized();
      }

      if (session.user.role !== 'admin') {
        throw ApiErrors.forbidden('Admin access required');
      }

      return handler(request, { ...context, session });
    } catch (error) {
      return handleApiError(error) as NextResponse<ApiResponse<T>>;
    }
  };
}

/**
 * Parse and validate pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): { page: number; limit: number; offset: number } {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiResponse['meta'] {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw ApiErrors.invalidInput('Invalid JSON in request body');
  }
}

/**
 * Get a required parameter from the URL
 */
export function getRequiredParam(
  params: Record<string, string> | undefined,
  key: string
): string {
  const value = params?.[key];
  if (!value) {
    throw ApiErrors.invalidInput(`Missing required parameter: ${key}`);
  }
  return value;
}
