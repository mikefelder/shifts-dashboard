/**
 * Input Sanitization Middleware
 *
 * Sanitizes request data to prevent XSS and injection attacks.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize a string value by removing potentially dangerous characters
 * and HTML tags.
 *
 * @param value - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove HTML tags repeatedly until no more can be removed
  let sanitized = value;
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } while (sanitized !== prev);

  // Remove potentially dangerous characters but preserve common punctuation
  // Keep: letters, numbers, spaces, common punctuation (.,!?:;-_@()[]/)
  sanitized = sanitized.replace(/[<>{}\\]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Recursively sanitize an object's string values
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 *
 * Applies basic XSS protection by removing HTML tags and dangerous characters
 * from all string values in the request.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as typeof req.params;
  }

  next();
}
