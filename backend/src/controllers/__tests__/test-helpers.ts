/**
 * Controller Test Helpers
 *
 * Shared utilities for testing Express request handlers
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Create a mock Express Request object
 *
 * @param overrides - Optional properties to override
 * @returns Mock request object
 */
export function makeReq(
  overrides: Partial<{
    params: Record<string, string>;
    query: Record<string, string>;
    body: Record<string, unknown>;
  }> = {}
): Request {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as Partial<Request> as Request;
}

/**
 * Create a mock Express Response object
 *
 * @returns Mock response object with jest mock methods
 */
export function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

/**
 * Run the last handler in a handler array
 * Used to execute the business logic handler after middleware validators
 *
 * @param handlers - Array of route handlers (middleware + business logic)
 * @param req - Mock request object
 * @param res - Mock response object
 * @param next - Optional next function
 */
export async function runLastHandler(
  handlers: Array<unknown>,
  req: Request,
  res: Response,
  next: NextFunction = jest.fn()
): Promise<void> {
  const handler = handlers.at(-1) as (req: Request, res: Response, next: NextFunction) => void;
  handler(req, res, next);
  // asyncHandler wraps everything in Promise.resolve().catch(next)
  // so we need to flush the microtask queue
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * Run a single handler (not in an array)
 * Used for controllers that return single handlers instead of arrays
 *
 * @param handler - Single route handler function
 * @param req - Mock request object
 * @param res - Mock response object
 * @param next - Optional next function
 */
export function runHandler(
  handler: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
  res: Response,
  next: NextFunction = jest.fn()
): void {
  handler(req, res, next);
}
