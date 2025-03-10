/**
 * Member status for a shift including clock-in state
 */
export interface ShiftMember {
    id: string;
    clocked_in: boolean;
}

/**
 * Complete shift information from Shiftboard API
 * Including properties added by the backend grouping logic
 */
export interface Shift {
    // Original Shiftboard API properties
    id: string;
    absent_operation_utc: string | null;
    absent_reason: string | null;
    count: string;
    covered: boolean;
    covering_member: string;
    covering_member_status: ShiftMember;
    created: string;
    custom_dropdown_1: string | null;
    delete_on_unconfirm: boolean;
    department: string | null;
    details: string;
    display_date: string;
    display_start_time: string;
    display_time: string;
    end_date: string;
    external_covering_member: string;
    extra_credit: string | null;
    has_signed_up: boolean | null;
    is_a_trade: boolean;
    kind: string;
    linktitle: string;
    linkurl: string;
    local_end_date: string;
    local_start_date: string;
    location: string | null;
    name: string;
    no_credit: boolean;
    no_pick_up: boolean;
    no_show_reason: string | null;
    no_trade: boolean;
    publish_date_utc: string | null;
    publish_level: string | null;
    published: boolean;
    qty: string;
    role: {
        id: string;
        name: string;
    } | null;
    room_floor: string;
    signup_list: boolean;
    start_date: string;
    status_updated: string;
    subject: string;
    timezone: string;
    updated: string;
    urgent: boolean;
    use_time: string;
    workgroup: string;
    zipcode: string;
    can_clock_in_out: boolean;
    clocked_in: boolean;

    // Properties added by backend shift grouping
    assignedPeople?: string[];           // IDs of people assigned to this shift
    clockStatuses?: boolean[];           // Clock-in status for each assigned person
    assignedPersonNames?: string[];      // Names of people assigned to this shift
}

/**
 * Account information for shift members
 */
export interface Account {
    external_id: string;
    first_name: string;
    last_name: string;
    id: string;
    screen_name: string;
    seniority_order: string;
    clocked_in: boolean;
}

/**
 * Workgroup information
 */
export interface Workgroup {
    id: string;
    name: string;
}

/**
 * Pagination options for API requests
 */
export interface PaginationOptions {
    start?: number;
    batch?: number;
}

/**
 * Pagination metadata in API responses
 */
export interface PaginationInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    pageSize: number;
    totalResults: number;
}

/**
 * Page information structure in API responses
 */
export interface PageInfo {
    next?: {
        batch: number;
        start: number;
    };
    this?: {
        batch: number;
        start: number;
    };
    more?: boolean;
    total?: number;
}

/**
 * API response structure for who's on data
 */
export interface WhosOnResponse {
    result: {
        shifts: Shift[];
        referenced_objects: {
            account: Account[];
            workgroup: Workgroup[];
        };
        pagination?: PaginationInfo;
        page?: PageInfo;
        metrics?: {
            original_shift_count: number;
            grouped_shift_count: number;
            fetch_time_ms: number;
            grouping_time_ms: number;
            total_time_ms: number;
        }
    };
    timing?: {
        duration_ms: number;
        timestamp: string;
    }
}

/**
 * Extended API response with data freshness indicator
 */
export interface EnhancedApiResponse {
    isFreshData: boolean; // True if data was fetched from API, false if from cache
}

// Update WhosOnResponse to potentially include this field
export type WhosOnResponseWithFreshFlag = WhosOnResponse & Partial<EnhancedApiResponse>;
