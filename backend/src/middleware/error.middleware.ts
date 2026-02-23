/**
 * Error Middleware
 *
 * Standardizes error responses across all API endpoints.
 * All errors are converted to the format: { error: string }
 *
 * HTTP Status Codes:
 * - 400: Bad Request (validation errors, invalid parameters)
 * - 401: Unauthorized (authentication failed)
 * - 403: Forbidden (permission denied)
 * - 404: Not Found (resource doesn't exist)
 * - 500: Internal Server Error (unexpected failures, Shiftboard errors)
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface ApiError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Error handler middleware
 * Must be registered AFTER all routes
 *
 * Usage:
 *   app.use(errorHandler);
 */
export function errorHandler(
  error: ApiError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log error for debugging
  logger.error('[Error]', {
    method: req.method,
    path: req.path,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Determine status code
  const statusCode =
    (error as ApiError).statusCode ||
    (error as ApiError).status ||
    (error.message.toLowerCase().includes('not found') ? 404 : 500);

  // Send standardized error response
  res.status(statusCode).json({
    error: error.message || 'An unexpected error occurred',
  });
}

/**
 * 404 Not Found handler
 * Should be registered BEFORE error handler middleware
 *
 * Usage:
 *   app.use(notFoundHandler);
 *   app.use(errorHandler);
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

/**
 * Async route handler wrapper
 * Catches errors from async route handlers and passes them to error middleware
 *
 * Usage:
 *   app.get('/route', asyncHandler(async (req, res) => {
 *     const data = await fetchData();
 *     res.json(data);
 *   }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom API error
 *
 * Usage:
 *   throw createError(400, 'Invalid workgroup ID');
 *   throw createError(401, 'Authentication failed');
 *   throw createError(404, 'Shift not found');
 */
export function createError(statusCode: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}

/**
 * Common error creators for convenience
 */
export const Errors = {
  badRequest: (message: string = 'Bad request'): ApiError => createError(400, message),

  unauthorized: (message: string = 'Unauthorized'): ApiError => createError(401, message),

  forbidden: (message: string = 'Forbidden'): ApiError => createError(403, message),

  notFound: (message: string = 'Not found'): ApiError => createError(404, message),

  internalError: (message: string = 'Internal server error'): ApiError => createError(500, message),

  /**
   * Create error from Shiftboard service error
   */
  fromShiftboard: (error: Error): ApiError =>
    createError(500, `Shiftboard API error: ${error.message || 'Unknown error'}`),

  /**
   * Create validation error
   */
  validation: (message: string): ApiError => createError(400, `Validation error: ${message}`),
};

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    (typeof (error as ApiError).statusCode === 'number' ||
      typeof (error as ApiError).status === 'number')
  );
}
