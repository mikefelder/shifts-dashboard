/**
 * Calendar Controller
 *
 * Request handlers for calendar endpoints.
 * Provides aggregated statistics and calendar views.
 */

import type { Request, Response, RequestHandler } from 'express';
import { CalendarService } from '../services/calendar.service';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../config/logger';
import { getRequestDuration } from '../utils/timing';

// ============================================================================
// Types
// ============================================================================

export interface CalendarController {
  getSummary: Array<RequestHandler>;
}

// ============================================================================
// Controller Factory
// ============================================================================

/**
 * Create calendar controller with dependency injection.
 *
 * @param calendarService - Calendar service instance
 * @returns Object with route handler functions
 */
export function createCalendarController(calendarService: CalendarService): CalendarController {
  return {
    /**
     * GET /api/calendar/summary
     *
     * Returns aggregated calendar statistics.
     * Stub implementation in current version.
     *
     * Response:
     * - 200: Summary object
     * - 500: Server error
     *
     * @todo Future enhancement: Return real metrics
     */
    getSummary: [
      asyncHandler(async (_req: Request, res: Response) => {
        const requestStart = Date.now();

        logger.debug('[calendar.controller] GET /api/calendar/summary');

        const result = await calendarService.getSummary();

        const meta = getRequestDuration(requestStart);
        res.status(200).json({
          result,
          meta,
        });

        logger.info(`[calendar.controller] Summary returned in ${meta.requestDuration}ms`);
      }),
    ],
  };
}
