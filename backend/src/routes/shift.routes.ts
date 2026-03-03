/**
 * Shift Routes
 *
 * Express router configuration for shift endpoints.
 */

import { Router } from 'express';
import type { ShiftController } from '../controllers/shift.controller';
import logger from '../config/logger';

// ============================================================================
// Route Factory
// ============================================================================

/**
 * Create shift router with controller handlers.
 *
 * Endpoints:
 * - GET /api/shifts/whos-on - Grouped shifts with clock-in status
 * - GET /api/shifts/list - Raw shifts without grouping
 *
 * @param shiftController - Controller instance with handlers
 * @returns Express Router
 */
export function createShiftRoutes(shiftController: ShiftController): Router {
  const router = Router();

  // GET /api/shifts/whos-on
  // Returns grouped shifts for active shifts timeline
  // Query: ?workgroup=abc123&batch=100
  router.get('/whos-on', ...shiftController.whosOn);

  // GET /api/shifts/list
  // Returns raw shifts (pass-through to Shiftboard)
  // Query: ?start=0&batch=100&workgroup=abc123
  router.get('/list', ...shiftController.listShifts);

  logger.debug('[shift.routes] Registered shift routes: /whos-on, /list');

  return router;
}
