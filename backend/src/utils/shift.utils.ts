/**
 * Shift Utilities
 *
 * Provides shift processing functions including grouping algorithm.
 *
 * Performance Target: <50ms for 1000 shifts
 */

import logger from '../config/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Raw shift from Shiftboard API
 * Represents a single shift assignment (one person per shift)
 */
export interface RawShift {
  id: string;
  name: string;
  subject?: string;
  location?: string;
  workgroup?: string;
  local_start_date: string;
  local_end_date: string;
  covering_member?: string;
  clocked_in?: boolean | null;
  can_clock_in_out?: boolean;
  display_date?: string;
  display_start_time?: string;
  display_time?: string;
  timezone?: string;
  covered?: boolean;
  published?: boolean;
  details?: string;
  kind?: string;
  role?: {
    id: string;
    name: string;
  };
  count?: string;
  qty?: string;
}

/**
 * Account object for name resolution
 */
export interface Account {
  id: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  screen_name?: string;
  mobile_phone?: string;
  seniority_order?: string;
  clocked_in?: boolean;
}

/**
 * Grouped shift with multiple assigned people
 * Extends RawShift with grouping fields
 */
export interface GroupedShift extends RawShift {
  assignedPeople: string[]; // Member IDs
  assignedPersonNames: string[]; // Readable names
  clockStatuses: boolean[]; // Parallel array for clock-in status
}

// ============================================================================
// Shift Grouping Algorithm
// ============================================================================

/**
 * Group shifts by common attributes (name, time, workgroup, subject, location).
 *
 * Multiple shift records with identical attributes but different assigned people
 * are combined into a single shift with arrays of people, names, and clock statuses.
 *
 * Performance: O(n) - single pass through shifts
 *
 * @param shifts - Array of raw shifts from Shiftboard
 * @param accounts - Array of accounts for name resolution
 * @returns Array of grouped shifts
 *
 * @example
 * // Two shifts at same time/location with different people
 * const raw = [
 *   { id: '1', name: 'Security', start: '08:00', covering_member: 'alice', clocked_in: true },
 *   { id: '2', name: 'Security', start: '08:00', covering_member: 'bob', clocked_in: false }
 * ];
 * const grouped = groupShiftsByAttributes(raw, accounts);
 * // Result: [{ ...shift, assignedPeople: ['alice', 'bob'], clockStatuses: [true, false] }]
 */
export function groupShiftsByAttributes(
  shifts: RawShift[],
  accounts: Account[] = []
): GroupedShift[] {
  if (!Array.isArray(shifts) || shifts.length === 0) {
    return [];
  }

  const startTime = performance.now();

  // Build account lookup map for O(1) name resolution
  const accountMap = new Map<string, Account>();
  for (const account of accounts) {
    if (account.id) {
      accountMap.set(account.id, account);
    }
  }

  // Group shifts by composite key
  const shiftGroups = new Map<string, GroupedShift>();

  for (const shift of shifts) {
    // Validate required fields
    if (!shift.id || !shift.name) {
      logger.warn('[shift.utils] Skipping invalid shift:', shift);
      continue;
    }

    // Construct grouping key from immutable shift attributes
    // Key format: name|start|end|workgroup|subject|location
    const shiftKey = [
      shift.name || '',
      shift.local_start_date || '',
      shift.local_end_date || '',
      shift.workgroup || '',
      shift.subject || '',
      shift.location || '',
    ].join('|');

    const coveringMember = shift.covering_member || '';
    const clockedIn = shift.clocked_in === true; // Coerce to explicit boolean

    if (!shiftGroups.has(shiftKey)) {
      // First shift with this key - create new group
      const resolvedName = resolveName(coveringMember, accountMap);

      shiftGroups.set(shiftKey, {
        ...shift,
        assignedPeople: coveringMember ? [coveringMember] : [],
        assignedPersonNames: coveringMember ? [resolvedName] : [],
        clockStatuses: coveringMember ? [clockedIn] : [],
      });
    } else {
      // Shift with this key already exists - add person to group
      const group = shiftGroups.get(shiftKey)!;

      // Prevent duplicate member IDs in same group
      if (coveringMember && !group.assignedPeople.includes(coveringMember)) {
        const resolvedName = resolveName(coveringMember, accountMap);

        group.assignedPeople.push(coveringMember);
        group.assignedPersonNames.push(resolvedName);
        group.clockStatuses.push(clockedIn);
      }
    }
  }

  const grouped = Array.from(shiftGroups.values());

  const duration = performance.now() - startTime;
  logger.debug(
    `[shift.utils] Grouped ${shifts.length} shifts → ${grouped.length} groups in ${duration.toFixed(2)}ms`
  );

  return grouped;
}

/**
 * Resolve account ID to readable name.
 *
 * Precedence:
 * 1. screen_name
 * 2. first_name + last_name
 * 3. "Unassigned" (if not found)
 *
 * @param memberId - Account ID to resolve
 * @param accountMap - Map of account ID → account object
 * @returns Resolved name string
 */
function resolveName(memberId: string, accountMap: Map<string, Account>): string {
  if (!memberId) {
    return 'Unassigned';
  }

  const account = accountMap.get(memberId);
  if (!account) {
    return 'Unassigned';
  }

  // Prefer screen_name if available
  if (account.screen_name?.trim()) {
    return account.screen_name.trim();
  }

  // Fall back to first + last name
  const firstName = account.first_name?.trim() || '';
  const lastName = account.last_name?.trim() || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }

  return 'Unassigned';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Count total clocked-in people across all shifts.
 *
 * @param shifts - Array of grouped shifts
 * @returns Total count of people currently clocked in
 */
export function countClockedIn(shifts: GroupedShift[]): number {
  let count = 0;

  for (const shift of shifts) {
    for (const isClocked of shift.clockStatuses) {
      if (isClocked) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Calculate total number of assigned people across all shifts.
 *
 * @param shifts - Array of grouped shifts
 * @returns Total count of assigned people (may include duplicates across shifts)
 */
export function countTotalAssigned(shifts: GroupedShift[]): number {
  return shifts.reduce((sum, shift) => sum + shift.assignedPeople.length, 0);
}

/**
 * Filter shifts by workgroup ID.
 *
 * @param shifts - Array of shifts
 * @param workgroupId - Workgroup ID to filter by
 * @returns Filtered array of shifts
 */
export function filterByWorkgroup<T extends RawShift>(
  shifts: T[],
  workgroupId: string | null
): T[] {
  if (!workgroupId) {
    return shifts;
  }

  return shifts.filter((shift) => shift.workgroup === workgroupId);
}

/**
 * Validate shift has required fields.
 *
 * @param shift - Shift to validate
 * @returns True if valid, false otherwise
 */
export function isValidShift(shift: unknown): shift is RawShift {
  if (!shift || typeof shift !== 'object') {
    return false;
  }

  const s = shift as RawShift;

  return !!(s.id && s.name && s.local_start_date && s.local_end_date);
}
