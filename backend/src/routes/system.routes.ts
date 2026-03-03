/**
 * System Routes
 *
 * Express router for system utility endpoints.
 * Mounted at /api/system in the main application.
 *
 * Routes:
 * - GET  /health → system health status
 * - POST /echo   → echo connectivity test
 */

import { Router } from 'express';
import type { SystemController } from '../controllers/system.controller';

/**
 * Create system router with injected controller.
 *
 * @param controller - System controller instance
 * @returns Configured Express router
 */
export function createSystemRoutes(controller: SystemController): Router {
  const router = Router();

  // GET /api/system/health
  router.get('/health', controller.health);

  // POST /api/system/echo
  router.post('/echo', controller.echo);

  return router;
}
