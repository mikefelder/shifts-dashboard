/**
 * Shift Service
 *
 * Business logic for shift operations.
 * Orchestrates Shiftboard API calls with shift grouping and metrics collection.
 */

import { ShiftboardService, ShiftListResponse } from './shiftboard.service';
import {
  RawShift,
  GroupedShift,
  Account,
  groupShiftsByAttributes,
  countClockedIn,
  filterByWorkgroup,
} from '../utils/shift.utils';

// ============================================================================
// Types
// ============================================================================

export interface ShiftServiceMetrics {
  original_shift_count: number; // Count before grouping
  grouped_shift_count: number; // Count after grouping
  clocked_in_count: number; // Total people clocked in
  fetch_duration_ms: number; // Time to fetch from Shiftboard
  grouping_duration_ms: number; // Time to run grouping algorithm
}

export interface WhosOnResult {
  shifts: GroupedShift[];
  referenced_objects: {
    account: Account[];
    workgroup: { id: string; name: string }[];
  };
  metrics: ShiftServiceMetrics;
  page: {
    start: number;
    batch: number;
    total: number;
    next: number | null;
  };
}

export interface ShiftListResult {
  shifts: RawShift[];
  page: {
    start: number;
    batch: number;
    total: number;
    next: number | null;
  };
}

// ============================================================================
// Shift Service
// ============================================================================

export class ShiftService {
  private shiftboard: ShiftboardService;

  constructor(shiftboard: ShiftboardService) {
    this.shiftboard = shiftboard;
  }

  /**
   * Get current shifts with clock-in status and grouping applied.
   *
   * This is the primary method used by the UI's active shifts timeline.
   *
   * @param workgroupId - Optional workgroup filter
   * @param batch - Page size (default: 100, max: 100)
   * @returns Grouped shifts with metrics
   *
   * @example
   * const result = await shiftService.shiftWhosOn('workgroup-123');
   * console.log(`${result.shifts.length} grouped shifts`);
   * console.log(`${result.metrics.clocked_in_count} people clocked in`);
   */
  async shiftWhosOn(workgroupId?: string | null, batch: number = 100): Promise<WhosOnResult> {
    console.log(`[shift.service] Fetching whos-on shifts (workgroup=${workgroupId || 'all'})`);

    const fetchStart = performance.now();

    // Call Shiftboard API with required parameters
    const params: { workgroup?: string; batch?: number } = { batch };
    if (workgroupId) {
      params.workgroup = workgroupId;
    }

    const response: ShiftListResponse = await this.shiftboard.getWhosOn(params);

    const fetchDuration = performance.now() - fetchStart;

    // Extract data from Shiftboard response
    const rawShifts = response.shifts || [];
    const accounts = response.referenced_objects?.account || [];
    const workgroups = response.referenced_objects?.workgroup || [];

    console.log(
      `[shift.service] Received ${rawShifts.length} raw shifts from Shiftboard in ${fetchDuration.toFixed(2)}ms`
    );

    // Apply shift grouping algorithm
    const groupingStart = performance.now();

    const groupedShifts = groupShiftsByAttributes(rawShifts as RawShift[], accounts as Account[]);

    const groupingDuration = performance.now() - groupingStart;

    // Collect metrics
    const clockedInCount = countClockedIn(groupedShifts);

    const metrics: ShiftServiceMetrics = {
      original_shift_count: rawShifts.length,
      grouped_shift_count: groupedShifts.length,
      clocked_in_count: clockedInCount,
      fetch_duration_ms: Math.round(fetchDuration),
      grouping_duration_ms: Math.round(groupingDuration),
    };

    console.log(
      `[shift.service] Grouped ${metrics.original_shift_count} → ${metrics.grouped_shift_count} shifts, ${clockedInCount} clocked in`
    );

    // Construct result
    return {
      shifts: groupedShifts,
      referenced_objects: {
        account: accounts as Account[],
        workgroup: workgroups || [],
      },
      metrics,
      page: {
        start: response.page?.start || 0,
        batch: response.page?.batch || batch,
        total: response.page?.total || rawShifts.length,
        next: response.page?.next || null,
      },
    };
  }

  /**
   * List shifts without grouping (pass-through to Shiftboard).
   *
   * Used for raw data access or debugging.
   *
   * @param params - Optional pagination and filter parameters
   * @returns Raw shifts from Shiftboard
   */
  async shiftList(params?: {
    start?: number;
    batch?: number;
    workgroup?: string;
  }): Promise<ShiftListResult> {
    console.log('[shift.service] Fetching shift list (no grouping)');

    const response: ShiftListResponse = await this.shiftboard.listShifts(params);

    return {
      shifts: (response.shifts || []) as RawShift[],
      page: {
        start: response.page?.start || 0,
        batch: response.page?.batch || 100,
        total: response.page?.total || response.shifts?.length || 0,
        next: response.page?.next || null,
      },
    };
  }

  /**
   * Apply workgroup filter to existing shifts.
   *
   * Note: For performance, prefer passing workgroup to API call directly.
   * This method is for post-processing cached data.
   *
   * @param shifts - Array of shifts to filter
   * @param workgroupId - Workgroup ID to filter by (null = no filter)
   * @returns Filtered shifts
   */
  applyWorkgroupFilter<T extends RawShift>(shifts: T[], workgroupId: string | null): T[] {
    return filterByWorkgroup(shifts, workgroupId);
  }
}

/**
 * Create shift service instance with configured Shiftboard client.
 *
 * @param shiftboard - Shiftboard service instance
 * @returns Shift service instance
 */
export function createShiftService(shiftboard: ShiftboardService): ShiftService {
  return new ShiftService(shiftboard);
}
