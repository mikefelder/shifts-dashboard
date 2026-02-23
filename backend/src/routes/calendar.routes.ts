/**
 * Calendar Routes
 *
 * Express router configuration for calendar endpoints.
 */

import { Router } from 'express';
import type { CalendarController } from '../controllers/calendar.controller';

// ============================================================================
// Route Factory
// ============================================================================

/**
 * Create calendar router with controller handlers.
 *
 * Endpoints:
 * - GET /api/calendar/summary - Aggregated calendar statistics (stub)
 *
 * @param calendarController - Controller instance with handlers
 * @returns Express Router
 */
export function createCalendarRoutes(calendarController: CalendarController): Router {
  const router = Router();

  // GET /api/calendar/summary
  // Returns aggregated statistics about shifts and coverage
  router.get('/summary', ...calendarController.getSummary);

  console.log('[calendar.routes] Registered routes: /summary');

  return router;
}
