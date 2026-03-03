/**
 * Workgroup Routes
 *
 * Express router configuration for workgroup endpoints.
 */

import { Router } from 'express';
import type { WorkgroupController } from '../controllers/workgroup.controller';

// ============================================================================
// Route Factory
// ============================================================================

/**
 * Create workgroup router with controller handlers.
 *
 * Endpoints:
 * - GET /api/workgroups/list                - All workgroups sorted alphabetically
 * - GET /api/workgroups/:workgroupId/roles  - Roles for a specific workgroup
 *
 * @param workgroupController - Controller instance with handlers
 * @returns Express Router
 */
export function createWorkgroupRoutes(workgroupController: WorkgroupController): Router {
  const router = Router();

  // GET /api/workgroups/list
  // Returns all workgroups for the WorkgroupFilter UI dropdown
  router.get('/list', ...workgroupController.listWorkgroups);

  // GET /api/workgroups/:workgroupId/roles
  // Returns roles for a specific workgroup
  router.get('/:workgroupId/roles', ...workgroupController.getRoles);

  console.log('[workgroup.routes] Registered routes: /list, /:workgroupId/roles');

  return router;
}
