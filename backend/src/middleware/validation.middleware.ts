/**
 * Validation Middleware
 *
 * Zod-based request validation for:
 * - Query parameters
 * - Request body
 * - Route parameters
 *
 * Usage:
 *   import { validateQuery, validateBody } from './middleware/validation.middleware';
 *   import { z } from 'zod';
 *
 *   const schema = z.object({ workgroup: z.string().optional() });
 *   router.get('/shifts', validateQuery(schema), controller.listShifts);
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { createError } from './error.middleware';

/**
 * Validate request query parameters against Zod schema
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const querySchema = z.object({
 *   workgroup: z.string().optional(),
 *   batch: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
 * });
 * router.get('/shifts', validateQuery(querySchema), controller);
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = formatZodError(error);
        next(createError(400, `Query validation failed: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request body against Zod schema
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const bodySchema = z.object({
 *   message: z.string().min(1),
 * });
 * router.post('/echo', validateBody(bodySchema), controller);
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = formatZodError(error);
        next(createError(400, `Body validation failed: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate route parameters against Zod schema
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const paramsSchema = z.object({
 *   id: z.string().uuid(),
 * });
 * router.get('/shifts/:id', validateParams(paramsSchema), controller);
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = formatZodError(error);
        next(createError(400, `Params validation failed: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Format Zod validation errors into human-readable message
 */
function formatZodError(error: ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    })
    .join(', ');
}

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Common schemas for reuse across endpoints
 */
export const CommonSchemas = {
  /**
   * Pagination query parameters
   */
  pagination: z.object({
    start: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .pipe(z.number().int().min(0)),
    batch: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 100))
      .pipe(z.number().int().min(1).max(100)),
  }),

  /**
   * Workgroup filter (optional)
   */
  workgroupFilter: z.object({
    workgroup: z.string().optional(),
  }),

  /**
   * Workgroup ID parameter (required)
   */
  workgroupId: z.object({
    workgroupId: z.string().min(1),
  }),

  /**
   * Role ID parameter (required)
   */
  roleId: z.object({
    roleId: z.string().min(1),
  }),

  /**
   * Account ID parameter (required)
   */
  accountId: z.object({
    accountId: z.string().min(1),
  }),

  /**
   * Combined pagination + workgroup filter
   */
  paginatedWithWorkgroup: z.object({
    start: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .pipe(z.number().int().min(0)),
    batch: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 100))
      .pipe(z.number().int().min(1).max(100)),
    workgroup: z.string().optional(),
  }),

  /**
   * Echo request body
   */
  echo: z.object({
    message: z.string().min(1).max(1000),
  }),
};

/**
 * Type-safe schema inference helper
 * Extracts TypeScript type from Zod schema
 */
export type InferSchema<T extends ZodSchema> = z.infer<T>;

/**
 * Utility: Create a strict object schema (no unknown keys allowed)
 */
export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

/**
 * Utility: Make all fields of a schema optional
 */
export function partial<T extends ZodSchema>(schema: T) {
  if (schema instanceof z.ZodObject) {
    return schema.partial();
  }
  throw new Error('partial() can only be used with ZodObject schemas');
}
