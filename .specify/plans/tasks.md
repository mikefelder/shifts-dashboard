---
description: 'Task list for Shift Dashboard Rebuild'
---

# Tasks: Shift Dashboard Rebuild

**Input**: Design documents from `.specify/analysis/` and `.specify/plans/`
**Prerequisites**: plan.md (rebuild-plan.md), spec.md (codebase-spec.md), contracts (api-contracts.md)

**Tests**: Tests are OPTIONAL and are NOT included in this task breakdown unless explicitly requested later.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Web app structure**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure, configure ESLint/Prettier, Husky pre-commit hooks, TypeScript strict mode
- [x] T002 Initialize backend with npm, install Express/Axios/Helmet/CORS/Winston/Zod, configure tsconfig.json and jest.config.js
- [x] T003 Initialize frontend with Vite React-TS, install MUI/router/axios/idb/date-fns, configure vitest and Playwright
- [x] T004 [P] Create backend/Dockerfile and frontend/Dockerfile with multi-stage builds
- [x] T005 [P] Create docker-compose.yml for local development (backend + frontend services)
- [x] T006 [P] Create .github/workflows/ for CI/CD (backend-tests.yml, frontend-tests.yml, deploy.yml)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Implement Shiftboard HMAC SHA-1 authentication utility in backend/src/utils/shiftboard-auth.ts
- [ ] T008 [P] Implement pagination utility (multi-page fetching, 100-page limit) in backend/src/utils/pagination.ts
- [ ] T009 Implement Shiftboard service client (generic RPC, auth, pagination, errors) in backend/src/services/shiftboard.service.ts
- [ ] T010 [P] Setup error middleware (convert to {error:string} format) in backend/src/middleware/error.middleware.ts
- [ ] T011 [P] Setup validation middleware (Zod schemas) in backend/src/middleware/validation.middleware.ts
- [ ] T012 [P] Configure CORS, Helmet security headers, Morgan logging in backend/src/index.ts
- [ ] T013 Create IndexedDB service with 4 stores (shifts, accounts, workgroups, metadata) in frontend/src/services/db.service.ts
- [ ] T014 Create API service with cache fallback logic in frontend/src/services/api.service.ts
- [ ] T015 [P] Define MUI theme (navy primary) in frontend/src/theme/theme.ts
- [ ] T016 [P] Create AppLayout with header, sidebar, outlet, refresh state in frontend/src/components/Layout/AppLayout.tsx
- [ ] T017 [P] Create Workgroup Context (provider, selectedWorkgroup, workgroups) in frontend/src/contexts/WorkgroupContext.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Active Shifts Timeline (Priority: P1) 🎯 MVP

**Goal**: Display current and near-future shifts in a vertical timeline format with clock-in status

**Independent Test**: Load app at / → See timeline with active shifts, current time indicator, person chips showing clock status

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement shift grouping algorithm (group by name+time+workgroup) in backend/src/utils/shift.utils.ts
- [ ] T019 [US1] Implement shift service business logic (shiftWhosOn, shiftList, metrics) in backend/src/services/shift.service.ts
- [ ] T020 [US1] Create shift controller (listShifts, whosOn handlers) in backend/src/controllers/shift.controller.ts
- [ ] T021 [US1] Define shift routes (GET /api/shifts/whos-on, GET /api/shifts/list) in backend/src/routes/shift.routes.ts
- [ ] T022 [P] [US1] Create ActiveShiftsView component (timeline, dynamic window, overlap handling) in frontend/src/components/Calendar/ActiveShiftsView.tsx
- [ ] T023 [P] [US1] Implement "too many shifts" guard (>25 threshold, show anyway option) in ActiveShiftsView.tsx
- [ ] T024 [P] [US1] Add current time indicator line (updates every second) in ActiveShiftsView.tsx
- [ ] T025 [US1] Create CalendarPage component (renders ActiveShiftsView + DayView) in frontend/src/pages/Calendar.tsx
- [ ] T026 [US1] Setup router (/, /tabular-view routes) in frontend/src/App.tsx
- [ ] T027 [US1] Wire up data fetching (useEffect on mount/refresh) in CalendarPage component

**Checkpoint**: At this point, User Story 1 should be fully functional - timeline displays active shifts with clock status

---

## Phase 4: User Story 2 - View All Shifts in Table (Priority: P1)

**Goal**: Provide sortable tabular view of all shifts with columns for time, name, location, people, status

**Independent Test**: Navigate to /tabular-view → See table with all shifts, click column headers to sort, see clock-in status chips

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create TabularShiftView component (MUI Table, 8 columns) in frontend/src/components/Calendar/TabularShiftView.tsx
- [ ] T029 [P] [US2] Implement column sorting (click header toggles asc/desc) in TabularShiftView.tsx
- [ ] T030 [P] [US2] Create person chips (clickable, colored by clock status) in TabularShiftView.tsx
- [ ] T031 [P] [US2] Create status chips (All Clocked In / Not Clocked In / X/Y) in TabularShiftView.tsx
- [ ] T032 [US2] Add loading states (initial vs refresh spinner) in TabularShiftView.tsx
- [ ] T033 [US2] Add Fade/Grow animations on data update in TabularShiftView.tsx
- [ ] T034 [US2] Display last sync timestamp and success/failure indicators in TabularShiftView.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can toggle between views

---

## Phase 5: User Story 3 - Filter by Workgroup (Priority: P2)

**Goal**: Allow users to filter shifts by specific workgroups via dropdown selector in app header

**Independent Test**: Select workgroup from dropdown → Both timeline and table views update to show only that workgroup's shifts

### Implementation for User Story 3

- [ ] T035 [P] [US3] Implement workgroup service (listWorkgroups, getRoles) in backend/src/services/workgroup.service.ts
- [ ] T036 [P] [US3] Create workgroup controller (listWorkgroups, getRoles handlers) in backend/src/controllers/workgroup.controller.ts
- [ ] T037 [P] [US3] Define workgroup routes (GET /api/workgroups/list, GET /api/workgroups/:id/roles) in backend/src/routes/workgroup.routes.ts
- [ ] T038 [P] [US3] Create WorkgroupFilter component (dropdown with "All" + workgroup list) in frontend/src/components/Filters/WorkgroupFilter.tsx
- [ ] T039 [US3] Integrate WorkgroupFilter into AppHeader in frontend/src/components/Layout/AppHeader.tsx
- [ ] T040 [US3] Update API service to pass workgroup filter to backend in frontend/src/services/api.service.ts
- [ ] T041 [US3] Update backend shift service to apply workgroup filter to Shiftboard calls in backend/src/services/shift.service.ts

**Checkpoint**: All three user stories (Timeline, Table, Workgroup Filter) should work together seamlessly

---

## Phase 6: User Story 4 - View Shift Details (Priority: P2)

**Goal**: Provide modal dialog showing comprehensive shift information when user clicks a shift card or table row

**Independent Test**: Click any shift card/row → Modal opens showing shift name, time, location, subject, assigned people with clock status

### Implementation for User Story 4

- [ ] T042 [P] [US4] Create ShiftDetailModal component (MUI Dialog, close handlers) in frontend/src/components/Calendar/ShiftDetailModal.tsx
- [ ] T043 [P] [US4] Display shift header (name, time formatted as "MMM d, yyyy h:mm a") in ShiftDetailModal.tsx
- [ ] T044 [P] [US4] Display shift details (subject, location) in ShiftDetailModal.tsx
- [ ] T045 [P] [US4] List assigned people with green/red clock status badges in ShiftDetailModal.tsx
- [ ] T046 [US4] Wire up modal trigger in ActiveShiftsView (onClick shift card) in frontend/src/components/Calendar/ActiveShiftsView.tsx
- [ ] T047 [US4] Wire up modal trigger in TabularShiftView (onClick Info icon/row) in frontend/src/components/Calendar/TabularShiftView.tsx
- [ ] T048 [US4] Add ESC key and click-outside-to-close handlers in ShiftDetailModal.tsx

**Checkpoint**: Users can now drill into any shift to see full details from both timeline and table views

---

## Phase 7: User Story 5 - Contact Team Members (Priority: P2)

**Goal**: Enable quick communication with team members via call/text actions with phone number access

**Independent Test**: Click person chip → Person modal opens showing name, clock status, phone number, Call/Text buttons

### Implementation for User Story 5

- [ ] T049 [P] [US5] Implement account service (listAccounts, getSelf, getByWorkgroup, getById) in backend/src/services/account.service.ts
- [ ] T050 [P] [US5] Create account controller (list, self, workgroup, byId handlers) in backend/src/controllers/account.controller.ts
- [ ] T051 [P] [US5] Define account routes (GET /api/accounts/\*) in backend/src/routes/account.routes.ts
- [ ] T052 [P] [US5] Create PersonDetailModal component (MUI Dialog, contact info) in frontend/src/components/Calendar/PersonDetailModal.tsx
- [ ] T053 [P] [US5] Display person name (screen_name or first+last) and clock status badge in PersonDetailModal.tsx
- [ ] T054 [P] [US5] Display formatted phone number with Call (tel:) and Text (sms:) buttons in PersonDetailModal.tsx
- [ ] T055 [US5] Wire up person chip clicks in TabularShiftView to open PersonDetailModal in frontend/src/components/Calendar/TabularShiftView.tsx
- [ ] T056 [US5] Wire up person name clicks in ShiftDetailModal to open PersonDetailModal in frontend/src/components/Calendar/ShiftDetailModal.tsx

**Checkpoint**: Users can now contact any team member directly from shift views

---

## Phase 8: User Story 6 - Refresh Data (Priority: P3)

**Goal**: Provide manual refresh button and auto-refresh interval selector to keep data current

**Independent Test**: Click "Refresh Now" → Loading spinner appears, data updates, timestamp changes; Select auto-refresh interval → Data refreshes automatically

### Implementation for User Story 6

- [ ] T057 [P] [US6] Create Sidebar component with refresh controls in frontend/src/components/Layout/Sidebar.tsx
- [ ] T058 [P] [US6] Implement "Refresh Now" button with loading spinner in Sidebar.tsx
- [ ] T059 [P] [US6] Implement auto-refresh dropdown (Off / 5min / 10min / 15min) in Sidebar.tsx
- [ ] T060 [P] [US6] Add setInterval logic in AppLayout for auto-refresh in frontend/src/components/Layout/AppLayout.tsx
- [ ] T061 [US6] Pass refresh trigger via Outlet context to CalendarPage and TabularShiftView in AppLayout.tsx
- [ ] T062 [US6] Update IndexedDB metadata with last sync timestamp after successful refresh in frontend/src/services/db.service.ts
- [ ] T063 [US6] Display "Last refreshed: X minutes ago" or "Last API sync: timestamp" in Sidebar.tsx

**Checkpoint**: Users can manually refresh or configure automatic data updates

---

## Phase 9: User Story 7 - Work Offline (Priority: P3)

**Goal**: Provide graceful degradation when API is unavailable by falling back to IndexedDB cache

**Independent Test**: Disconnect network → App still loads with cached data, shows "Last API sync: timestamp" with stale data indicator

### Implementation for User Story 7

- [ ] T064 [P] [US7] Implement cache-first logic in API service (check cache age, fallback on error) in frontend/src/services/api.service.ts
- [ ] T065 [P] [US7] Add isFreshData flag to distinguish live vs cached responses in frontend/src/services/api.service.ts
- [ ] T066 [P] [US7] Create ErrorBoundary component (catches render errors, displays MUI Alert) in frontend/src/components/ErrorBoundary.tsx
- [ ] T067 [US7] Display stale data warning when isFreshData=false in TabularShiftView and ActiveShiftsView
- [ ] T068 [US7] Show inline error message "Failed to load shifts" when cache empty and API fails in views
- [ ] T069 [US7] Implement system controller (health, echo endpoints) in backend/src/controllers/system.controller.ts
- [ ] T070 [US7] Define system routes (GET /api/system/health, POST /api/system/echo) in backend/src/routes/system.routes.ts

**Checkpoint**: App works with degraded functionality when offline - all cached data remains accessible

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Add role service and controller (getRole, listRoles) in backend/src/services/role.service.ts and backend/src/controllers/role.controller.ts
- [ ] T072 [P] Add calendar service and controller (getSummary stub) in backend/src/services/calendar.service.ts and backend/src/controllers/calendar.controller.ts
- [ ] T073 [P] Create Bicep infrastructure templates (main.bicep, modules for ACR, Container Apps, Key Vault, App Insights) in infra/
- [ ] T074 [P] Create deployment scripts (deploy.sh, destroy.sh, validate.sh) in infra/scripts/
- [ ] T075 [P] Add Bicep parameter files (dev.json, staging.json, prod.json) in infra/params/
- [ ] T076 [P] Document deployment process and seasonal operations in docs/deployment.md
- [ ] T077 Code cleanup and refactoring across all modules
- [ ] T078 Performance optimization (shift grouping <50ms for 1000 shifts)
- [ ] T079 Security hardening (rate limiting, input sanitization, CSP headers)
- [ ] T080 Accessibility audit (ARIA labels, keyboard navigation, screen reader support)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately ✅ **T001-T002 COMPLETE**
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6 → US7)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - MVP)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Shares backend with US1 but UI is independent
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances US1+US2 but doesn't block them
- **User Story 4 (P2)**: Depends on US1 or US2 (needs shift data to display details) - Can build on either view
- **User Story 5 (P2)**: Depends on US4 (person chips in modals) - Extends contact capabilities
- **User Story 6 (P3)**: Can enhance US1+US2 independently - Adds refresh controls to existing views
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Adds resilience to all stories

### Within Each User Story

- Backend tasks (services, controllers, routes) before frontend tasks
- Core implementation before UI enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel:
  - **Parallel Set 1**: US1 (T018-T027), US3 backend (T035-T037), US5 backend (T049-T051), US7 backend (T069-T070)
  - **Parallel Set 2**: US2 (T028-T034), US3 frontend (T038-T040)
  - **Parallel Set 3**: US4 (T042-T048), US6 (T057-T063)
  - **Parallel Set 4**: US5 frontend (T052-T056), US7 frontend (T064-T068)
- Within each user story, tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Active Shifts Timeline)

```bash
# Backend parallel batch (different files):
Task T018: "Implement shift grouping algorithm in backend/src/utils/shift.utils.ts"

# Frontend parallel batch (different files):
Task T022: "Create ActiveShiftsView component in frontend/src/components/Calendar/ActiveShiftsView.tsx"
Task T023: "Implement too many shifts guard in ActiveShiftsView.tsx"
Task T024: "Add current time indicator in ActiveShiftsView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup ✅ **T001-T002 COMPLETE, T003-T006 remaining**
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Active Shifts Timeline)
4. **STOP and VALIDATE**: Test User Story 1 independently (load /, see timeline, verify clock status)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (sortable table)
4. Add User Story 3 → Test independently → Deploy/Demo (workgroup filter)
5. Add User Story 4 → Test independently → Deploy/Demo (shift details)
6. Add User Story 5 → Test independently → Deploy/Demo (contact people)
7. Add User Story 6 → Test independently → Deploy/Demo (refresh controls)
8. Add User Story 7 → Test independently → Deploy/Demo (offline mode)
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Timeline) + User Story 4 (Shift Details)
   - **Developer B**: User Story 2 (Table) + User Story 3 (Workgroup Filter)
   - **Developer C**: User Story 5 (Contact) + User Story 6 (Refresh) + User Story 7 (Offline)
3. Stories complete and integrate independently

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe for parallel execution
- **[Story] label**: Maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Tests**: Not included in this breakdown - add separately if TDD approach is desired

---

## Summary

- **Total Tasks**: 80 tasks
- **Completed**: 2 tasks (T001-T002)
- **Remaining**: 78 tasks
- **User Stories**: 7 stories (US1-US7)
- **Priorities**: P1 (MVP) = US1-US2, P2 = US3-US5, P3 = US6-US7
- **Estimated Timeline**: 8-10 weeks (solo developer), 4-5 weeks (2 developers with parallel stories)
- **MVP Scope**: Phase 1-3 only (Setup + Foundational + User Story 1) = ~2-3 weeks solo
