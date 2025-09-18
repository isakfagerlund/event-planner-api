/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * API Error class for consistent error handling
 */
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  issue: string;
  received?: unknown;
}

/**
 * Standard HTTP status codes used in the API
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}