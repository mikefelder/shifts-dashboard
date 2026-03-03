/**
 * Workgroup Service
 *
 * Business logic for workgroup and role operations.
 * Provides sorted/filtered workgroup and role data from Shiftboard.
 */

import { ShiftboardService, ShiftboardWorkgroup, ShiftboardRole } from './shiftboard.service';
import logger from '../config/logger';

// ============================================================================
// Types
// ============================================================================

export interface WorkgroupResult {
  workgroups: ShiftboardWorkgroup[];
  total: number;
}

export interface RoleResult {
  roles: ShiftboardRole[];
  total: number;
  workgroupId: string;
}

// ============================================================================
// Workgroup Service
// ============================================================================

export class WorkgroupService {
  private shiftboard: ShiftboardService;

  constructor(shiftboard: ShiftboardService) {
    this.shiftboard = shiftboard;
  }

  /**
   * List all workgroups, sorted alphabetically by name.
   *
   * @returns Sorted list of workgroups with total count
   *
   * @example
   * const result = await workgroupService.listWorkgroups();
   * console.log(`${result.total} workgroups available`);
   */
  async listWorkgroups(): Promise<WorkgroupResult> {
    logger.debug('[workgroup.service] Fetching workgroup list');

    const workgroups = await this.shiftboard.listWorkgroups();

    // Sort alphabetically by name for consistent UI display
    const sorted = [...workgroups].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    logger.debug(`[workgroup.service] Returning ${sorted.length} workgroups`);

    return {
      workgroups: sorted,
      total: sorted.length,
    };
  }

  /**
   * List roles for a specific workgroup.
   *
   * @param workgroupId - Workgroup ID to fetch roles for
   * @returns Roles for the workgroup, sorted alphabetically
   *
   * @example
   * const result = await workgroupService.getRoles('workgroup-123');
   * console.log(`${result.roles.length} roles in workgroup`);
   */
  async getRoles(workgroupId: string): Promise<RoleResult> {
    logger.debug(`[workgroup.service] Fetching roles for workgroup ${workgroupId}`);

    if (!workgroupId || workgroupId.trim() === '') {
      throw new Error('workgroupId is required');
    }

    const roles = await this.shiftboard.getWorkgroupRoles(workgroupId);

    // Sort alphabetically by name
    const sorted = [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    logger.debug(
      `[workgroup.service] Returning ${sorted.length} roles for workgroup ${workgroupId}`
    );

    return {
      roles: sorted,
      total: sorted.length,
      workgroupId,
    };
  }

  /**
   * List all roles across the organization (not filtered by workgroup).
   *
   * @returns All roles sorted alphabetically
   */
  async listAllRoles(): Promise<Pick<RoleResult, 'roles' | 'total'>> {
    logger.debug('[workgroup.service] Fetching all roles');

    const roles = await this.shiftboard.listRoles();

    const sorted = [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return {
      roles: sorted,
      total: sorted.length,
    };
  }
}

/**
 * Create workgroup service instance with configured Shiftboard client.
 *
 * @param shiftboard - Shiftboard service instance
 * @returns Workgroup service instance
 */
export function createWorkgroupService(shiftboard: ShiftboardService): WorkgroupService {
  return new WorkgroupService(shiftboard);
}
