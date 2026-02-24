/**
 * Committee Configuration
 *
 * Handles deployment-time configuration for committee/workgroup filtering.
 *
 * Modes:
 * 1. Global Mode: Show all workgroups (default)
 *    - No VITE_COMMITTEE_IDS, VITE_COMMITTEE_CODES, or VITE_COMMITTEE_WORKGROUP set
 * 2. Multi-Committee Mode: Filter to specific workgroups by ID
 *    - VITE_COMMITTEE_IDS set to comma-separated list of workgroup IDs
 * 3. Multi-Committee Mode: Filter to specific workgroups by code
 *    - VITE_COMMITTEE_CODES set to comma-separated list of workgroup codes
 * 4. Single Committee Mode: Lock to specific workgroup (legacy)
 *    - VITE_COMMITTEE_WORKGROUP set to specific workgroup ID
 *    - VITE_COMMITTEE_NAME sets friendly display name
 *
 * Priority: VITE_COMMITTEE_IDS > VITE_COMMITTEE_CODES > VITE_COMMITTEE_WORKGROUP
 *
 * Examples:
 * - Global: All empty
 * - Multi by ID: VITE_COMMITTEE_IDS="5676546,5676571,198353"
 *               VITE_COMMITTEE_NAME="Information Technology"
 * - Multi by Code: VITE_COMMITTEE_CODES="ITCS,ITC365,ITC"
 *                  VITE_COMMITTEE_NAME="Information Technology"
 * - Single (legacy): VITE_COMMITTEE_WORKGROUP="safety-team-123"
 *                    VITE_COMMITTEE_NAME="Safety Committee"
 */

export interface CommitteeConfig {
  /** Display name for the committee (shown in UI header) */
  name: string;
  /** Workgroup IDs to filter to (empty array for global mode) */
  workgroupIds: string[];
  /** Workgroup codes to filter to (empty array for global mode) */
  workgroupCodes: string[];
  /** Whether this is global mode (all workgroups) */
  isGlobalMode: boolean;
  /** Filter mode being used */
  filterMode: 'global' | 'ids' | 'codes' | 'single';
  /** Whether to show workgroup filter dropdown (true for global/ids/codes, false for single) */
  shouldShowWorkgroupFilter: boolean;
}

/**
 * Parse comma-separated list from environment variable
 */
function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Get committee configuration from environment variables
 */
function getCommitteeConfig(): CommitteeConfig {
  // Parse environment variables
  const committeeIds = parseCommaSeparated(import.meta.env.VITE_COMMITTEE_IDS);
  const committeeCodes = parseCommaSeparated(import.meta.env.VITE_COMMITTEE_CODES);
  const committeeWorkgroup = import.meta.env.VITE_COMMITTEE_WORKGROUP?.trim() || '';
  const committeeName = import.meta.env.VITE_COMMITTEE_NAME?.trim() || '';
  const appName = import.meta.env.VITE_APP_NAME || 'Shift Dashboard';

  // Determine filter mode (priority: IDS > CODES > WORKGROUP)
  let filterMode: CommitteeConfig['filterMode'] = 'global';
  let workgroupIds: string[] = [];
  let workgroupCodes: string[] = [];

  if (committeeIds.length > 0) {
    filterMode = 'ids';
    workgroupIds = committeeIds;
  } else if (committeeCodes.length > 0) {
    filterMode = 'codes';
    workgroupCodes = committeeCodes;
  } else if (committeeWorkgroup && committeeWorkgroup.toLowerCase() !== 'all') {
    filterMode = 'single';
    workgroupIds = [committeeWorkgroup];
  }

  const isGlobalMode = filterMode === 'global';
  const shouldShowWorkgroupFilter = filterMode !== 'single';

  return {
    name: isGlobalMode ? appName : committeeName || appName,
    workgroupIds,
    workgroupCodes,
    isGlobalMode,
    filterMode,
    shouldShowWorkgroupFilter,
  };
}

// Export singleton instance
export const committeeConfig = getCommitteeConfig();

// Export for testing
export { getCommitteeConfig };
