# Product Requirements Document (PRD)

## 1. Product Overview
- **Product Name:** HLSR Shiftboard Reporting Application
- **Purpose:** Provide IT Committee leadership with a consolidated, real-time view of volunteer staffing status sourced from Shiftboard, enabling rapid decision making during Rodeo operations.
- **Problem Statement:** Coordinators currently rely on Shiftboard's native UI and exports, which are slow to filter, show limited context per shift, and do not surface clock-in compliance. This application packages the critical data into tailored operational views.
- **Vision:** Deliver a responsive, always-current experience that surfaces staffing gaps, individual statuses, and workgroup-specific insights regardless of the underlying tech stack.

## 2. Target Users & Personas
| Persona | Goals | Pain Points |
| --- | --- | --- |
| **IT Committee Shift Captain** | Monitor real-time coverage, verify who is clocked in, quickly contact volunteers. | Shiftboard UI is noisy, lacks fast filtering, requires multiple clicks to view contact info. |
| **Committee Leadership** | Audit historical coverage, ensure compliance, communicate status to other committees. | Needs consolidated reporting and offline-friendly cache when connectivity is constrained. |
| **Support Desk Analyst** | Answer "who is on now" questions, triage incidents. | Lacks simple interface showing multiple views (calendar, table) with minimal training. |

## 3. Goals & Non-Goals
### Goals
1. Present real-time "who's on" shift data with clear clock-in status per assigned person.
2. Offer at least two complementary visualizations (timeline calendar and sortable table) with shared filtering.
3. Allow filtering by workgroup, remembering selections per session.
4. Provide manual and configurable auto-refresh plus last-sync telemetry.
5. Cache data locally to survive transient API failures and reduce load.
6. Surface contact and shift details within one click (modals, chips).

### Non-Goals
- Editing, trading, or creating shifts in Shiftboard.
- Managing volunteer onboarding or credentialing.
- Offline write support (read-only cache only).
- Replacing Shiftboard authentication flows (app relies on service keys/server-side auth).

## 4. Key Features & User Stories
| ID | Feature | Description | Acceptance Criteria |
| --- | --- | --- | --- |
| F1 | Active Shift Timeline | Visual hourly column showing current/near-future shifts with overlap handling. | Displays grouped shifts with assigned members; shows "Too many shifts" state when >25; clicking opens shift modal. |
| F2 | Tabular Shift View | Sortable table with start/end times, location, assigned people chips, and status chips. | Supports ascending/descending sorting; clicking person chip opens person detail modal; manual refresh updates data + timestamps. |
| F3 | Workgroup Filter | Global selector in header filtering both views and API requests. | Loads workgroups from cache/API; "All workgroups" default; persists selection during session; warns when no data. |
| F4 | Shift & Person Detail Modals | On-demand overlays showing contact info, phone actions, and clock-in badges. | Modal exposes call/text actions; shift modal lists assigned people with status chips; closing returns focus to originating component. |
| F5 | Data Refresh & Telemetry | Manual "Refresh now" button, configurable auto-refresh (off/5/10/15 min), last API sync display, fallback to cache. | "Refresh now" triggers data fetch + UI spinner; auto-refresh logs to console; last sync text distinguishes API vs cache data; errors surface toast/state. |
| F6 | API Layer | Express API proxy exposing `/api/shifts/whos-on`, `/accounts/*`, `/workgroups/*`, `/roles/*`, `/calendar/summary`, `/system/echo`. | Endpoints return JSON with `result` + `error` shape; `whos-on` groups shifts server-side; API enforces 60s timeout, logs metrics. |
| F7 | Local Cache | IndexedDB stores shifts/accounts/workgroups with timestamps. | Cache used when last sync < 1 minute or API unavailable; data flagged `isFreshData`. |

## 5. Success Metrics
- **Adoption:** 100% of IT shift captains using the app during Rodeo (tracked via unique clients or manual survey).
- **Latency:** 95th percentile data refresh < 6s including Shiftboard fetch.
- **Reliability:** App provides cached data within 2s during Shiftboard outages (measured via synthetic tests).
- **Accuracy:** Clock-in status matches Shiftboard for 99% of displayed assignments.
- **Usability:** Operators can identify unstaffed shifts within 10 seconds (usability study).

## 6. Release Criteria
1. All key features (F1–F7) implemented and tested.
2. Documentation for deployment (Azure App Service + static client) complete.
3. Monitoring in place (API logs, client error boundary telemetry TBD).
4. Accessibility review completed for color contrast and keyboard navigation.

## 7. Dependencies & Risks
- **Shiftboard API Keys:** Requires long-lived access/secret keys managed in Key Vault.
- **Shiftboard Rate Limits:** Need pagination batching, caching, and exponential backoff.
- **Connectivity Constraints:** Reliance on IndexedDB cache for field operations.
- **PII Handling:** Person detail modal exposes phone numbers—ensure HTTPS, limited access, no export.
- **Time Zones:** All displays assume `America/Chicago`; ensure server enforces consistent conversions.

## 8. Future Enhancements (Out of Current Scope)
- Push notifications when coverage gaps detected.
- Historical analytics dashboard (coverage trends, SLA compliance).
- Role-based access control with personalized favorites.
- Mobile-native app with offline sync.

---
This PRD is stack-agnostic; any replacement implementation must satisfy the user stories, success metrics, and constraints outlined above regardless of chosen technologies.
