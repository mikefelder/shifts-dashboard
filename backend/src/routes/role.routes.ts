/**
 * Role Routes
 *
 * Express router configuration for role endpoints.
 */

import { Router } from 'express';
import type { RoleController } from '../controllers/role.controller';
import logger from '../config/logger';

// ============================================================================
// Route Factory
// ============================================================================

/**
 * Create role router with controller handlers.
 *
 * Endpoints:
 * - GET /api/roles/list      - All roles sorted alphabetically
 * - GET /api/roles/:roleId   - Single role by ID
 *
 * @param roleController - Controller instance with handlers
 * @returns Express Router
 */
export function createRoleRoutes(roleController: RoleController): Router {
  const router = Router();

  // GET /api/roles/list
  // Returns all roles sorted alphabetically for selection dropdowns
  router.get('/list', ...roleController.listRoles);

  // GET /api/roles/:roleId
  // Returns a single role by ID
  router.get('/:roleId', ...roleController.getRole);

  logger.debug('[role.routes] Registered routes: /list, /:roleId');

  return router;
}
