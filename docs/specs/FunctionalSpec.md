# Functional Specification

## 1. Scope
Describes end-to-end behaviors required to recreate the HLSR Shiftboard Reporting experience independent of the current React/Express stack. All requirements assume Shiftboard remains the system of record for shifts, accounts, and workgroups.

## 2. System Modules
1. **API Proxy Layer**
   - Exposes REST endpoints under `/api/*` to the client.
   - Aggregates Shiftboard JSON-RPC responses, handles pagination, and normalizes data.
   - Adds timing metadata and error normalization.
2. **Client Application**
   - Browser-based SPA consuming the API proxy.
   - Provides calendar and table presentations with modals, filters, and refresh controls.
3. **Local Persistence**
   - Browser storage (IndexedDB equivalent) storing shifts, accounts, workgroups, and last-sync metadata for offline resilience.

## 3. Detailed Requirements
### 3.1 Authentication & Configuration
- Server authenticates to Shiftboard using access key and secret; clients never handle credentials.
- Environment variables must support deployments (access key, secret, API host/path, allowed origins, port).

### 3.2 API Endpoints
| Endpoint | Method | Behavior |
| --- | --- | --- |
| `/api/shifts/whos-on` | GET | Accepts `workgroup`, `batch`, `start` query params. Always requests `timeclock_status=true` and `extended=true` from Shiftboard. Fetches all pages, groups shifts, returns `{ result: { shifts, referenced_objects, metrics }, timing }`. |
| `/api/shifts/list` | GET | Pass-through list endpoint with pagination support. |
| `/api/accounts/list` | GET | Supports `batch`, `start`; returns accounts with pagination metadata. |
| `/api/accounts/self` | GET | Returns credentials for service identity (primarily for diagnostics). |
| `/api/accounts/workgroup/:id` | GET | Filters accounts by workgroup. |
| `/api/workgroups/list` | GET | Returns all workgroups with optional `extended`. |
| `/api/workgroups/:id/roles` | GET | Returns workgroup roles. |
| `/api/roles/:id` and `/api/roles/list` | GET | Role lookups. |
| `/api/calendar/summary` | GET | Aggregated stats (currently stub). |
| `/api/system/echo` | GET | Health-check endpoint reflecting provided payload. |
- All endpoints must return `200` success or JSON error object with `error` string plus HTTP status code (400/401/403/404/500).

### 3.3 Shift Grouping Logic
- Group shifts that share `local_start_date`, `local_end_date`, `name`, `subject`, `location`, `workgroup`.
- Each group contains:
  - `assignedPeople`: array of covering member IDs (no duplicates).
  - `assignedPersonNames`: friendly names derived from referenced accounts.
  - `clockStatuses`: boolean per assigned person.
- Server metrics capture `original_shift_count`, `grouped_shift_count`, `clocked_in_count`, and timing fields.

### 3.4 Client Views
#### 3.4.1 Global Layout
- Fixed header with title and Workgroup filter.
- Permanent sidebar with navigation (Current Shifts, Tabular View) and refresh controls.
- Main outlet hosting routed pages (`/` -> calendar page, `/tabular-view` -> table view). Unknown routes redirect to `/`.

#### 3.4.2 Calendar Page (Active Shifts View)
- Displays vertical timeline of current day.
- Time window auto-adjusts to show active shifts ±1 hour; "full day" mode optional.
- Shifts rendered as positioned cards with minimal overlap using custom algorithm; cards show shift name, subject, location, assigned people.
- If >25 grouped shifts, show "Too many shifts" message with option to "Show anyway".
- Current time indicator line across grid.
- Clicking card opens Shift Detail Modal.
- Loading spinner appears in header when refresh in progress.

#### 3.4.3 Tabular Shift View
- Sortable columns: start/end time, shift name, subject, location, assigned people, status, actions.
- Default sort by start time ascending; clicking headers toggles sort order.
- Each row shows assigned people as chips; chip styling reflects clock-in state.
- Status chip shows `All Clocked In`, `Not Clocked In`, or `X/Y Clocked In`.
- Manual refresh button triggers fetch (wired to sidebar control); auto-refresh uses context.
- Timestamp display indicates last refresh and whether API sync succeeded.
- Row click opens Shift Detail Modal; Info icon duplicates action.
- Person chip click opens Person Detail Modal with phone call/text actions.

### 3.5 Filtering & Context
- Workgroup filter options include "All Workgroups" + alphabetical list from API/cache.
- Selected workgroup stored in context and applied to API calls and cached queries.
- When no workgroup selected, show entire dataset (or 50 limit fallback message).

### 3.6 Refresh Mechanics
- Auto-refresh interval configurable (off/5/10/15 minutes). Changing interval triggers immediate refresh.
- Manual "Refresh Now" button available when auto-refresh disabled or to override schedule.
- Refresh operations differentiate between `loadingType` = initial vs refresh for UI states.
- Last sync timestamp derived from local metadata; label distinguishes API vs cache usage.

### 3.7 Local Cache Requirements
- Stores entire shift dataset plus referenced accounts/workgroups after successful API fetch.
- Cache used when last sync < 60 seconds or API call fails.
- Provide boolean flag `isFreshData` in API responses to inform UI badges/telemetry.
- On workgroup filter, client either filters cached data or requests server (if client caching only). Current implementation filters client-side; new stack may choose equivalent approach but must meet UX requirements.

### 3.8 Error Handling
- Client shows inline error state (centered message) when API fails and cache unavailable.
- ErrorBoundary wraps top-level React tree; replacement stack must provide equivalent global error handling.
- When too many shifts to render, show instructive message encouraging filters.
- API errors logged server-side with stack traces in development; sanitized in production.

### 3.9 Accessibility & UX
- Keyboard navigation for tabs, table rows, and modals.
- Color contrast meeting WCAG AA (sidebar, header, chips).
- Modals trap focus and provide close buttons.
- Responsive design for widescreen operations laptops and tablets down to 1024px.

### 3.10 Internationalization & Time Zones
- All timestamps displayed in Central Time (America/Chicago). Server ensures `local_*` fields consumed as-is.
- Date formatting uses `MMM d, yyyy` and `h:mm a` patterns; new stack must replicate for operator familiarity.

## 4. User Flows
1. **View Current Shifts**
   1. User lands on `/` route; Workgroup filter defaults to "All".
   2. Client requests `/api/shifts/whos-on` (force sync true on first load).
   3. Data cached and context updated; Active Shifts view renders timeline; Tabular view accessible via tab or route.
2. **Filter by Workgroup**
   1. User selects workgroup in header.
   2. Client fetches filtered data (force sync) and updates context.
   3. Both views update; Tabular view counts filtered set.
3. **Investigate Shift Details**
   1. User clicks shift card/table row.
   2. Shift Detail Modal opens showing time, location, assigned people list with clock badges.
   3. User closes modal; underlying view remains unchanged.
4. **Contact Volunteer**
   1. User clicks person chip in table.
   2. Person Detail Modal opens with formatted phone numbers and call/text buttons.
   3. Buttons trigger tel/sms links.
5. **Manage Refresh**
   1. User adjusts auto-refresh interval via sidebar select.
   2. New interval saved; immediate refresh triggered.
   3. Timestamp text updates to "Last refreshed" message and API sync badge.

## 5. Non-Functional Requirements (Functional Impact)
- **Performance:** Calendar view must render <=25 shifts with animations < 500ms; degrade gracefully beyond threshold.
- **Reliability:** Cache fallback path triggered automatically when API fails; UI should disclose stale data state.
- **Scalability:** Pagination loop handles up to 100 pages (~12K shifts) with guards to prevent runaway loops.

## 6. Open Questions
1. Should the cache retention window be configurable beyond 60 seconds?
2. How should historical reporting be accessed (separate screen vs export)?
3. Do we need role-based permissions differentiating leadership vs support desk?

This document should be used alongside the PRD and Technical Specification to guide reimplementation efforts.
