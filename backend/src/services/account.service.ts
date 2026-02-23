/**
 * Account Service
 *
 * Business logic for account (person) operations.
 * Provides sorted/filtered account data from Shiftboard.
 */

import { ShiftboardService, ShiftboardAccount } from './shiftboard.service';
import logger from '../config/logger';

// ============================================================================
// Types
// ============================================================================

export interface AccountResult {
  accounts: ShiftboardAccount[];
  total: number;
}

export interface SingleAccountResult {
  account: ShiftboardAccount;
}

// ============================================================================
// Account Service
// ============================================================================

export class AccountService {
  private shiftboard: ShiftboardService;

  constructor(shiftboard: ShiftboardService) {
    this.shiftboard = shiftboard;
  }

  /**
   * Sort helper: alphabetical by last_name, then first_name.
   */
  private sortAccounts(accounts: ShiftboardAccount[]): ShiftboardAccount[] {
    return [...accounts].sort((a, b) => {
      const lastCmp = (a.last_name || '').localeCompare(b.last_name || '');
      if (lastCmp !== 0) return lastCmp;
      return (a.first_name || '').localeCompare(b.first_name || '');
    });
  }

  /**
   * List all accounts, sorted alphabetically by last_name, first_name.
   *
   * @param workgroup - Optional workgroup ID to filter by
   * @returns Sorted account list with total count
   */
  async listAccounts(params?: { workgroup?: string }): Promise<AccountResult> {
    logger.debug('[account.service] Fetching account list', params || {});

    const accounts = await this.shiftboard.listAccounts(params);
    const sorted = this.sortAccounts(accounts);

    logger.debug(`[account.service] Returning ${sorted.length} accounts`);
    return { accounts: sorted, total: sorted.length };
  }

  /**
   * Return the service account identity (for diagnostics).
   *
   * @returns Single account record
   */
  async getSelf(): Promise<SingleAccountResult> {
    logger.debug('[account.service] Fetching self identity');
    const account = await this.shiftboard.getSelf();
    return { account };
  }

  /**
   * Get accounts belonging to a specific workgroup, sorted alphabetically.
   *
   * @param workgroupId - Workgroup ID (required, non-empty)
   * @returns Sorted account list with total count
   * @throws Error if workgroupId is empty or whitespace
   */
  async getByWorkgroup(workgroupId: string): Promise<AccountResult> {
    if (!workgroupId || !workgroupId.trim()) {
      throw new Error('workgroupId is required');
    }

    logger.debug(`[account.service] Fetching accounts for workgroup ${workgroupId}`);

    const accounts = await this.shiftboard.getAccountsByWorkgroup(workgroupId);
    const sorted = this.sortAccounts(accounts);

    logger.debug(
      `[account.service] Returning ${sorted.length} accounts for workgroup ${workgroupId}`
    );
    return { accounts: sorted, total: sorted.length };
  }

  /**
   * Get a single account by ID.
   *
   * @param accountId - Account ID (required, non-empty)
   * @returns Single account record
   * @throws Error if accountId is empty or whitespace
   */
  async getById(accountId: string): Promise<SingleAccountResult> {
    if (!accountId || !accountId.trim()) {
      throw new Error('accountId is required');
    }

    logger.debug(`[account.service] Fetching account ${accountId}`);

    const account = await this.shiftboard.getAccountById(accountId);

    logger.debug(`[account.service] Returning account ${accountId}`);
    return { account };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create AccountService with injected ShiftboardService.
 *
 * @param shiftboard - ShiftboardService instance
 * @returns AccountService instance
 */
export function createAccountService(shiftboard: ShiftboardService): AccountService {
  return new AccountService(shiftboard);
}
