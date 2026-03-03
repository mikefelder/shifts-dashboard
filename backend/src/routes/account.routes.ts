/**
 * Account Routes
 *
 * Express router configuration for account (person) endpoints.
 */

import { Router } from 'express';
import type { AccountController } from '../controllers/account.controller';

// ============================================================================
// Route Factory
// ============================================================================

/**
 * Create account router with controller handlers.
 *
 * Endpoints:
 * - GET /api/accounts/list                        – All accounts (optional ?workgroup=id filter)
 * - GET /api/accounts/self                        – Service account identity
 * - GET /api/accounts/workgroup/:workgroupId      – Accounts for a workgroup
 * - GET /api/accounts/:accountId                  – Single account by ID
 *
 * Note: /list and /self MUST be registered before /:accountId to prevent
 *       the dynamic param from swallowing static segments.
 *
 * @param accountController - Controller instance with handlers
 * @returns Express Router
 */
export function createAccountRoutes(accountController: AccountController): Router {
  const router = Router();

  // GET /api/accounts/list
  // Returns all accounts (optionally filtered by workgroup query param)
  router.get('/list', ...accountController.list);

  // GET /api/accounts/self
  // Returns service account identity (used for system diagnostics)
  router.get('/self', ...accountController.self);

  // GET /api/accounts/workgroup/:workgroupId
  // Returns accounts belonging to a workgroup
  router.get('/workgroup/:workgroupId', ...accountController.byWorkgroup);

  // GET /api/accounts/:accountId
  // Returns a single account by ID (must come last to avoid swallowing /list, /self)
  router.get('/:accountId', ...accountController.byId);

  console.log(
    '[account.routes] Registered routes: /list, /self, /workgroup/:workgroupId, /:accountId'
  );

  return router;
}
