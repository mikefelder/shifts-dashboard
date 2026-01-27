# Technical Specification

## 1. Architecture Overview
- **Client Tier:** SPA (currently React + Vite + MUI). Replacement stack must supply equivalent routing, context/state management, IndexedDB wrapper, and component library.
- **API Tier:** Node/Express wrapper around Shiftboard JSON-RPC APIs. Reimplementation may choose any server technology but must expose identical REST contract.
- **External Dependency:** Shiftboard API (JSON-RPC) requiring HMAC signature.
- **Storage:** Browser IndexedDB for cache; optional server-side cache (memory/Redis) can be substituted if future stack demands.

### 1.1 Component Diagram (Conceptual)
```
Client UI  <->  REST API  <->  Shiftboard JSON-RPC
      \_____ IndexedDB cache _____/
```

## 2. Data Flow
1. Client requests `/api/shifts/whos-on` with optional `workgroup` filter and `batch` size.
2. API server translates to Shiftboard `shift.whosOn` call with `timeclock_status=true`, `extended=true`, handles pagination.
3. API server groups shifts via deterministic key and attaches account/workgroup references.
4. Response returned to client with `result` payload, metrics, and timing.
5. Client stores shifts/accounts/workgroups in IndexedDB, updates context/state, and tags the response with `isFreshData=true`.
6. Subsequent requests always attempt a live API fetch; if the call fails the client serves cached data with `isFreshData=false`.

## 3. Server-Side Design
### 3.1 Routing & Middleware
- Middleware: `helmet` (security headers), `cors`, `express.json`, `morgan`.
- Routes mounted under `/api`: accounts, shifts, workgroups, roles, calendar, system.
- Error middleware centralizes error responses with structure `{ error: message }`.

### 3.2 Shift Service Details
- `shift.service.js` orchestrates `shiftList` and `shiftWhosOn`.
- Utilizes `shiftboard-auth.js` to sign requests (SHA-1 HMAC) and `fetchRemainingPages` helper to iterate pages until completion or 100 page guard.
- Grouping performed by `groupShiftsByAttributes` (based on start/end/time/workgroup/subject/location) ensuring deduplicated assigned people.
- Metrics instrumentation records fetch/grouping durations and counts.

### 3.3 Configuration
- `src/config/api.config.js` (not included above but assumed) holds Shiftboard credentials.
- `SHIFTBOARD_ACCESS_KEY_ID`, `SHIFTBOARD_SECRET_KEY`, `SHIFTBOARD_HOST`, `SHIFTBOARD_PATH` stored in environment or Key Vault.
- Server port default 3000; CORS origin `http://localhost:5173` during development.

### 3.4 Deployment Considerations
- Production build serves static client from `client/dist` via Express when `NODE_ENV=production`.
- Azure App Service/IIS `web.config` already present for Windows hosting.
- Logging: `morgan('dev')` plus console statements; new stack should provide structured logging for fetch times and errors.

## 4. Client-Side Design
### 4.1 Routing & Layout
- `AppLayout` hosts `AppHeader`, `Sidebar`, and `<Outlet>` with refresh context.
- Routes: `/` => `CalendarPage` (ActiveShiftsView + DayView), `/tabular-view` => TabularShiftView, fallback => `/`.

### 4.2 State Management
- `WorkgroupContext` stores selected workgroup, list, and loading state.
- `AppLayout` manages refresh interval + timestamps via `useState`/`useEffect`; passes `triggerRefresh` through `Outlet` context.
- Views consume `useOutletContext` to know when to reload.

### 4.3 Data Services
- `api.service.ts` handles Axios calls with 60s timeout, `forceSync` flag, and fallback to IndexedDB.
- `db.service.ts` wraps IndexedDB via `idb` library: stores shifts/accounts/workgroups, supports workgroup index, tracks last sync timestamp, provides formatted timestamp string.

### 4.4 UI Components
- **ActiveShiftsView.tsx**: complex layout logic for vertical timeline, dynamic time window, overlapping shift placement, "Too Many Shifts" guard.
- **TabularShiftView.tsx**: data table with sorting, manual refresh, status chips, modals, animation toggles, `apiSyncSuccess` indicator.
- **WorkgroupFilter.tsx**: styled select integrated into header.
- **Modals**: `ShiftDetailModal`, `PersonDetailModal` for detailed info.
- **Sidebar**: navigation + auto-refresh controls + manual refresh button.

### 4.5 Styling & Theme
- Material UI theme defined in `client/src/theme/theme.ts` (not shown) controlling palette (navy primary, etc.).
- CSS Baseline used for consistent typography; instructions for new stack: maintain consistent look or document deltas.

## 5. Data Contracts
### 5.1 Shift Object (Post-Grouping)
```
{
  id: string,
  name: string,
  subject: string,
  location: string,
  workgroup: string,
  local_start_date: ISO string,
  local_end_date: ISO string,
  covering_member: string,
  clocked_in: boolean,
  assignedPeople: string[],
  assignedPersonNames: string[],
  clockStatuses: boolean[],
  ...Shiftboard native fields
}
```

### 5.2 Account Object
```
{
  id: string,
  external_id: string,
  first_name: string,
  last_name: string,
  screen_name: string,
  mobile_phone: string,
  seniority_order: string,
  clocked_in: boolean,
  ...additional raw fields
}
```

### 5.3 Workgroup Object
```
{ id: string, name: string }
```

### 5.4 API Response Wrapper
```
{
  result: {
    shifts: Shift[],
    referenced_objects: {
      account: Account[],
      workgroup: Workgroup[]
    },
    metrics?: {
      original_shift_count: number,
      grouped_shift_count: number,
      clocked_in_count: number,
      fetch_time_ms: number,
      grouping_time_ms: number,
      total_time_ms: number
    },
    page?: { next?: { start: number, batch: number }, this?: { start: number, batch: number } }
  },
  timing?: { duration_ms: number, timestamp: ISO string },
  error?: string
}
```

## 6. Non-Functional Requirements
- **Performance:** End-to-end fetch/render under 6s for 10K shifts; DOM virtualization optional but recommended if dataset grows.
- **Security:** Server must not expose Shiftboard secrets; enforce HTTPS; set HSTS via reverse proxy or middleware.
- **Monitoring:** Log shift fetch durations, grouped counts, errors; expose GET `/api/system/health` for probes and retain POST `/api/system/echo` for diagnostic round-trips.
- **Testing:** Provide API integration tests (mock Shiftboard) + client unit tests for grouping/formatting logic.
- **Accessibility:** Maintain keyboard navigation, focus management, and color contrast.

## 7. Migration Guidance
- Preserve REST surface area and response format to keep clients interchangeable.
- Document configuration (environment variables, Key Vault secrets, deployment scripts) in `DEPLOY.md` and `AZURE_DEPLOYMENT.md`.
- Validate new implementation via regression suite comparing sample Shiftboard payloads to grouped output.

---
This specification, combined with the PRD and Functional Specification, should enable teams to rebuild the application with any modern stack while maintaining identical capabilities and integrations.
