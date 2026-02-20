/**
 * Shift Controller
 *
 * Request handlers for shift endpoints.
 * Orchestrates validation, service calls, and response formatting.
 */

import type { Request, Response } from 'express';
import { ShiftService } from '../services/shift.service';
import { asyncHandler } from '../middleware/error.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { CommonSchemas } from '../middleware/validation.middleware';

// ============================================================================
// Controller Factory
// ============================================================================

/**
 * Create shift controller with dependency injection.
 *
 * @param shiftService - Shift service instance
 * @returns Object with route handler functions
 */
export function createShiftController(shiftService: ShiftService) {
  return {
    /**
     * GET /api/shifts/whos-on
     *
     * Returns grouped shifts with clock-in status for current time window.
     * Primary endpoint for active shifts timeline.
     *
     * Query params:
     * - workgroup (optional): Filter by workgroup ID
     * - batch (optional): Page size (default: 100, max: 100)
     *
     * Response:
     * - 200: Grouped shifts with metrics
     * - 400: Invalid parameters
     * - 500: Shiftboard API error
     */
    whosOn: [
      validateQuery(CommonSchemas.paginatedWithWorkgroup),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();

        const { workgroup, batch } = req.query;

        console.log(
          `[shift.controller] GET /api/shifts/whos-on (workgroup=${workgroup || 'all'}, batch=${batch || 100})`
        );

        // Call service
        const result = await shiftService.shiftWhosOn(
          workgroup as string | undefined,
          batch ? parseInt(batch as string, 10) : 100
        );

        // Format response with timing metadata
        const requestEnd = Date.now();

        res.status(200).json({
          result: {
            shifts: result.shifts,
            referenced_objects: result.referenced_objects,
            metrics: result.metrics,
            page: result.page,
          },
          timing: {
            start: new Date(requestStart).toISOString(),
            end: new Date(requestEnd).toISOString(),
            duration_ms: requestEnd - requestStart,
          },
        });

        console.log(
          `[shift.controller] Returned ${result.shifts.length} grouped shifts (${result.metrics.original_shift_count} original) in ${requestEnd - requestStart}ms`
        );
      }),
    ],

    /**
     * GET /api/shifts/list
     *
     * Returns raw shifts without grouping (pass-through to Shiftboard).
     * Used for debugging or viewing individual shift assignments.
     *
     * Query params:
     * - start (optional): Pagination start index (default: 0)
     * - batch (optional): Page size (default: 100, max: 100)
     * - workgroup (optional): Filter by workgroup ID
     *
     * Response:
     * - 200: Raw shifts from Shiftboard
     * - 400: Invalid parameters
     * - 500: Shiftboard API error
     */
    listShifts: [
      validateQuery(CommonSchemas.paginatedWithWorkgroup),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();

        const { start, batch, workgroup } = req.query;

        console.log(
          `[shift.controller] GET /api/shifts/list (start=${start || 0}, batch=${batch || 100}, workgroup=${workgroup || 'all'})`
        );

        // Call service
        const result = await shiftService.shiftList({
          start: start ? parseInt(start as string, 10) : undefined,
          batch: batch ? parseInt(batch as string, 10) : undefined,
          workgroup: workgroup as string | undefined,
        });

        // Format response with timing
        const requestEnd = Date.now();

        res.status(200).json({
          result: {
            shifts: result.shifts,
            page: result.page,
          },
          timing: {
            start: new Date(requestStart).toISOString(),
            end: new Date(requestEnd).toISOString(),
            duration_ms: requestEnd - requestStart,
          },
        });

        console.log(
          `[shift.controller] Returned ${result.shifts.length} raw shifts in ${requestEnd - requestStart}ms`
        );
      }),
    ],
  };
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Shift controller interface
 * Used for type-safe route registration
 */
export interface ShiftController {
  whosOn: Array<any>; // Array includes middleware + handler
  listShifts: Array<any>;
}
