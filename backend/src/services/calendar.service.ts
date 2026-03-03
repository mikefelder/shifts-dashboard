/**
 * Calendar Service
 *
 * Business logic for calendar operations and aggregated statistics.
 * Currently provides stub implementation for summary endpoint.
 */

// ============================================================================
// Types
// ============================================================================

export interface CalendarSummaryResult {
  summary: string;
}

// ============================================================================
// Calendar Service
// ============================================================================

export class CalendarService {
  /**
   * Get calendar summary with aggregated statistics.
   *
   * @returns Summary object (stub implementation)
   *
   * @example
   * const result = await calendarService.getSummary();
   * console.log(result.summary); // "Not yet implemented"
   *
   * @todo Future enhancement: Return metrics like:
   * - Total shifts
   * - Coverage percentage
   * - Shifts by workgroup
   * - Clocked in vs not clocked in stats
   */
  async getSummary(): Promise<CalendarSummaryResult> {
    console.log('[calendar.service] Fetching calendar summary (stub)');

    // Stub implementation - to be enhanced in future versions
    return {
      summary: 'Not yet implemented',
    };
  }
}

/**
 * Factory function to create calendar service instance.
 *
 * @returns CalendarService instance
 */
export function createCalendarService(): CalendarService {
  return new CalendarService();
}
