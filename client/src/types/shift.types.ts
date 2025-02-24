/**
 * Member status for a shift including clock-in state
 */
export interface ShiftMember {
    id: string;
    clocked_in: boolean;
}

/**
 * Complete shift information from Shiftboard API
 */
export interface Shift {
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
    /** Whether the member can clock in/out for this shift */
    can_clock_in_out: boolean;
    /** Current clock-in status for the shift */
    clocked_in: boolean;
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
 * API response structure for who's on data
 */
export interface WhosOnResponse {
    result: {
        shifts: Shift[];
        referenced_objects: {
            account: Account[];
            workgroup: Workgroup[];
        };
    };
}
