/**
 * Workgroup Controller
 *
 * Request handlers for workgroup endpoints.
 * Provides workgroup list and per-workgroup role lookup.
 */

import type { Request, Response, RequestHandler } from 'express';
import { WorkgroupService } from '../services/workgroup.service';
import { asyncHandler } from '../middleware/error.middleware';
import { validateParams } from '../middleware/validation.middleware';
import { CommonSchemas } from '../middleware/validation.middleware';
import logger from '../config/logger';
import { getTimingMetadata } from '../utils/timing';

// ============================================================================
// Controller Factory
// ============================================================================

/**
 * Create workgroup controller with dependency injection.
 *
 * @param workgroupService - Workgroup service instance
 * @returns Object with route handler functions
 */
export function createWorkgroupController(workgroupService: WorkgroupService) {
  return {
    /**
     * GET /api/workgroups/list
     *
     * Returns all workgroups sorted alphabetically.
     * Used by WorkgroupFilter dropdown in the UI.
     *
     * Response:
     * - 200: Array of workgroups with total count
     * - 500: Shiftboard API error
     */
    listWorkgroups: [
      asyncHandler(async (_req: Request, res: Response) => {
        const requestStart = Date.now();

        logger.debug('[workgroup.controller] GET /api/workgroups/list');

        const result = await workgroupService.listWorkgroups();

        res.status(200).json({
          result: {
            workgroups: result.workgroups,
            total: result.total,
          },
          timing: getTimingMetadata(requestStart),
        });

        const duration = Date.now() - requestStart;
        logger.info(`[workgroup.controller] Returned ${result.total} workgroups in ${duration}ms`);
      }),
    ],

    /**
     * GET /api/workgroups/:workgroupId/roles
     *
     * Returns all roles assigned to a specific workgroup.
     *
     * Route params:
     * - workgroupId (required): Workgroup ID
     *
     * Response:
     * - 200: Array of roles with total count and workgroupId
     * - 400: Missing/invalid workgroupId
     * - 500: Shiftboard API error
     */
    getRoles: [
      validateParams(CommonSchemas.workgroupId),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();

        const { workgroupId } = req.params;

        // validateParams guarantees this is a non-empty string
        const wgId = String(workgroupId);

        logger.debug(`[workgroup.controller] GET /api/workgroups/${wgId}/roles`);

        const result = await workgroupService.getRoles(wgId);

        res.status(200).json({
          result: {
            workgroupId: result.workgroupId,
            roles: result.roles,
            total: result.total,
          },
          timing: getTimingMetadata(requestStart),
        });

        const duration = Date.now() - requestStart;
        logger.info(
          `[workgroup.controller] Returned ${result.total} roles for workgroup ${wgId} in ${duration}ms`
        );
      }),
    ],
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export interface WorkgroupController {
  listWorkgroups: Array<RequestHandler>;
  getRoles: Array<RequestHandler>;
}
