/**
 * Custom API Error class for consistent error handling across API routes
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Common error factory functions
export const ApiErrors = {
  // Authentication & Authorization
  unauthorized: (message = 'Authentication required') =>
    new ApiError('UNAUTHORIZED', message, 401),

  forbidden: (message = 'Access denied') =>
    new ApiError('FORBIDDEN', message, 403),

  invalidCredentials: (message = 'Invalid email or password') =>
    new ApiError('INVALID_CREDENTIALS', message, 401),

  tokenExpired: (message = 'Session expired. Please log in again') =>
    new ApiError('TOKEN_EXPIRED', message, 401),

  // Resource errors
  notFound: (resource = 'Resource') =>
    new ApiError('NOT_FOUND', `${resource} not found`, 404),

  alreadyExists: (resource = 'Resource') =>
    new ApiError('ALREADY_EXISTS', `${resource} already exists`, 409),

  // Validation errors
  validationError: (message: string, details?: Record<string, unknown>) =>
    new ApiError('VALIDATION_ERROR', message, 400, details),

  invalidInput: (message: string) =>
    new ApiError('INVALID_INPUT', message, 400),

  // Rate limiting
  rateLimitExceeded: (message = 'Too many requests. Please try again later') =>
    new ApiError('RATE_LIMIT_EXCEEDED', message, 429),

  // Server errors
  internalError: (message = 'An unexpected error occurred') =>
    new ApiError('INTERNAL_ERROR', message, 500),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new ApiError('SERVICE_UNAVAILABLE', message, 503),

  databaseError: (message = 'Database operation failed') =>
    new ApiError('DATABASE_ERROR', message, 500),
};

// Type guard to check if an error is an ApiError
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
