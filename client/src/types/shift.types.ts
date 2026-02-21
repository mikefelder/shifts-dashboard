/**
 * Shift Type Definitions
 *
 * Shared types for shift data across the application.
 */

// ============================================================================
// Grouped Shift (from API)
// ============================================================================

export interface GroupedShift {
  id: string;
  name: string;
  subject?: string;
  location?: string;
  workgroup?: string;
  local_start_date: string;
  local_end_date: string;
  covering_member?: string;
  clocked_in?: boolean;
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
  // Grouping fields
  assignedPeople: string[];
  assignedPersonNames: string[];
  clockStatuses: boolean[];
}

// ============================================================================
// Account (Person)
// ============================================================================

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

// ============================================================================
// Workgroup
// ============================================================================

export interface Workgroup {
  id: string;
  name: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface WhosOnResponse {
  result: {
    shifts: GroupedShift[];
    referenced_objects: {
      account: Account[];
      workgroup: Workgroup[];
    };
    metrics: {
      original_shift_count: number;
      grouped_shift_count: number;
      clocked_in_count: number;
      fetch_duration_ms: number;
      grouping_duration_ms: number;
    };
    page: {
      start: number;
      batch: number;
      total: number;
      next: number | null;
    };
  };
  timing: {
    start: string;
    end: string;
    duration_ms: number;
  };
}
