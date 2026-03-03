/**
 * Account Controller
 *
 * Request handlers for account (person) endpoints.
 * Supports listing, workgroup filtering, and individual account lookup.
 */

import type { Request, Response, RequestHandler } from 'express';
import { AccountService } from '../services/account.service';
import { asyncHandler } from '../middleware/error.middleware';
import { validateParams, validateQuery, CommonSchemas } from '../middleware/validation.middleware';
import logger from '../config/logger';
import { getTimingMetadata } from '../utils/timing';

// ============================================================================
// Controller Factory
// ============================================================================

/**
 * Create account controller with dependency injection.
 *
 * @param accountService - Account service instance
 * @returns Object with route handler arrays
 */
export function createAccountController(accountService: AccountService) {
  return {
    /**
     * GET /api/accounts/list?workgroup=<id>
     *
     * Returns all accounts sorted alphabetically.
     * Optional `workgroup` query param filters results.
     *
     * Response:
     * - 200: Array of accounts with total count
     * - 500: Shiftboard API error
     */
    list: [
      validateQuery(CommonSchemas.workgroupFilter),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();
        const { workgroup } = req.query as { workgroup?: string };

        logger.debug('[account.controller] GET /api/accounts/list', { workgroup });

        const params = workgroup ? { workgroup } : undefined;
        const result = await accountService.listAccounts(params);

        res.status(200).json({
          result: {
            accounts: result.accounts,
            total: result.total,
          },
          timing: getTimingMetadata(requestStart),
        });

        const duration = Date.now() - requestStart;
        logger.info(`[account.controller] Returned ${result.total} accounts in ${duration}ms`);
      }),
    ],

    /**
     * GET /api/accounts/self
     *
     * Returns the service account identity (diagnostics).
     *
     * Response:
     * - 200: Single account record
     * - 500: Shiftboard API error
     */
    self: [
      asyncHandler(async (_req: Request, res: Response) => {
        const requestStart = Date.now();

        logger.debug('[account.controller] GET /api/accounts/self');

        const result = await accountService.getSelf();

        res.status(200).json({
          result: {
            account: result.account,
          },
          timing: getTimingMetadata(requestStart),
        });
      }),
    ],

    /**
     * GET /api/accounts/workgroup/:workgroupId
     *
     * Returns accounts belonging to a specific workgroup.
     *
     * Route params:
     * - workgroupId (required): Workgroup ID
     *
     * Response:
     * - 200: Sorted account list with total count
     * - 400: Missing/invalid workgroupId
     * - 500: Shiftboard API error
     */
    byWorkgroup: [
      validateParams(CommonSchemas.workgroupId),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();
        const { workgroupId } = req.params;
        const wgId = String(workgroupId);

        logger.debug(`[account.controller] GET /api/accounts/workgroup/${wgId}`);

        const result = await accountService.getByWorkgroup(wgId);

        res.status(200).json({
          result: {
            accounts: result.accounts,
            total: result.total,
            workgroupId: wgId,
          },
          timing: getTimingMetadata(requestStart),
        });

        const duration = Date.now() - requestStart;
        logger.info(
          `[account.controller] Returned ${result.total} accounts for workgroup ${wgId} in ${duration}ms`
        );
      }),
    ],

    /**
     * GET /api/accounts/:accountId
     *
     * Returns a single account by ID.
     *
     * Route params:
     * - accountId (required): Account ID
     *
     * Response:
     * - 200: Single account record
     * - 400: Missing/invalid accountId
     * - 500: Shiftboard API error
     */
    byId: [
      validateParams(CommonSchemas.accountId),
      asyncHandler(async (req: Request, res: Response) => {
        const requestStart = Date.now();
        const { accountId } = req.params;
        const accId = String(accountId);

        logger.debug(`[account.controller] GET /api/accounts/${accId}`);

        const result = await accountService.getById(accId);

        res.status(200).json({
          result: {
            account: result.account,
          },
          timing: getTimingMetadata(requestStart),
        });

        const duration = Date.now() - requestStart;
        logger.info(`[account.controller] Returned account ${accId} in ${duration}ms`);
      }),
    ],
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export interface AccountController {
  list: Array<RequestHandler>;
  self: Array<RequestHandler>;
  byWorkgroup: Array<RequestHandler>;
  byId: Array<RequestHandler>;
}
