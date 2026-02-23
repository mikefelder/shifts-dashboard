/**
 * Committee Configuration
 *
 * Handles deployment-time configuration for committee/workgroup filtering.
 *
 * When COMMITTEE_WORKGROUP is set, the backend automatically filters all
 * API responses to that specific workgroup. This is useful for:
 * - Multi-tenant deployments (one deployment per committee)
 * - White-label deployments
 * - Security/data isolation
 *
 * Modes:
 * 1. Global Mode: Return all workgroups (default)
 *    - COMMITTEE_WORKGROUP not set, empty, or "all"
 * 2. Single Committee Mode: Filter to specific workgroup
 *    - COMMITTEE_WORKGROUP set to specific workgroup ID
 *
 * Examples:
 * - Global: COMMITTEE_WORKGROUP=""
 * - Single: COMMITTEE_WORKGROUP="safety-team-123"
 */

export interface CommitteeConfig {
  /** Workgroup ID to filter to, or null for global mode */
  workgroupId: string | null;
  /** Whether this is global mode (all workgroups) or single committee mode */
  isGlobalMode: boolean;
}

/**
 * Get committee configuration from environment variables
 */
function getCommitteeConfig(): CommitteeConfig {
  const workgroup = process.env.COMMITTEE_WORKGROUP?.trim() || '';

  // Determine if global mode
  const isGlobalMode = !workgroup || workgroup.toLowerCase() === 'all';

  return {
    workgroupId: isGlobalMode ? null : workgroup,
    isGlobalMode,
  };
}

// Export singleton instance
export const committeeConfig = getCommitteeConfig();

// Export for testing
export { getCommitteeConfig };
