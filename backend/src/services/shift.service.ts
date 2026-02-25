/**
 * Shift Service
 *
 * Business logic for shift operations.
 * Orchestrates Shiftboard API calls with shift grouping and metrics collection.
 * Supports committee configuration for workgroup filtering.
 * Supports mock data mode via ENABLE_MOCK_DATA environment variable.
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
import { committeeConfig } from '../config/committee.config';
import {
  isMockEnabled,
  getMockShifts,
  getMockAccounts,
  getMockWorkgroups,
} from './mock-data.service';
import logger from '../config/logger';

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

export interface UpcomingShiftsResult {
  shifts: GroupedShift[];
  referenced_objects: {
    account: Account[];
    workgroup: { id: string; name: string }[];
  };
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
    // Determine workgroup filtering strategy based on parameters and committee config
    let effectiveWorkgroup: string | undefined;
    let filterWorkgroupIds: Set<string> | undefined;

    if (workgroupId) {
      // Frontend specified a workgroup (user selected from dropdown)
      effectiveWorkgroup = workgroupId;
    } else if (committeeConfig.filterMode === 'single') {
      // Single workgroup mode - use configured workgroup
      effectiveWorkgroup = committeeConfig.workgroupIds[0];
    } else if (committeeConfig.filterMode === 'ids' || committeeConfig.filterMode === 'codes') {
      // Multi-workgroup mode - fetch all shifts, filter afterward
      // We'll need to get workgroup IDs to filter by
      filterWorkgroupIds = new Set(committeeConfig.workgroupIds);
    }
    // Global mode: no filtering, fetch all shifts

    const filterDescription = effectiveWorkgroup
      ? `workgroup=${effectiveWorkgroup}`
      : filterWorkgroupIds
        ? `${committeeConfig.filterMode}=[${committeeConfig.filterMode === 'codes' ? committeeConfig.workgroupCodes : committeeConfig.workgroupIds}]`
        : 'all';

    logger.debug(
      `[shift.service] Fetching whos-on shifts (${filterDescription}${isMockEnabled() ? ' [MOCK MODE]' : ''})`
    );

    // ========================================================================
    // Mock Data Mode (Development/Testing)
    // ========================================================================

    if (isMockEnabled()) {
      logger.info('[shift.service] 🎭 Mock data mode enabled - returning generated mock shifts');

      const fetchStart = performance.now();

      // Generate mock data
      const rawShifts = getMockShifts();
      const accounts = getMockAccounts();
      const workgroups = getMockWorkgroups();

      // Filter by workgroup if specified
      const filteredShifts = effectiveWorkgroup
        ? rawShifts.filter((shift) => shift.workgroup === effectiveWorkgroup)
        : rawShifts;

      const fetchDuration = performance.now() - fetchStart;

      logger.debug(
        `[shift.service] Generated ${filteredShifts.length} mock shifts in ${fetchDuration.toFixed(2)}ms`
      );

      // Apply shift grouping algorithm
      const groupingStart = performance.now();

      // Convert ShiftboardShift to RawShift format
      const rawShiftsFormatted: RawShift[] = filteredShifts.map((shift) => ({
        id: shift.id,
        name: shift.name,
        subject: shift.subject,
        location: shift.location,
        workgroup: shift.workgroup,
        local_start_date: shift.local_start_date,
        local_end_date: shift.local_end_date,
        covering_member: shift.members?.[0]?.member,
        clocked_in: shift.members?.[0]?.clocked_in || false,
      }));

      const groupedShifts = groupShiftsByAttributes(rawShiftsFormatted, accounts as Account[]);

      const groupingDuration = performance.now() - groupingStart;

      // Collect metrics
      const clockedInCount = countClockedIn(groupedShifts);

      const metrics: ShiftServiceMetrics = {
        original_shift_count: filteredShifts.length,
        grouped_shift_count: groupedShifts.length,
        clocked_in_count: clockedInCount,
        fetch_duration_ms: Math.round(fetchDuration),
        grouping_duration_ms: Math.round(groupingDuration),
      };

      logger.debug(
        `[shift.service] Grouped ${metrics.original_shift_count} → ${metrics.grouped_shift_count} mock shifts, ${clockedInCount} clocked in`
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
          start: 0,
          batch: filteredShifts.length,
          total: filteredShifts.length,
          next: null,
        },
      };
    }

    // ========================================================================
    // Production Mode (Real Shiftboard API)
    // ========================================================================

    const fetchStart = performance.now();

    // Call Shiftboard API with required parameters
    const params: { workgroup?: string; batch?: number } = { batch };
    if (effectiveWorkgroup) {
      params.workgroup = effectiveWorkgroup;
    }

    const response: ShiftListResponse = await this.shiftboard.getWhosOn(params);

    const fetchDuration = performance.now() - fetchStart;

    // Extract data from Shiftboard response
    let rawShifts = response.shifts || [];
    const accounts = response.referenced_objects?.account || [];
    const workgroups = response.referenced_objects?.workgroup || [];

    logger.debug(
      `[shift.service] Received ${rawShifts.length} raw shifts from Shiftboard in ${fetchDuration.toFixed(2)}ms`
    );

    // Apply multi-workgroup filtering if needed
    if (filterWorkgroupIds) {
      // For 'ids' mode, workgroupIds contains the IDs directly
      // For 'codes' mode, we need to resolve codes to IDs from the workgroups response
      let allowedWorkgroupIds: Set<string>;

      if (committeeConfig.filterMode === 'codes') {
        // Build a map of code -> ID from the workgroups
        const codeSet = new Set(committeeConfig.workgroupCodes);
        allowedWorkgroupIds = new Set(
          workgroups
            .filter((wg: { code?: string }) => wg.code && codeSet.has(wg.code))
            .map((wg: { id: string }) => wg.id)
        );
        logger.debug(
          `[shift.service] Resolved ${committeeConfig.workgroupCodes.length} codes to ${allowedWorkgroupIds.size} workgroup IDs for filtering`
        );
      } else {
        // For 'ids' mode, use the configured IDs directly
        allowedWorkgroupIds = new Set(committeeConfig.workgroupIds);
      }

      // Filter shifts to only include those from allowed workgroups
      const originalCount = rawShifts.length;
      rawShifts = rawShifts.filter(
        (shift: { workgroup?: string }) =>
          shift.workgroup && allowedWorkgroupIds.has(shift.workgroup)
      );
      logger.debug(
        `[shift.service] Filtered shifts: ${originalCount} → ${rawShifts.length} (${committeeConfig.filterMode} mode)`
      );
    }

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

    logger.debug(
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
        start: response.page?.this?.start || 0,
        batch: response.page?.this?.batch || batch,
        total: rawShifts.length,
        next: response.page?.next?.start || null,
      },
    };
  }

  /**
   * Get upcoming shifts within a time window.
   * Queries future shifts and groups them by attributes.
   *
   * @param minutesAhead - How many minutes into the future to look (default: 30)
   * @param workgroupId - Optional workgroup filter
   * @param batch - Page size (default: 100)
   * @returns Grouped upcoming shifts
   */
  async getUpcomingShifts(
    minutesAhead: number = 30,
    workgroupId?: string | null,
    batch: number = 100
  ): Promise<UpcomingShiftsResult> {
    const effectiveWorkgroup = workgroupId || committeeConfig.workgroupIds[0];

    logger.debug(
      `[shift.service] Fetching upcoming shifts (${minutesAhead}min window, workgroup=${effectiveWorkgroup || 'all'}${isMockEnabled() ? ' [MOCK MODE]' : ''})`
    );

    // In mock mode, return empty result for now
    // Could enhance mock service to generate future shifts if needed
    if (isMockEnabled()) {
      logger.info('[shift.service] Mock mode: returning empty upcoming shifts');
      return {
        shifts: [],
        referenced_objects: {
          account: [],
          workgroup: [],
        },
        page: { start: 0, batch, total: 0, next: null },
      };
    }

    // Calculate date range
    const now = new Date();
    const futureDate = new Date(now.getTime() + minutesAhead * 60 * 1000);

    const startDate = now.toISOString().split('T')[0]!; // YYYY-MM-DD (always defined)
    const endDate = futureDate.toISOString().split('T')[0]!; // YYYY-MM-DD (always defined)

    const fetchStart = Date.now();

    // Fetch upcoming shifts from Shiftboard
    const response = await this.shiftboard.getUpcomingShifts({
      start_date: startDate,
      end_date: endDate,
      workgroup: effectiveWorkgroup || undefined,
      batch,
    });

    const fetchDuration = Date.now() - fetchStart;
    const rawShifts = response.shifts || [];

    logger.debug(
      `[shift.service] Fetched ${rawShifts.length} upcoming shifts in ${fetchDuration}ms`
    );

    // Filter shifts that start within the time window
    const nowTime = now.getTime();
    const futureTime = futureDate.getTime();

    const filteredShifts = rawShifts.filter((shift: RawShift) => {
      try {
        const startTime = new Date(shift.local_start_date).getTime();
        return startTime >= nowTime && startTime <= futureTime;
      } catch {
        return false;
      }
    });

    // Group shifts by attributes
    const groupStart = Date.now();
    const groupedShifts = groupShiftsByAttributes(filteredShifts);
    const groupDuration = Date.now() - groupStart;

    logger.info(
      `[shift.service] Found ${groupedShifts.length} upcoming shifts (grouped from ${filteredShifts.length}, grouping took ${groupDuration}ms)`
    );

    return {
      shifts: groupedShifts,
      referenced_objects: {
        account: (response.referenced_objects?.account || []) as Account[],
        workgroup: response.referenced_objects?.workgroup || [],
      },
      page: {
        start: 0,
        batch,
        total: groupedShifts.length,
        next: null,
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
    logger.debug('[shift.service] Fetching shift list (no grouping)');

    const response: ShiftListResponse = await this.shiftboard.listShifts(params);

    return {
      shifts: (response.shifts || []) as RawShift[],
      page: {
        start: response.page?.this?.start || 0,
        batch: response.page?.this?.batch || 100,
        total: response.shifts?.length || 0,
        next: response.page?.next?.start || null,
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
