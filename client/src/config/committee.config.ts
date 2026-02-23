/**
 * Committee Configuration
 *
 * Handles deployment-time configuration for committee/workgroup filtering.
 *
 * Modes:
 * 1. Global Mode: Show all workgroups (default)
 *    - VITE_COMMITTEE_WORKGROUP not set, empty, or "all"
 * 2. Single Committee Mode: Lock to specific workgroup
 *    - VITE_COMMITTEE_WORKGROUP set to specific workgroup ID
 *    - VITE_COMMITTEE_NAME sets friendly display name
 *
 * Examples:
 * - Global: VITE_COMMITTEE_WORKGROUP=""
 * - Single: VITE_COMMITTEE_WORKGROUP="safety-team-123"
 *           VITE_COMMITTEE_NAME="Safety Committee"
 */

export interface CommitteeConfig {
  /** Display name for the committee (shown in UI header) */
  name: string;
  /** Workgroup ID to filter to, or null for global mode */
  workgroupId: string | null;
  /** Whether this is global mode (all workgroups) or single committee mode */
  isGlobalMode: boolean;
}

/**
 * Get committee configuration from environment variables
 */
function getCommitteeConfig(): CommitteeConfig {
  const workgroup = import.meta.env.VITE_COMMITTEE_WORKGROUP?.trim() || '';
  const name = import.meta.env.VITE_COMMITTEE_NAME?.trim() || '';
  const appName = import.meta.env.VITE_APP_NAME || 'Shift Dashboard';

  // Determine if global mode
  const isGlobalMode = !workgroup || workgroup.toLowerCase() === 'all';

  return {
    name: isGlobalMode ? appName : name || appName,
    workgroupId: isGlobalMode ? null : workgroup,
    isGlobalMode,
  };
}

// Export singleton instance
export const committeeConfig = getCommitteeConfig();

// Export for testing
export { getCommitteeConfig };
