/**
 * Response helper utilities for FOA applications
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create a success response
 */
export function success<T = any>(data: T, message?: string, meta?: Record<string, any>): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Create an error response
 */
export function error(message: string, details?: any, code?: string): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: message
  };

  if (details) {
    response.details = details;
  }

  if (code) {
    response.code = code;
  }

  return response;
}

/**
 * Create a paginated response
 */
export function paginated<T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

/**
 * Create a 404 Not Found error
 */
export function notFound(resource = 'Resource'): ErrorResponse {
  return error(`${resource} not found`, undefined, 'NOT_FOUND');
}

/**
 * Create a 400 Bad Request error
 */
export function badRequest(message = 'Bad request', details?: any): ErrorResponse {
  return error(message, details, 'BAD_REQUEST');
}

/**
 * Create a 401 Unauthorized error
 */
export function unauthorized(message = 'Unauthorized'): ErrorResponse {
  return error(message, undefined, 'UNAUTHORIZED');
}

/**
 * Create a 403 Forbidden error
 */
export function forbidden(message = 'Forbidden'): ErrorResponse {
  return error(message, undefined, 'FORBIDDEN');
}

/**
 * Create a 409 Conflict error
 */
export function conflict(message = 'Resource already exists'): ErrorResponse {
  return error(message, undefined, 'CONFLICT');
}

/**
 * Create a 422 Unprocessable Entity error (validation)
 */
export function validationError(errors: any[]): ErrorResponse {
  return error('Validation failed', errors, 'VALIDATION_ERROR');
}

/**
 * Create a 500 Internal Server Error
 */
export function internalError(message = 'Internal server error'): ErrorResponse {
  return error(message, undefined, 'INTERNAL_ERROR');
}

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Create a response with custom status
 */
export function createResponse<T = any>(
  statusCode: number,
  body: T
): { status: number; body: T } {
  return { status: statusCode, body };
}
