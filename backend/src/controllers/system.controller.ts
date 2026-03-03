/**
 * System Controller
 *
 * Request handlers for system utility endpoints.
 * Provides health check and echo test for connectivity verification.
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';

// ============================================================================
// Types
// ============================================================================

export interface SystemController {
  health: ReturnType<typeof asyncHandler>;
  echo: ReturnType<typeof asyncHandler>;
}

// ============================================================================
// Controller Factory
// ============================================================================

/**
 * Create system controller.
 * No service dependency required — system endpoints are self-contained.
 *
 * @returns Object with route handler functions
 */
export function createSystemController(): SystemController {
  return {
    /**
     * GET /api/system/health
     *
     * Returns server health status with uptime and environment details.
     *
     * Response:
     * - 200: { status, timestamp, uptime, environment }
     */
    health: asyncHandler(async (_req: Request, res: Response) => {
      const requestStart = Date.now();

      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      };

      const requestEnd = Date.now();

      res.status(200).json({
        result: healthData,
        timing: {
          start: new Date(requestStart).toISOString(),
          end: new Date(requestEnd).toISOString(),
          duration_ms: requestEnd - requestStart,
        },
      });
    }),

    /**
     * POST /api/system/echo
     *
     * Echoes the message field from the request body.
     * Used for connectivity testing and API verification.
     *
     * Body:
     * - message (string, optional): Message to echo back
     *
     * Response:
     * - 200: { echo: message }
     */
    echo: asyncHandler(async (req: Request, res: Response) => {
      const requestStart = Date.now();

      const { message = 'ping' } = req.body as { message?: string };

      const requestEnd = Date.now();

      res.status(200).json({
        result: {
          echo: String(message),
        },
        timing: {
          start: new Date(requestStart).toISOString(),
          end: new Date(requestEnd).toISOString(),
          duration_ms: requestEnd - requestStart,
        },
      });
    }),
  };
}
