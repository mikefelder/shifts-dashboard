# Shifts Dashboard - Codebase Analysis & Feature Specification

**Analysis Date**: 2026-02-17  
**Purpose**: Complete feature specification extracted from existing codebase for rebuilding with feature parity  
**Source**: Live codebase analysis of `/Users/mike/shifts-dashboard`

## Executive Summary

The Shifts Dashboard is a full-stack web application that provides real-time visibility into volunteer shift assignments and clock-in status sourced from the Shiftboard API. The application consists of:

- **Backend**: Node.js/Express API proxy that authenticates to Shiftboard, normalizes responses, and groups shift data
- **Frontend**: React/TypeScript SPA with Material-UI providing calendar and tabular views
- **Storage**: IndexedDB browser cache for offline resilience
- **Deployment**: Azure App Service compatible with static client serving in production

## Current Technology Stack

### Backend
- **Runtime**: Node.js (LTS)
- **Framework**: Express 4.18+
- **Dependencies**:
  - `axios` 1.6+ - HTTP client for Shiftboard API
  - `cors` - Cross-origin resource sharing
  - `helmet` - Security headers
  - `morgan` - HTTP request logging
  - `jssha` 3.3+ - SHA-1 HMAC for Shiftboard authentication
  - `dotenv` - Environment configuration

### Frontend
- **Framework**: React 18.2+ with TypeScript 5.2+
- **Build Tool**: Vite 7.3+
- **UI Library**: Material-UI (@mui/material) 5.14+
- **Routing**: react-router-dom 6.16+
- **Date Handling**: date-fns 2.30+
- **Storage**: idb 7.1+ (IndexedDB wrapper)
- **HTTP Client**: axios 1.5+

### Development
- **Package Manager**: npm
- **Dev Server**: Vite dev server (port 5173)
- **API Server**: Express (port 3000)
- **Hot Reload**: Supported via Vite

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite)                       │   │
│  │  - Calendar View (Timeline)                         │   │
│  │  - Tabular View (Sortable Table)                    │   │
│  │  - Workgroup Filter                                 │   │
│  │  - Modals (Shift Detail, Person Detail)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            IndexedDB Cache                          │   │
│  │  - Shifts (with workgroup index)                    │   │
│  │  - Accounts                                         │   │
│  │  - Workgroups                                       │   │
│  │  - Metadata (last sync timestamp)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              REST Endpoints                         │   │
│  │  /api/shifts/whos-on                                │   │
│  │  /api/shifts/list                                   │   │
│  │  /api/accounts/*                                    │   │
│  │  /api/workgroups/*                                  │   │
│  │  /api/roles/*                                       │   │
│  │  /api/calendar/summary                              │   │
│  │  /api/system/health, /api/system/echo              │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Business Logic                                │   │
│  │  - Shift grouping algorithm                         │   │
│  │  - Pagination handling (up to 100 pages)            │   │
│  │  - HMAC authentication                              │   │
│  │  - Response normalization                           │   │
│  │  - Metrics collection                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ JSON-RPC/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Shiftboard API                            │
│  - shift.whosOn                                             │
│  - shift.list                                               │
│  - account.list                                             │
│  - workgroup.list                                           │
│  - system.echo                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initial Load**:
   - Client requests `/api/shifts/whos-on` with `forceSync=true`
   - API server calls Shiftboard `shift.whosOn` with `timeclock_status=true`, `extended=true`
   - Server handles pagination (fetches all pages up to 100 pages max)
   - Server groups shifts by common attributes (same shift, different people)
   - Response includes `{ result: { shifts, referenced_objects }, timing, metrics }`
   - Client stores in IndexedDB with timestamp
   - Client updates UI and sets `isFreshData=true`

2. **Workgroup Filtering**:
   - User selects workgroup from dropdown
   - Client requests `/api/shifts/whos-on?workgroup={id}` with `forceSync=true`
   - Server filters at API level (passes `select.workgroup` to Shiftboard)
   - Client updates context and refreshes both views
   - Selection persists during session but resets on page reload

3. **Auto/Manual Refresh**:
   - Manual: User clicks "Refresh Now" button → triggers `forceSync=true` fetch
   - Auto: Configurable interval (5/10/15 min) → triggers `forceSync=true` fetch
   - Both paths update last sync timestamp on success
   - On API failure, client falls back to cached data with `isFreshData=false`

4. **Offline Resilience**:
   - API fetch failure triggers automatic cache lookup
   - UI displays error indicator with last successful sync time
   - User can continue viewing cached data
   - Next successful fetch updates cache and clears error state

## Core Features Specification

### F1: Active Shifts Timeline View

**Description**: Vertical hourly timeline showing current and near-future shifts with visual overlap handling.

**Implementation Details**:
- **Component**: `ActiveShiftsView.tsx` (641 lines)
- **Dynamic Time Window**:
  - Default: Current hour ±1 hour
  - Expands to show all active shifts if any found
  - Optional `showFullDay` prop for 24-hour view (not currently exposed in UI)
- **Rendering Algorithm**:
  - Groups shifts into hourly columns
  - Detects overlapping shifts (>3 in same time slot)
  - Uses staggered positioning with 8px offsets
  - Calculates dynamic heights based on shift duration
- **Visual Elements**:
  - Red "current time" indicator line
  - Shift cards with name, subject, location
  - Person chips showing assigned people with clock-in status colors
  - Loading spinner in header during refresh
- **Edge Cases**:
  - **Too Many Shifts**: Shows warning when >25 grouped shifts detected
    - Message: "Too many shifts to display clearly"
    - "Show anyway" button to force render
    - Disables animations when force-showing
  - **No Active Shifts**: Displays message centered in viewport
  - **Invalid Dates**: Gracefully skips shifts with parsing errors

**User Interactions**:
- Click shift card → Opens Shift Detail Modal
- Animations on load (Fade/Grow transitions)

**State Management**:
- Props: `shifts`, `accounts`, `date`, `showFullDay`, `loading`
- Local state: `currentTime` (updates every second), `modalOpen`, `selectedShift`, `forceDisplay`, `animateShifts`

### F2: Tabular Shift View

**Description**: Sortable data table with columnar presentation of shift data.

**Implementation Details**:
- **Component**: `TabularShiftView.tsx` (606 lines)
- **Columns**:
  1. Start Time (sortable)
  2. End Time (sortable)
  3. Shift Name (sortable)
  4. Subject (sortable)
  5. Location (sortable)
  6. Assigned People (sortable by count)
  7. Status (sortable by clock-in ratio)
  8. Actions (Info icon)
- **Sorting Logic**:
  - Default: Start Time ascending
  - Click column header to toggle asc/desc
  - Visual indicator (arrow) shows current sort
  - Sorts applied to filtered dataset
- **Status Chip Logic**:
  - All clocked in: Green "All Clocked In" with CheckCircleIcon
  - None clocked in: Red "Not Clocked In" with CancelIcon
  - Partial: Orange "X/Y Clocked In" with PersonIcon
- **Person Chips**:
  - Each assigned person rendered as clickable chip
  - Green border/text if clocked in
  - Red border/text if not clocked in
  - Hover effect: elevation change
  - Click → Opens Person Detail Modal

**Refresh Indicators**:
- **Last Refresh Display**: "Last refreshed: {time}" or "Last API sync: {time}"
- **Success Indicator**: Green checkmark when API sync succeeds
- **Failure Indicator**: Red X when API fails (falls back to cache)
- **Loading States**:
  - Initial load: Full page spinner with "Loading shifts..."
  - Refresh: Table remains visible with smaller spinner in header

**Animations**:
- Fade-in for rows on load
- Grow transition on data update
- Optional animation toggle (currently enabled by default)

**User Interactions**:
- Click column header → Sort by that column
- Click person chip → Open Person Detail Modal
- Click Info icon or row → Open Shift Detail Modal
- Manual refresh button → Force API fetch

**Data Loading**:
- Initial load: `forceSync=true`
- Workgroup change: `forceSync=true`
- Auto-refresh: `forceSync=true`
- Uses `useOutletContext` for refresh coordination with layout

### F3: Workgroup Filter

**Description**: Global dropdown selector in app header for filtering shifts by workgroup.

**Implementation Details**:
- **Component**: `WorkgroupFilter.tsx` within `AppHeader.tsx`
- **Context**: `WorkgroupContext.tsx` (React Context API)
  - State: `selectedWorkgroup`, `workgroups`, `isLoading`
  - Methods: `setSelectedWorkgroup`, `setWorkgroups`
- **Options**:
  - "All workgroups" (value: `null`) - default
  - Alphabetical list of workgroup names from `referenced_objects.workgroup`
- **Behavior**:
  - Selection triggers `forceSync=true` API call with workgroup filter
  - Both views (calendar + table) update automatically
  - Context persists selection during session
  - Hard reload resets to "All workgroups"
- **Loading State**:
  - Reads cached workgroups from IndexedDB on mount
  - Updates from API response `referenced_objects.workgroup`
  - Shows loading indicator if workgroups not yet loaded

**Implementation Notes**:
- Filter applied at API level (`?workgroup={id}` query param)
- Server passes `select: { workgroup: id }` to Shiftboard
- Client-side filtering happens on cached data during offline fallback

### F4: Shift Detail Modal

**Description**: On-demand dialog showing comprehensive shift information.

**Implementation Details**:
- **Component**: `ShiftDetailModal.tsx`
- **Trigger**: Click shift card (calendar) or Info icon/row (table)
- **Content Sections**:
  1. **Header**: Shift name
  2. **Time**: Start - End (formatted as "MMM d, yyyy h:mm a")
  3. **Details**: Subject, Location
  4. **Assigned People**:
     - List of person names with status badges
     - Green "Clocked In" chip for clocked members
     - Red "Not Clocked In" chip for others
     - Clickable person names → Person Detail Modal
- **Actions**:
  - Close button (X icon top right)
  - ESC key support
  - Click outside modal to close
- **Accessibility**:
  - Focus trapped within modal
  - Tab order: close button → person links → close button
  - ARIA labels for screen readers

**Data Source**:
- Props: `shift` (Shift object), `accounts` (Account[]), `open`, `onClose`
- Looks up person names from `accounts` using `assignedPeople` IDs
- Falls back to ID if account not found

### F5: Person Detail Modal

**Description**: Contact information overlay with call/text actions.

**Implementation Details**:
- **Component**: `PersonDetailModal.tsx`
- **Trigger**: Click person chip in table or name in Shift Detail Modal
- **Content**:
  1. **Header**: Person's screen name or "{first_name} {last_name}"
  2. **Clock Status**: Badge showing "Clocked In" (green) or "Not Clocked In" (red)
  3. **Contact Info**:
     - Mobile phone number (formatted)
     - Call button → `tel:{phone}` link
     - Text button → `sms:{phone}` link
  4. **Additional Info**: External ID, Seniority Order (if present)
- **Phone Number Formatting**:
  - Displays as-is from Shiftboard (typically "(XXX) XXX-XXXX")
  - No client-side reformatting applied
- **Actions**:
  - "Call" button with phone icon
  - "Text" button with message icon
  - Close button
  - ESC key / click outside to close

**Security**:
- Phone numbers only visible in modal (not in main table view)
- Requires intentional user action to view contact info
- No export or copy functionality (reliance on OS clipboard)

### F6: Refresh Controls

**Description**: Manual and automatic data refresh mechanisms with visibility into sync status.

**Implementation Details**:
- **Location**: Sidebar component
- **Manual Refresh**:
  - "Refresh Now" button
  - Always available
  - Forces API fetch (`forceSync=true`)
  - Shows loading spinner during fetch
  - Updates "Last refreshed" timestamp on success
- **Auto-Refresh**:
  - Dropdown selector: Off / 5 min / 10 min / 15 min
  - Implemented via `setInterval` in `AppLayout.tsx`
  - Changing interval triggers immediate refresh
  - Timer resets on interval change
  - Context propagates refresh trigger to child views
- **Refresh Timestamp**:
  - Format: "Last refreshed: 3 minutes ago" (relative)
  - OR: "Last API sync: Feb 17, 2026 2:30 PM" (absolute)
  - Stored in IndexedDB metadata store
  - Updated only on successful API responses
  - Remains unchanged when falling back to cache

**Coordination**:
- `AppLayout` manages `refreshTimestamp` state
- `Outlet` context passes `{ refreshInterval, refreshTimestamp, triggerRefresh }` to routes
- Child views listen to `refreshTimestamp` changes via `useEffect`
- Both Calendar and Tabular views respond to refresh events

### F7: Local Cache (IndexedDB)

**Description**: Browser-based persistent storage for offline resilience.

**Implementation Details**:
- **Service**: `db.service.ts` (188 lines)
- **Library**: `idb` 7.1+ (Promise-based IndexedDB wrapper)
- **Database**: `hlsr-shifts-db` version 1
- **Object Stores**:
  1. **shifts**:
     - Key path: `id`
     - Index: `workgroup` (for efficient filtering)
     - Stores complete Shift objects with backend-added fields
  2. **accounts**:
     - Key path: `id`
     - Stores Account objects with contact info
  3. **workgroups**:
     - Key path: `id`
     - Stores Workgroup objects (id, name)
  4. **metadata**:
     - Key path: `key`
     - Stores `{ key: 'lastSync', timestamp: Date }`

**Operations**:
- `storeShifts(shifts: Shift[])`: Upsert shifts (uses `put` for update-or-insert)
- `getShiftsByWorkgroup(workgroupId: string | null)`: Retrieve filtered or all shifts
- `storeAccounts(accounts: Account[])`: Upsert accounts
- `getAllAccounts()`: Retrieve all accounts
- `storeWorkgroups(workgroups: Workgroup[])`: Upsert workgroups
- `getAllWorkgroups()`: Retrieve all workgroups
- `updateLastSync()`: Set lastSync timestamp to current time
- `getLastSync()`: Retrieve lastSync as Date object
- `getLastSyncFormatted()`: Retrieve formatted timestamp string

**Cache Strategy**:
- **Write**: After every successful API response
- **Read**: Only when API fetch fails OR cache <1 minute old (currently always forced)
- **Expiration**: No automatic expiration; relies on forceSync flag
- **Size Limits**: Browser-dependent (typically 50MB+ available)

**Fallback Behavior**:
- API failure → Automatic cache lookup
- Empty cache + API failure → Show error message
- Stale cache warning: "Last API sync: 15 minutes ago" with `isFreshData=false` flag

### F8: Error Handling

**Description**: Global and component-level error management.

**Implementation Details**:
- **Error Boundary**: `ErrorBoundary.tsx` (React class component)
  - Wraps entire app tree
  - Catches uncaught render errors
  - Displays MUI Alert with error message
  - Logs to console for debugging
- **API Errors**:
  - Server returns JSON: `{ error: "message" }` with HTTP status code
  - Client displays inline error: "Failed to load shifts"
  - Auto-retry via cache fallback
  - No exponential backoff (immediate cache check)
- **Loading States**:
  - Initial load: Full-page spinner
  - Refresh: Header spinner with existing data visible
  - Differentiated in state: `loadingType: 'initial' | 'refresh'`
- **Edge Cases**:
  - Empty dataset: "No shifts found for this workgroup"
  - Network timeout: 60s timeout → cache fallback
  - Invalid dates: Skip shift with console warning
  - Pagination limit: Stops at 100 pages with console warning

### F9: System Endpoints

**Description**: Diagnostic and health check endpoints for infrastructure monitoring.

**Implementation Details**:
- **GET /api/system/health**:
  - Purpose: Azure App Service health probe
  - Response: `{ status: "healthy", timestamp: ISO string, uptime: seconds }`
  - Always returns 200 OK (no dependency checks)
  - Used by load balancers for availability monitoring
- **POST /api/system/echo**:
  - Purpose: Connectivity test to Shiftboard
  - Body: Arbitrary JSON payload
  - Behavior: Proxies to Shiftboard `system.echo` method
  - Response: Echo of payload with round-trip metrics
  - Used for diagnosing authentication and network issues

## API Contract Specification

### Base Configuration
- **Base URL (dev)**: `http://localhost:3000/api`
- **Base URL (prod)**: `https://{app-name}.azurewebsites.net/api`
- **Content-Type**: `application/json`
- **Timeout**: 60 seconds
- **CORS**: Origins configurable via `ALLOWED_ORIGINS` env var

### Endpoints

#### GET /api/shifts/whos-on

**Purpose**: Retrieve current shifts with assigned people and clock-in status.

**Query Parameters**:
- `workgroup` (string, optional): Workgroup ID to filter shifts
- `batch` (number, optional): Page size (default: 100, max: 100)
- `start` (number, optional): Starting index for pagination (default: 0)

**Request Example**:
```
GET /api/shifts/whos-on?workgroup=12345&batch=100
```

**Response Schema**:
```json
{
  "result": {
    "shifts": [
      {
        "id": "shift-id",
        "name": "Shift Name",
        "subject": "Subject",
        "location": "Location",
        "workgroup": "workgroup-id",
        "local_start_date": "2026-02-17T08:00:00",
        "local_end_date": "2026-02-17T12:00:00",
        "covering_member": "member-id",
        "clocked_in": true,
        "assignedPeople": ["member-id-1", "member-id-2"],
        "assignedPersonNames": ["John Doe", "Jane Smith"],
        "clockStatuses": [true, false],
        // ... all other Shiftboard shift fields
      }
    ],
    "referenced_objects": {
      "account": [
        {
          "id": "member-id",
          "first_name": "John",
          "last_name": "Doe",
          "screen_name": "jdoe",
          "mobile_phone": "(555) 123-4567",
          "clocked_in": true
        }
      ],
      "workgroup": [
        {
          "id": "workgroup-id",
          "name": "Workgroup Name"
        }
      ]
    },
    "metrics": {
      "original_shift_count": 150,
      "grouped_shift_count": 75,
      "clocked_in_count": 45,
      "fetch_duration_ms": 850,
      "grouping_duration_ms": 12
    },
    "page": {
      "start": 0,
      "batch": 100,
      "total": 150,
      "next": null
    }
  },
  "timing": {
    "start": "2026-02-17T14:30:00.000Z",
    "end": "2026-02-17T14:30:01.250Z",
    "duration_ms": 1250
  }
}
```

**Backend Processing**:
1. Calls Shiftboard `shift.whosOn` with `timeclock_status: true`, `extended: true`
2. Handles pagination (fetches all pages up to 100)
3. Applies `groupShiftsByAttributes` algorithm:
   - Groups by: name, start, end, workgroup, subject, location
   - Aggregates assigned people into arrays
   - Maintains clock-in status per person
4. Attaches metrics and timing metadata
5. Returns normalized response

**Error Responses**:
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Shiftboard authentication failed
- `500 Internal Server Error`: Shiftboard API error or grouping failure

#### GET /api/shifts/list

**Purpose**: Pass-through to Shiftboard `shift.list` (unprocessed shifts).

**Query Parameters**:
- `batch` (number): Page size
- `start` (number): Starting index

**Response**: Raw Shiftboard API response (no grouping applied).

#### GET /api/accounts/list

**Purpose**: Paginated list of accounts.

**Query Parameters**:
- `batch` (number): Page size
- `start` (number): Starting index

**Response**: Array of Account objects with pagination metadata.

#### GET /api/accounts/self

**Purpose**: Get service account identity (for diagnostics).

**Response**: Account object for service credentials.

#### GET /api/accounts/workgroup/:workgroupId

**Purpose**: Filter accounts by workgroup.

**Response**: Array of Account objects.

#### GET /api/workgroups/list

**Purpose**: All workgroups with optional extended fields.

**Query Parameters**:
- `extended` (boolean): Include additional fields

**Response**: Array of Workgroup objects.

#### GET /api/workgroups/:workgroupId/roles

**Purpose**: Roles within a workgroup.

**Response**: Array of Role objects.

#### GET /api/roles/:roleId

**Purpose**: Single role by ID.

**Response**: Role object.

#### GET /api/roles/list

**Purpose**: All roles.

**Response**: Array of Role objects.

#### GET /api/calendar/summary

**Purpose**: Aggregated statistics (currently stub implementation).

**Response**: `{ summary: "Not yet implemented" }`

#### GET /api/system/health

**Purpose**: Health check for monitoring.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-17T14:30:00.000Z",
  "uptime": 3600.5
}
```

#### POST /api/system/echo

**Purpose**: Diagnostic proxy to Shiftboard echo.

**Request Body**: Any JSON payload.

**Response**: Echoed payload with Shiftboard round-trip metrics.

## Key Algorithms

### Shift Grouping Algorithm

**File**: `src/utils/shift.utils.js`

**Purpose**: Combine shifts with identical attributes but different assigned people into single records.

**Input**: Array of raw Shift objects from Shiftboard

**Output**: Array of grouped Shift objects with added fields:
- `assignedPeople: string[]` - Array of member IDs
- `assignedPersonNames: string[]` - Array of readable names
- `clockStatuses: boolean[]` - Parallel array of clock-in states

**Logic**:
```
1. Initialize empty shiftGroups = {}

2. For each shift in input:
   a. Construct shiftKey = "${name}-${start}-${end}-${workgroup}-${subject}-${location}"
   b. If shiftKey not in shiftGroups:
      - Create new group with current shift data
      - Initialize assignedPeople = [covering_member]
      - Initialize clockStatuses = [clocked_in]
      - Initialize assignedPersonNames = [resolved name from accounts]
   c. Else (shiftKey exists):
      - If covering_member not in group.assignedPeople:
        - Append covering_member to group.assignedPeople
        - Append clocked_in to group.clockStatuses
        - Append resolved name to group.assignedPersonNames

3. Return Object.values(shiftGroups)
```

**Name Resolution**:
- Looks up `covering_member` ID in accounts array
- Prefers `screen_name` if present
- Falls back to `first_name + last_name`
- Uses "Unassigned" if member not found

**Edge Cases**:
- Invalid shift objects skipped with console warning
- Missing required fields use defaults (empty string, current date)
- Undefined `clocked_in` coerced to `false` (explicit boolean)
- Duplicate member IDs in same group ignored (no double-counting)

### Pagination Handler

**File**: `src/utils/pagination.js` (implied from service code)

**Purpose**: Fetch all pages from Shiftboard API automatically.

**Logic**:
```
1. Make initial request with batch=100, start=0
2. Check response.result.page.next
3. While next !== null AND pageCount < 100:
   a. Request next page with start=next
   b. Merge results into accumulated array
   c. Increment pageCount
   d. Check for page.next in new response
4. If pageCount >= 100, log warning
5. Return merged results
```

**Safety**:
- Hard limit at 100 pages (~10,000 shifts max)
- Prevents infinite loops from malformed API responses
- Logs warnings when approaching limits

## Enhancement Opportunities

### High Priority

1. **Offline-First PWA**
   - **Current State**: Cache fallback only on API failure
   - **Enhancement**: Service worker with cache-first strategy
   - **Benefits**: Faster loads, true offline mode, install prompt
   - **Effort**: Medium (1-2 days)

2. **Role-Based Access Control**
   - **Current State**: No authentication; assumes single user/organization
   - **Enhancement**: User login with role-based permissions
   - **Roles**: Shift Captain (full access), Support Desk (read-only), Leadership (reports)
   - **Benefits**: Multi-tenant support, audit trails, security
   - **Effort**: High (1-2 weeks)

3. **Push Notifications**
   - **Current State**: Manual refresh required to see changes
   - **Enhancement**: WebSocket or Browser Push for real-time updates
   - **Triggers**: New shift assigned, clock-in status change, coverage gaps
   - **Benefits**: Proactive alerting, reduced manual refreshes
   - **Effort**: Medium (2-3 days)

4. **Historical Reporting**
   - **Current State**: Only current/future shifts visible
   - **Enhancement**: Date range selector, export to CSV/PDF
   - **Metrics**: Coverage %, SLA compliance, no-show rates
   - **Benefits**: Operational insights, trend analysis, compliance reporting
   - **Effort**: Medium-High (1 week)

5. **Mobile Native App**
   - **Current State**: Responsive web only (min 1024px)
   - **Enhancement**: React Native or Flutter app for iOS/Android
   - **Benefits**: Better mobile UX, true offline sync, push notifications
   - **Effort**: Very High (4-6 weeks)

### Medium Priority

6. **Advanced Filtering**
   - **Current State**: Workgroup filter only
   - **Enhancement**: Multi-select filters (location, role, clock-in status)
   - **UI**: Filter panel with chips showing active filters
   - **Effort**: Low (1-2 days)

7. **Search Functionality**
   - **Current State**: No search
   - **Enhancement**: Fuzzy search by person name, shift name, location
   - **Benefits**: Faster access to specific shifts/people
   - **Effort**: Low (1 day)

8. **Favorites/Bookmarks**
   - **Current State**: No personalization
   - **Enhancement**: Star favorite workgroups, save filter presets
   - **Storage**: LocalStorage or user profile in backend
   - **Effort**: Low (1 day)

9. **Shift Alerts**
   - **Current State**: No automated alerts
   - **Enhancement**: Configure alerts for understaffed shifts
   - **Delivery**: Email or SMS via Twilio/SendGrid
   - **Effort**: Medium (2-3 days)

10. **Performance Optimization**
    - **Current State**: Re-renders entire table on refresh
    - **Enhancement**: Virtualized table for large datasets (react-window)
    - **Benefits**: Smooth scrolling with 1000+ shifts
    - **Effort**: Medium (2-3 days)

### Low Priority (Polish)

11. **Dark Mode**
    - **Enhancement**: MUI theme toggle for dark/light
    - **Effort**: Low (few hours)

12. **Export Functionality**
    - **Enhancement**: Export current view to CSV, JSON, or print
    - **Effort**: Low (1 day)

13. **Keyboard Shortcuts**
    - **Enhancement**: Hotkeys for refresh (R), filter (F), search (/)
    - **Effort**: Low (few hours)

14. **Accessibility Improvements**
    - **Current State**: Basic WCAG AA compliance
    - **Enhancement**: Full WCAG 2.1 AAA, screen reader optimization
    - **Effort**: Medium (2-3 days)

15. **Analytics Integration**
    - **Enhancement**: Google Analytics or Application Insights
    - **Metrics**: Page views, feature usage, error rates
    - **Effort**: Low (few hours)

## Testing Strategy

### Current State
- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Manual Testing**: Primary validation method

### Recommended Testing

#### Unit Tests (Jest + React Testing Library)
- **API Service**: Mock axios, test cache fallback logic
- **DB Service**: Mock idb, test CRUD operations
- **Shift Utilities**: Test grouping algorithm edge cases
- **Components**: Test rendering, user interactions, state changes

#### Integration Tests (Vitest + MSW)
- Mock Shiftboard API with realistic data
- Test full data flow: API → Cache → UI
- Test refresh mechanisms
- Test workgroup filtering end-to-end

#### E2E Tests (Playwright)
- Critical user flows:
  1. Load app → View calendar → Click shift → See modal
  2. Filter by workgroup → Verify filtered data → Clear filter
  3. Switch to table view → Sort column → Click person chip
  4. Manual refresh → Verify timestamp update
  5. Simulate API failure → Verify cache fallback → Verify error indicator

#### Performance Tests
- Load 1000+ shifts → Measure render time
- Rapid filter changes → Check for memory leaks
- Auto-refresh stability over 1 hour

## Deployment

### Current Deployment (Azure App Service)

1. **Build**:
   ```bash
   npm install
   npm run build:client  # Builds client to client/dist
   ```

2. **Production Config**:
   - `NODE_ENV=production`
   - Express serves static files from `client/dist`
   - Catch-all route returns `index.html` for client routing

3. **Environment Variables**:
   - `SHIFTBOARD_ACCESS_KEY_ID`
   - `SHIFTBOARD_SECRET_KEY`
   - `SHIFTBOARD_HOST`
   - `SHIFTBOARD_PATH`
   - `ALLOWED_ORIGINS` (comma-separated)
   - `PORT` (default: 3000)

4. **Azure Setup**:
   - App Service Plan: Basic B1 or higher
   - Node version: LTS (18.x or 20.x)
   - Startup command: `node src/index.js`
   - Health check: `/api/system/health`

### Alternative Deployments

#### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:client
EXPOSE 3000
CMD ["node", "src/index.js"]
```

#### Static + Serverless
- Frontend: Vercel/Netlify (Vite build)
- Backend: Azure Functions or AWS Lambda (Express via adapter)
- Cache: Client-only IndexedDB

## Security Considerations

### Current Security
- ✅ Helmet.js for security headers
- ✅ CORS configured with allowed origins
- ✅ Credentials isolated to server
- ✅ HTTPS enforced in production (Azure)
- ✅ No client-side credential storage
- ✅ Phone numbers hidden until modal opened

### Recommended Enhancements
- ❌ **Authentication**: Add user login with JWT/OAuth
- ❌ **Authorization**: Implement role-based access control
- ❌ **Rate Limiting**: Add express-rate-limit middleware
- ❌ **Input Validation**: Use Joi or Zod for request validation
- ❌ **Secrets Management**: Migrate to Azure Key Vault
- ❌ **Audit Logging**: Log sensitive operations (contact info access)
- ❌ **Content Security Policy**: Add strict CSP headers
- ❌ **CSRF Protection**: Add tokens for future write operations

## Rebuild Guide

### Prerequisites
1. Node.js 18+ LTS
2. npm 9+
3. Shiftboard API credentials (access key + secret)
4. Modern browser with IndexedDB support

### Step 1: Initialize Project
```bash
mkdir shifts-dashboard-v2
cd shifts-dashboard-v2
npm init -y
```

### Step 2: Backend Setup
```bash
npm install express cors helmet morgan axios jssha dotenv

# Create directory structure
mkdir -p src/{config,controllers,routes,services,middleware,utils}
```

**Key Files**:
- `src/index.js` - Express app setup
- `src/config/api.config.js` - Shiftboard credentials
- `src/services/shift.service.js` - Shift logic + grouping
- `src/utils/shift.utils.js` - Grouping algorithm
- `src/utils/shiftboard-auth.js` - HMAC signature
- `src/utils/pagination.js` - Multi-page fetching
- `src/routes/shift.routes.js` - Shift endpoints
- `src/middleware/error.middleware.js` - Error handler

### Step 3: Frontend Setup
```bash
cd client
npm create vite@latest . -- --template react-ts
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install react-router-dom axios date-fns idb
```

**Key Files**:
- `src/App.tsx` - Router setup
- `src/services/api.service.ts` - API client
- `src/services/db.service.ts` - IndexedDB wrapper
- `src/contexts/WorkgroupContext.tsx` - Global state
- `src/components/Layout/AppLayout.tsx` - Layout + refresh
- `src/components/Calendar/ActiveShiftsView.tsx` - Timeline
- `src/components/Calendar/TabularShiftView.tsx` - Table
- `src/types/shift.types.ts` - TypeScript interfaces

### Step 4: Core Algorithm Implementation
Implement `groupShiftsByAttributes` per algorithm spec (see above).

### Step 5: Cache Layer
Implement IndexedDB service with 4 stores: shifts, accounts, workgroups, metadata.

### Step 6: UI Components
Build components in this order:
1. AppLayout (shell)
2. WorkgroupFilter (context + dropdown)
3. TabularShiftView (simpler than calendar)
4. ActiveShiftsView (complex layout logic)
5. Modals (ShiftDetail, PersonDetail)
6. ErrorBoundary

### Step 7: Integration
- Wire up refresh mechanisms
- Test workgroup filtering
- Verify cache fallback
- Test all user flows

### Step 8: Testing
- Add unit tests for utilities
- Add integration tests for API service
- Manual QA of all features

### Step 9: Deployment
- Configure environment variables
- Build production bundle
- Deploy to Azure App Service
- Configure health check endpoint
- Verify HTTPS and CORS

## Constitution Compliance

This specification is derived from the project constitution (v1.0.0, ratified 2026-02-17). All principles are reflected in the implementation:

- **I. API-First Architecture**: ✅ Express REST API proxies Shiftboard
- **II. Resilient Data Access**: ✅ IndexedDB cache with automatic fallback
- **III. Real-Time Operations**: ✅ Manual + auto-refresh with freshness indicators
- **IV. User-Centered Design**: ✅ Multiple views, WCAG AA, responsive
- **V. Security & Compliance**: ✅ PII protection, HTTPS, credential isolation
- **VI. Observable Systems**: ✅ Metrics, health checks, structured logging

Any future enhancements must comply with these principles or propose constitutional amendments.

---

**Document Status**: Complete  
**Next Steps**: Use this specification to create feature branches and implement enhancements  
**Related**: See `api-contracts.md` for detailed API schemas, `enhancements.md` for prioritized improvements
