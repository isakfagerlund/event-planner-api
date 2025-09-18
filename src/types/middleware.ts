import { Context, Next } from 'hono';
import { ZodSchema } from 'zod';

/**
 * Middleware function type
 */
export type MiddlewareHandler = (c: Context, next: Next) => Promise<void | Response>;

/**
 * Error handler middleware type
 */
export type ErrorHandler = (error: Error, c: Context) => Promise<Response>;

/**
 * Validation middleware options
 */
export interface ValidationOptions {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

/**
 * Validation middleware factory type
 */
export type ValidationMiddleware = (options: ValidationOptions) => MiddlewareHandler;

/**
 * CORS configuration options
 */
export interface CorsOptions {
    origin?: string | string[] | ((origin: string) => boolean);
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

/**
 * Rate limiting options
 */
export interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}

/**
 * Logging middleware options
 */
export interface LoggingOptions {
    format?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
    skip?: (c: Context) => boolean;
}