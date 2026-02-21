/**
 * Role Service
 *
 * Business logic for role operations.
 * Provides role data from Shiftboard with sorting and formatting.
 */

import { ShiftboardService, ShiftboardRole } from './shiftboard.service';

// ============================================================================
// Types
// ============================================================================

export interface RoleResult {
  role: ShiftboardRole;
}

export interface RolesListResult {
  roles: ShiftboardRole[];
  total: number;
}

// ============================================================================
// Role Service
// ============================================================================

export class RoleService {
  private shiftboard: ShiftboardService;

  constructor(shiftboard: ShiftboardService) {
    this.shiftboard = shiftboard;
  }

  /**
   * Get a specific role by ID.
   *
   * @param roleId - Role ID to fetch
   * @returns Role object
   *
   * @example
   * const result = await roleService.getRole('role-123');
   * console.log(`Role: ${result.role.name}`);
   */
  async getRole(roleId: string): Promise<RoleResult> {
    console.log(`[role.service] Fetching role ${roleId}`);

    if (!roleId || roleId.trim() === '') {
      throw new Error('roleId is required');
    }

    const role = await this.shiftboard.getRole(roleId);

    console.log(`[role.service] Returning role: ${role.name || role.id}`);

    return {
      role,
    };
  }

  /**
   * List all roles, sorted alphabetically by name.
   *
   * @returns Sorted list of roles with total count
   *
   * @example
   * const result = await roleService.listRoles();
   * console.log(`${result.total} roles available`);
   */
  async listRoles(): Promise<RolesListResult> {
    console.log('[role.service] Fetching role list');

    const roles = await this.shiftboard.listRoles();

    // Sort alphabetically by name for consistent UI display
    const sorted = [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log(`[role.service] Returning ${sorted.length} roles`);

    return {
      roles: sorted,
      total: sorted.length,
    };
  }
}

/**
 * Factory function to create role service instance.
 *
 * @param shiftboard - Shiftboard service instance
 * @returns RoleService instance
 */
export function createRoleService(shiftboard: ShiftboardService): RoleService {
  return new RoleService(shiftboard);
}
