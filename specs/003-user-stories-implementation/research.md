# Enhancement Opportunities & Roadmap

**Version**: 1.0.0  
**Date**: 2026-02-17  
**Purpose**: Prioritized improvements for Shift Dashboard based on codebase analysis

## Overview

This document catalogs enhancement opportunities discovered during codebase analysis, organized by priority and aligned with the project constitution. All enhancements are evaluated against the six core principles: API-First Architecture, Resilient Data Access, Real-Time Operations, User-Centered Design, Security & Compliance, and Observable Systems.

## Priority Framework

### Priority Levels

- **P0 (Critical)**: Blocks production use or violates constitution
- **P1 (High)**: Significant value with reasonable effort
- **P2 (Medium)**: Nice-to-have with moderate effort
- **P3 (Low)**: Polish items or high-effort/low-impact features

### Effort Estimation

- **XS**: <4 hours
- **S**: 1-2 days
- **M**: 3-5 days
- **L**: 1-2 weeks
- **XL**: 2+ weeks

## High Priority Enhancements (P1)

### E1: Offline-First PWA

**Current State**: Cache fallback only on API failure; not installable.

**Enhancement**: Convert to Progressive Web App with service worker.

**Features**:

- Service worker with cache-first strategy for API responses
- App manifest for install prompt (Add to Home Screen)
- Background sync for queued refresh attempts
- Offline indicator in UI
- Pre-cache critical assets (fonts, icons, framework code)

**Benefits**:

- Faster perceived load times (instant cache hits)
- True offline mode (works without connectivity)
- Mobile home screen icon for quick access
- Reduced API load through intelligent caching

**Technical Approach**:

- Use Workbox for service worker generation (Vite plugin available)
- Cache strategies:
  - **API responses**: Network-first with 5-minute cache fallback
  - **Static assets**: Cache-first with versioned URLs
  - **Images/fonts**: Cache-first, stale-while-revalidate
- Add `manifest.json` with app metadata

**Effort**: M (3-4 days)

**Constitution Alignment**:

- ✅ II. Resilient Data Access (enhanced offline capability)
- ✅ III. Real-Time Operations (maintains freshness with network-first)
- ✅ IV. User-Centered Design (installable, app-like experience)

**Acceptance Criteria**:

- [ ] App installable on mobile/desktop
- [ ] Works offline with cached data
- [ ] Shows toast when new version available
- [ ] Lighthouse PWA score >90

**Risks**:

- Cache invalidation complexity
- Service worker debugging challenges
- Browser compatibility (95%+ modern browsers)

---

### E2: Advanced Filtering UI

**Current State**: Single workgroup dropdown filter.

**Enhancement**: Multi-dimensional filtering with visual chips.

**Features**:

- Filter panel with sections:
  - **Workgroups**: Multi-select checkbox list
  - **Clock-in Status**: All / Clocked In / Not Clocked In / Partial
  - **Locations**: Multi-select from shift locations
  - **Roles**: Multi-select from shift roles
  - **Time Range**: Time slider (6am-midnight) to focus on specific hours
- Active filter chips displayed below header
- "Clear all filters" button
- Filter state persists in URL query params (shareable links)
- Count of visible/total shifts displayed

**Benefits**:

- Find specific shifts faster (e.g., "unstaffed arena shifts 2-6pm")
- Share filtered views via URL
- Reduce cognitive load by hiding irrelevant shifts
- Support different operator workflows

**Technical Approach**:

- Implement filter reducer in React state
- Apply filters client-side to cached dataset
- Use `react-router-dom` search params for persistence
- Material-UI Chip components for active filters
- Drawer or collapsible panel for filter controls

**Effort**: S (1-2 days)

**Constitution Alignment**:

- ✅ IV. User-Centered Design (multiple operational use cases)
- ✅ III. Real-Time Operations (instant client-side filtering)

**Acceptance Criteria**:

- [ ] Can combine multiple filters (AND logic)
- [ ] Filters applied instantly without API call
- [ ] Active filters visible as removable chips
- [ ] URL reflects filter state
- [ ] Filter panel responsive on tablet/desktop

---

### E3: Search Functionality

**Current State**: No search capability.

**Enhancement**: Fuzzy search across people, shifts, locations.

**Features**:

- Global search input in header (keyboard shortcut: `/`)
- Search across:
  - Person names (screen name, first/last)
  - Shift names
  - Locations
  - Subjects
- Fuzzy matching (e.g., "jhon doe" matches "John Doe")
- Highlight matching shifts in views
- Search results dropdown with direct links to shift modals
- Recent searches stored in localStorage

**Benefits**:

- Find specific person/shift in <5 seconds
- Keyboard-driven navigation for power users
- Reduces need for extensive scrolling/filtering

**Technical Approach**:

- Use `fuse.js` for fuzzy search (5KB gzipped)
- Index: `[person names, shift names, locations, subjects]`
- Debounce search input (300ms)
- Store recent searches in localStorage (max 10)

**Effort**: S (1-2 days)

**Constitution Alignment**:

- ✅ IV. User-Centered Design (accessibility for different workflows)
- ✅ III. Real-Time Operations (instant search on cached data)

**Acceptance Criteria**:

- [ ] Search returns results in <100ms
- [ ] Fuzzy matching handles typos
- [ ] Keyboard shortcut opens search
- [ ] Clicking result opens relevant modal or view
- [ ] Recent searches accessible via dropdown

---

### E4: Push Notifications for Coverage Gaps

**Current State**: Manual refresh required to detect changes.

**Enhancement**: Browser push notifications for critical events.

**Features**:

- Opt-in notification permission prompt
- Notification triggers:
  - Shift becomes unstaffed (assigned person removed)
  - Person clock-in status changes
  - Urgent shift published
- Notification actions:
  - "View Shift" → Opens app to shift detail modal
  - "Dismiss"
- Desktop + mobile support
- Notification preferences page (enable/disable by event type)

**Benefits**:

- Proactive alerts reduce response time to coverage issues
- Reduces need for constant manual refreshing
- Critical for shift captains during event operations

**Technical Approach**:

- Backend: WebSocket or Server-Sent Events (SSE) for real-time updates
  - Alternative: Long polling (simpler, less efficient)
- Frontend: Browser Push API
- Flow:
  1. Client subscribes to push notifications
  2. Backend monitors Shiftboard changes (polling or webhooks)
  3. Detect coverage gap → Send push to subscribed clients
- Store push subscriptions in database (requires backend persistence)

**Effort**: M (4-5 days)

**Dependencies**:

- Requires backend enhancement (WebSocket/SSE endpoint)
- May require Shiftboard webhook integration (preferred) or polling

**Constitution Alignment**:

- ✅ III. Real-Time Operations (proactive push vs reactive pull)
- ✅ IV. User-Centered Design (reduce cognitive burden)

**Acceptance Criteria**:

- [ ] Notifications delivered within 30s of event
- [ ] Clicking notification focuses app and opens relevant modal
- [ ] Works on desktop Chrome, Firefox, Edge
- [ ] Works on mobile Chrome (Android), Safari (iOS)
- [ ] User can disable specific event types

**Risks**:

- Push permission denial rate (users may decline)
- Battery impact on mobile (mitigate with efficient connection)
- Requires persistent backend (not stateless)

---

### E5: Historical Reporting

**Current State**: Only current/future shifts visible.

**Enhancement**: Date range selector and historical shift analysis.

**Features**:

- Date range picker in header (default: today)
- Historical shift views:
  - Calendar view for past dates
  - Tabular view with date column
- Export capabilities:
  - CSV export of visible shifts
  - PDF report with coverage statistics
- Metrics dashboard:
  - Coverage percentage over time
  - No-show rate by workgroup
  - Clock-in compliance trends
  - Shifts per volunteer (leaderboard)
- "Compare Dates" feature (side-by-side or overlay)

**Benefits**:

- Operational insights for planning future events
- Identify patterns (which shifts hard to staff?)
- Volunteer recognition (who shows up consistently?)
- Compliance reporting for sponsors/leadership

**Technical Approach**:

- Date picker: Material-UI DateRangePicker
- Backend changes:
  - Add `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` to whos-on endpoint
  - Add `/api/reports/coverage-summary` endpoint for metrics
- Export:
  - CSV: Client-side with `json2csv` library
  - PDF: `jsPDF` or backend generation with Puppeteer
- Metrics calculation: SQL aggregations or backend service

**Effort**: L (1-2 weeks)

**Dependencies**:

- Requires API changes to accept date range
- May require Shiftboard data retention awareness

**Constitution Alignment**:

- ✅ IV. User-Centered Design (leadership persona needs)
- ✅ VI. Observable Systems (metrics and reporting)

**Acceptance Criteria**:

- [ ] Can select arbitrary date range (past or future)
- [ ] Views update to show shifts in selected range
- [ ] CSV export contains all visible columns
- [ ] PDF report includes coverage % and shift count
- [ ] Metrics dashboard loads in <2 seconds for 1-month range

---

## Medium Priority Enhancements (P2)

### E6: Role-Based Access Control (RBAC)

**Current State**: No authentication; single-tenant assumption.

**Enhancement**: Multi-user authentication with role-based permissions.

**Roles**:

- **Shift Captain**: Full access (view, filter, contact)
- **Support Desk**: Read-only (view, filter; no contact info)
- **Leadership**: Reports and metrics (no real-time shifts)
- **Admin**: User management, configuration

**Features**:

- Login page with email/password (optional SSO with Azure AD/OAuth)
- JWT-based authentication
- Protected API endpoints (verify JWT middleware)
- Permission checks in UI (hide contact buttons for Support Desk)
- User management page (Admin only)

**Benefits**:

- Multi-organization support (different committees)
- Audit trail (who accessed contact info?)
- Compliance with data access policies
- Granular control over sensitive data

**Technical Approach**:

- Auth library: `passport` (Node.js) or `next-auth` if migrating to Next.js
- JWT stored in httpOnly cookie
- Backend: Add `authMiddleware` to protected routes
- Frontend: `AuthContext` withLogin state; `ProtectedRoute` wrapper
- User database: PostgreSQL or MongoDB (new dependency)

**Effort**: L (1.5-2 weeks)

**Dependencies**:

- Requires database for user storage
- May require organization model (multi-tenancy)

**Constitution Alignment**:

- ✅ V. Security & Compliance (authorized access to PII)
- ✅ VI. Observable Systems (audit logs)

**Acceptance Criteria**:

- [ ] Unauthorized access redirects to login
- [ ] JWT expires after 8 hours; refresh token for 7 days
- [ ] Support Desk role cannot see phone numbers
- [ ] Admin can create/delete users
- [ ] Failed login attempts logged

**Deferred Implementation Note**: May defer until multi-tenant need arises (current single-org usage acceptable).

---

### E7: Performance Optimization (Virtual Scrolling)

**Current State**: Tabular view re-renders all rows on data update.

**Enhancement**: Virtual scrolling for large shift datasets.

**Problem**: With >500 shifts, table scrolling lags and refresh animations stutter.

**Solution**: Use `react-window` or `react-virtualized` to render only visible rows.

**Features**:

- Render ~20 rows (viewport height) + overscan buffer
- Smooth scrolling with dynamic row heights
- Maintains sorting and filtering
- Preserves modal interactions

**Benefits**:

- Scrolling remains smooth with 1000+ shifts
- Reduced memory usage (fewer DOM nodes)
- Faster initial render

**Technical Approach**:

- Replace Material-UI Table with `FixedSizeList` from `react-window`
- Calculate row height based on content (fixed or estimated)
- Wrap rows in memoized component to prevent unnecessary re-renders
- Test with synthetic 1000-shift dataset

**Effort**: M (3-4 days)

**Constitution Alignment**:

- ✅ IV. User-Centered Design (smooth UX at scale)
- ✅ III. Real-Time Operations (fast refresh with large datasets)

**Acceptance Criteria**:

- [ ] Table renders 1000 shifts with no scroll lag
- [ ] Initial render <500ms for 500 shifts
- [ ] Sorting and filtering work as expected
- [ ] No visual regressions in row layout

---

### E8: Smart Refresh (Differential Updates)

**Current State**: Full dataset refresh on every update.

**Enhancement**: Fetch only changed shifts since last sync.

**Backend Changes**:

- Add `?since=TIMESTAMP` parameter to whos-on endpoint
- Return only shifts modified after timestamp
- Include deleted shift IDs in response

**Frontend Changes**:

- Store last sync timestamp in state
- Merge delta response with cached data
- Highlight updated shifts in UI (yellow flash animation)
- Show "+5 new, -2 removed" badge in header

**Benefits**:

- Reduced API latency (fewer shifts transferred)
- Lower bandwidth usage
- Visual feedback on what changed

**Technical Approach**:

- Backend: Filter Shiftboard response by `updated > since`
- Merge logic: `cachedShifts.filter(not deleted) + deltaShifts`
- UI: Add `data-updated="recent"` class, fade-out after 3s

**Effort**: M (4-5 days)

**Constitution Alignment**:

- ✅ III. Real-Time Operations (efficient updates)
- ✅ II. Resilient Data Access (incremental cache updates)

**Acceptance Criteria**:

- [ ] Delta refresh 10x faster than full refresh for <10% changes
- [ ] UI highlights updated/new shifts
- [ ] Deleted shifts removed from cache
- [ ] Falls back to full refresh if delta >50% of dataset

---

### E9: Shift Alerts Configuration

**Current State**: No alerting system.

**Enhancement**: Configurable alerts sent via email/SMS.

**Features**:

- Alert configuration page:
  - "Notify me when shift in [Workgroup] becomes unstaffed"
  - "Notify me when person X clocks in/out"
  - "Daily summary at 6am"
- Delivery channels: Email (via SendGrid) and/or SMS (via Twilio)
- Alert history page (last 30 days)
- Snooze alerts for X hours

**Benefits**:

- Proactive notification (don't have to watch dashboard)
- Integrates with existing communication workflows
- Reduces "watch time" for shift captains

**Technical Approach**:

- Backend: Scheduled job checks conditions every 5 minutes
- Store alert rules in database (PostgreSQL)
- Queue delivery via Celery/Bull or direct API calls
- Frontend: Alert configuration form with validation

**Effort**: L (1-2 weeks)

**Dependencies**:

- Requires email/SMS service accounts (SendGrid, Twilio)
- Requires backend job scheduler (node-cron or separate worker)

**Constitution Alignment**:

- ✅ III. Real-Time Operations (proactive alerts)
- ✅ IV. User-Centered Design (reduces manual monitoring)

---

### E10: Mobile Native App

**Current State**: Responsive web app (min 1024px).

**Enhancement**: Native iOS and Android apps.

**Approach**: React Native or Flutter for code reuse.

**Features**:

- Full feature parity with web app
- Native navigation patterns (tabs, stack navigator)
- Push notifications via native APIs (better reliability)
- Offline-first architecture with AsyncStorage
- Biometric login (Face ID, fingerprint)
- Deep links for shift sharing

**Benefits**:

- Better mobile UX (native gestures, navigation)
- Improved performance on mobile devices
- App Store presence (discoverability)
- True background refresh

**Effort**: XL (6-8 weeks)

**Constitution Alignment**:

- ✅ II. Resilient Data Access (native offline storage)
- ✅ IV. User-Centered Design (mobile-optimized experience)

**Deferred Rationale**: Web app currently sufficient for operational laptops and tablets; defer until mobile-only usage increases.

---

## Low Priority Enhancements (P3)

### E11: Dark Mode

**Enhancement**: Toggle between light and dark themes.

**Effort**: XS (<4 hours)

**Approach**: Duplicate Material-UI theme with dark palette; store preference in localStorage.

---

### E12: Keyboard Shortcuts

**Enhancement**: Hotkeys for common actions.

**Shortcuts**:

- `/`: Focus search
- `R`: Refresh
- `F`: Open filter panel
- `Esc`: Close modal
- `Tab`/`Shift+Tab`: Navigate modals

**Effort**: XS (<4 hours)

**Approach**: Global event listener with hotkey library (e.g., `react-hotkeys-hook`).

---

### E13: Export to CSV/PDF

**Enhancement**: Export current view data.

**Effort**: S (1 day)

**Approach**: Client-side generation with `json2csv` and `jsPDF`.

---

### E14: Accessibility Enhancements (WCAG 2.1 AAA)

**Current State**: Basic WCAG AA compliance.

**Enhancements**:

- Full keyboard navigation (skip links)
- Screen reader announcements for live data updates
- High contrast mode
- Font size controls
- Reduced motion mode (disable animations)

**Effort**: M (3-4 days)

---

### E15: Analytics Integration

**Enhancement**: Google Analytics or Application Insights.

**Metrics**:

- Page views per route
- Feature usage (modal opens, filter changes)
- Error rates (ErrorBoundary catches)
- Performance metrics (Core Web Vitals)

**Effort**: XS (<4 hours)

---

## Implementation Roadmap

### Phase 1: Foundational Improvements (2-3 weeks)

Focus on high-value, moderate-effort enhancements that improve daily operations.

- E1: Offline-First PWA (M)
- E2: Advanced Filtering UI (S)
- E3: Search Functionality (S)
- E7: Performance Optimization (M)

**Value**: Faster, more resilient app with better discoverability.

### Phase 2: Real-Time & Notifications (2-3 weeks)

Add proactive alerting to reduce manual monitoring.

- E4: Push Notifications (M)
- E8: Smart Refresh (M)
- E9: Shift Alerts Configuration (L)

**Value**: Shift captains notified of issues proactively.

### Phase 3: Insights & Reporting (2-3 weeks)

Historical analysis and operational metrics.

- E5: Historical Reporting (L)
- E13: Export to CSV/PDF (S)
- E15: Analytics Integration (XS)

**Value**: Leadership insights, trend analysis, compliance reporting.

### Phase 4: Security & Scale (2-3 weeks)

Multi-tenant support and access control.

- E6: Role-Based Access Control (L)
- E14: Accessibility Enhancements (M)

**Value**: Multi-organization deployment, compliance, inclusivity.

### Phase 5: Mobile & Polish (6-8 weeks)

Native mobile experience (deferred until demand confirmed).

- E10: Mobile Native App (XL)
- E11: Dark Mode (XS)
- E12: Keyboard Shortcuts (XS)

**Value**: Mobile-first user experience, app store presence.

---

## Technical Debt & Code Quality

### Identified Technical Debt

1. **No Automated Tests**
   - **Issue**: Entire codebase lacks unit, integration, or E2E tests
   - **Risk**: Regressions undetected; high-touch manual QA required
   - **Remediation**: Add Jest + React Testing Library; target 70% coverage
   - **Effort**: L (1-2 weeks initial setup + ongoing)

2. **Inconsistent Error Handling**
   - **Issue**: Some errors logged to console; others shown inline; no structured logging
   - **Risk**: Difficult to diagnose production issues
   - **Remediation**: Centralized error reporting (Sentry or Application Insights)
   - **Effort**: S (1-2 days)

3. **Hard-Coded Time Zone**
   - **Issue**: America/Chicago assumed everywhere; not configurable
   - **Risk**: Breaks if deployed for non-CST organization
   - **Remediation**: Add `TIMEZONE` env var; use throughout
   - **Effort**: XS (<4 hours)

4. **Magic Numbers**
   - **Issue**: Values like `100` (page limit), `25` (max shifts) scattered in code
   - **Risk**: Hard to change thresholds; inconsistencies
   - **Remediation**: Extract to constants file or config
   - **Effort**: XS (<2 hours)

5. **TypeScript Strict Mode Disabled**
   - **Issue**: `tsconfig.json` may have relaxed type checking
   - **Risk**: Type errors slip through, discovered at runtime
   - **Remediation**: Enable `strict: true`; fix violations incrementally
   - **Effort**: M (2-3 days for existing code)

---

## Performance Improvement Opportunities

### Current Performance Characteristics

- **whos-on API**: 1-2 seconds for 150 shifts (acceptable)
- **Grouping algorithm**: <20ms for 1000 shifts (excellent)
- **Table render**: 200-500ms for 50 shifts (acceptable)
- **Cache read**: <10ms (excellent)

### Optimization Targets

1. **Virtual scrolling** (E7): Handles 10x more shifts smoothly
2. **Differential refresh** (E8): 5-10x faster API responses
3. **Code splitting**: Lazy-load modals, table view
4. **Image optimization**: None currently; future if adding photos
5. **Service worker caching** (E1): Instant repeat page loads

---

## Security Enhancements

### Current Security Posture

- ✅ HTTPS enforced (production)
- ✅ CORS configured
- ✅ Helmet.js security headers
- ✅ Credentials isolated to backend
- ❌ No user authentication
- ❌ No rate limiting
- ❌ No input validation
- ❌ No audit logging

### Recommended Security Roadmap

1. **Add request validation**: Joi/Zod schemas for query params (XS)
2. **Rate limiting**: express-rate-limit middleware (XS)
3. **Content Security Policy**: Strict CSP header (S)
4. **Secrets management**: Migrate to Azure Key Vault (S)
5. **Authentication** (E6): JWT-based login (L)
6. **Audit logging**: Log PII access (phone views, contact actions) (S)

---

## Monitoring & Observability

### Current Monitoring

- ✅ Console logging (unstructured)
- ✅ Morgan HTTP request logs
- ✅ Health check endpoint (`/api/system/health`)
- ❌ No structured logging
- ❌ No error aggregation
- ❌ No performance monitoring
- ❌ No uptime monitoring

### Recommended Observability Stack

- **APM**: Application Insights or Datadog (deployment metrics, traces)
- **Error Tracking**: Sentry (client + server errors)
- **Uptime Monitoring**: Pingdom or UptimeRobot (health check polls)
- **Structured Logging**: Winston or Pino (JSON logs)
- **Dashboards**: Grafana for operational metrics

**Effort**: M (3-5 days for full setup)

---

## Constitution Impact Analysis

All enhancements evaluated against constitution principles:

### Enhances Existing Principles

- **E1 (PWA)**: ✅ Principle II (Resilient Data Access), IV (User-Centered)
- **E2 (Filtering)**: ✅ Principle IV (User-Centered)
- **E3 (Search)**: ✅ Principle IV (User-Centered)
- **E4 (Push Notifications)**: ✅ Principle III (Real-Time Operations)
- **E5 (Reporting)**: ✅ Principle VI (Observable Systems)
- **E6 (RBAC)**: ✅ Principle V (Security & Compliance)
- **E7 (Performance)**: ✅ Principle IV (User-Centered)
- **E8 (Differential Refresh)**: ✅ Principle III (Real-Time)

### No Constitutional Conflicts

All enhancements align with or strengthen existing principles. No amendments required.

---

## Decision Framework for Prioritization

When evaluating new enhancements, consider:

1. **Constitution Alignment**: Does it uphold or strengthen core principles?
2. **User Impact**: How many users benefit? How significantly?
3. **Operational Value**: Does it reduce manual work or improve decision-making?
4. **Effort vs Value**: ROI in terms of development time
5. **Risk**: Technical complexity, dependencies, maintenance burden
6. **Urgency**: Blocking production issue? vs nice-to-have?

**Scoring Example**:

```
User Impact (1-10) × Operational Value (1-10) / Effort (XS=1, S=2, M=3, L=5, XL=10)
```

E3 (Search): `(8 × 7) / 2 = 28` (high score → P1)  
E10 (Mobile App): `(9 × 9) / 10 = 8.1` (lower score → deferred)

---

## Next Steps

1. **Review Roadmap**: Stakeholder alignment on Phase 1 priorities
2. **Create Feature Branches**: Use `/speckit.specify` for each enhancement
3. **Implement Phase 1**: Execute E1-E3, E7 over 2-3 weeks
4. **Measure Impact**: Track metrics (load time, user satisfaction, incident response time)
5. **Iterate**: Adjust Phase 2 priorities based on Phase 1 learnings

---

**Document Status**: Complete  
**Owner**: Product/Engineering leads  
**Review Cycle**: Quarterly or after major releases  
**Related Documents**: `codebase-spec.md`, `api-contracts.md`, `constitution.md`
