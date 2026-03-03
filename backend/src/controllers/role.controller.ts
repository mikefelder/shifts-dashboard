/**
 * Role Controller
 *
 * Request handlers for role endpoints.
 * Provides role lookup by ID and role list.
 */

import type { Request, Response, RequestHandler } from 'express';
import { RoleService } from '../services/role.service';
import { asyncHandler } from '../middleware/error.middleware';
import { validateParams } from '../middleware/validation.middleware';
import { CommonSchemas } from '../middleware/validation.middleware';

// ============================================================================
// Types
// ============================================================================

export interface RoleController {
  getRole: Array<RequestHandler>;
  listRoles: Array<RequestHandler>;
}

// ============================================================================
// Controller Factory
// ============================================================================

/**
 * Create role controller with dependency injection.
 *
 * @param roleService - Role service instance
 * @returns Object with route handler functions
 */
export function createRoleController(roleService: RoleService): RoleController {
  return {
    /**
     * GET /api/roles/:roleId
     *
     * Returns a single role by ID.
     * Used for detailed role information lookup.
     *
     * Response:
     * - 200: Role object
     * - 400: Invalid roleId parameter
     * - 404: Role not found
     * - 500: Shiftboard API error
     */
    getRole: [
      validateParams(CommonSchemas.roleId),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();
        const roleId = req.params.roleId as string;

        console.log(`[role.controller] GET /api/roles/${roleId}`);

        const result = await roleService.getRole(roleId);

        const requestEnd = Date.now();

        res.status(200).json({
          result: {
            role: result.role,
          },
          meta: {
            requestDuration: requestEnd - requestStart,
          },
        });

        console.log(`[role.controller] Role ${roleId} returned in ${requestEnd - requestStart}ms`);
      }),
    ],

    /**
     * GET /api/roles/list
     *
     * Returns all roles sorted alphabetically.
     * Used for role selection dropdowns in the UI.
     *
     * Response:
     * - 200: Array of roles with total count
     * - 500: Shiftboard API error
     */
    listRoles: [
      asyncHandler(async (_req: Request, res: Response) => {
        const requestStart = Date.now();

        console.log('[role.controller] GET /api/roles/list');

        const result = await roleService.listRoles();

        const requestEnd = Date.now();

        res.status(200).json({
          result: {
            roles: result.roles,
            total: result.total,
          },
          meta: {
            requestDuration: requestEnd - requestStart,
          },
        });

        console.log(
          `[role.controller] ${result.total} roles returned in ${requestEnd - requestStart}ms`
        );
      }),
    ],
  };
}
