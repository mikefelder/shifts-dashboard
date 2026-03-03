/**
 * Committee Configuration
 *
 * Handles deployment-time configuration for committee/workgroup filtering.
 *
 * When committee filters are set, the backend automatically filters all
 * API responses to those specific workgroups. This is useful for:
 * - Multi-tenant deployments (one deployment per committee)
 * - Department-specific views (e.g., IT Committee sees only IT workgroups)
 * - White-label deployments
 * - Security/data isolation
 *
 * Modes:
 * 1. Global Mode: Return all workgroups (default)
 *    - No COMMITTEE_IDS, COMMITTEE_CODES, or COMMITTEE_WORKGROUP set
 * 2. Multi-Committee Mode: Filter to specific workgroups by ID
 *    - COMMITTEE_IDS set to comma-separated list of workgroup IDs
 * 3. Multi-Committee Mode: Filter to specific workgroups by code
 *    - COMMITTEE_CODES set to comma-separated list of workgroup codes
 * 4. Single Committee Mode: Filter to specific workgroup (legacy)
 *    - COMMITTEE_WORKGROUP set to specific workgroup ID
 *
 * Priority: COMMITTEE_IDS > COMMITTEE_CODES > COMMITTEE_WORKGROUP
 *
 * Examples:
 * - Global: All empty
 * - Multi by ID: COMMITTEE_IDS="5676546,5676571,198353"
 * - Multi by Code: COMMITTEE_CODES="ITCS,ITC365,ITC"
 * - Single (legacy): COMMITTEE_WORKGROUP="safety-team-123"
 */

export interface CommitteeConfig {
  /** Workgroup IDs to filter to (empty array for global mode) */
  workgroupIds: string[];
  /** Workgroup codes to filter to (empty array for global mode) */
  workgroupCodes: string[];
  /** Whether this is global mode (all workgroups) */
  isGlobalMode: boolean;
  /** Filter mode being used */
  filterMode: 'global' | 'ids' | 'codes' | 'single';
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
  const committeeIds = parseCommaSeparated(process.env.COMMITTEE_IDS);
  const committeeCodes = parseCommaSeparated(process.env.COMMITTEE_CODES);
  const committeeWorkgroup = process.env.COMMITTEE_WORKGROUP?.trim() || '';

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

  return {
    workgroupIds,
    workgroupCodes,
    isGlobalMode,
    filterMode,
  };
}

// Export singleton instance
export const committeeConfig = getCommitteeConfig();

// Export for testing
export { getCommitteeConfig };
