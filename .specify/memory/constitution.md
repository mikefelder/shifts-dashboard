<!--
SYNC IMPACT REPORT
==================
Version Change: [Template] → 1.0.0
Type: Initial Ratification
Date: 2026-02-17

Principles Defined:
  1. API-First Architecture (new)
  2. Resilient Data Access (new)
  3. Real-Time Operations (new)
  4. User-Centered Design (new)
  5. Security & Compliance (new)
  6. Observable Systems (new)

Sections Added:
  - Technical Standards
  - Quality & Testing

Templates Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - User story prioritization supports incremental delivery
  ✅ tasks-template.md - Task organization matches principle-driven development

Follow-up Actions:
  - None required; all templates are consistent with constitution

Notes:
  - This is the initial ratification based on existing project requirements
  - Principles derived from PRD, Functional Spec, and Technical Specification
  - Future amendments must follow semantic versioning (MAJOR.MINOR.PATCH)
-->

# Shifts Dashboard Constitution

## Core Principles

### I. API-First Architecture

All features MUST be exposed through a RESTful API layer that serves as the authoritative proxy to Shiftboard.

- Client applications never handle Shiftboard credentials directly
- API endpoints normalize JSON-RPC responses with consistent error handling (`{error: message}` format)
- Server adds timing metadata to all responses for observability
- Authentication to Shiftboard uses service keys managed via environment variables or Key Vault
- API contract defines the system boundary; clients depend on REST endpoints, not Shiftboard internals

**Rationale**: Separation of concerns ensures security (credential isolation), enables independent client/server testing, and allows future client implementations (mobile, CLI) without reimplementing Shiftboard integration.

### II. Resilient Data Access

The system MUST provide graceful degradation through local caching when external dependencies fail.

- IndexedDB cache stores shifts, accounts, and workgroups after successful API responses
- Live API fetch is always attempted first; cache serves data only when API fails
- All responses include `isFreshData` boolean flag distinguishing live vs cached sources
- Last sync timestamp reflects most recent successful API call, not cache reads
- Cache enables read-only operations during connectivity issues; no offline writes

**Rationale**: Field operations during Rodeo require reliability despite intermittent Shiftboard connectivity. Transparent cache fallback prevents operational disruptions while maintaining data freshness expectations.

### III. Real-Time Operations

Current shift data MUST be readily accessible with clear freshness indicators.

- Manual "Refresh Now" button is always available and forces live API fetch
- Auto-refresh configurable at 5/10/15 minute intervals (or disabled)
- Changing auto-refresh interval triggers immediate refresh
- UI displays timestamp of last successful API sync
- Force-sync flag on user-initiated actions (filter changes, manual refresh)

**Rationale**: Operators need current assignment and clock-in status for decision making. Configurable refresh balances data currency with API load; manual override ensures control when immediate updates required.

### IV. User-Centered Design

The interface MUST support different operational use cases through multiple complementary views.

- Provide both timeline calendar and sortable table visualizations of shift data
- Workgroup filtering applies globally across all views and persists during session
- Meet WCAG AA accessibility standards (color contrast, keyboard navigation, focus management)
- Responsive design for operational laptops and tablets (minimum 1024px width)
- On-demand modals for shift and person details minimize information overload

**Rationale**: Different roles (shift captains, support desk, leadership) require different data presentations. Calendar shows temporal context; table enables sorting and detailed comparison. Accessibility ensures all operators can use the system effectively.

### V. Security & Compliance

Personally identifiable information (PII) MUST be protected with appropriate access controls and transport security.

- Phone numbers exposed only in person detail modals (not in table/calendar views)
- HTTPS required for all production deployments
- Service authentication credentials stored in environment variables or Azure Key Vault, never in code
- No client-side storage of Shiftboard credentials
- API responses exclude sensitive fields not required for display

**Rationale**: Volunteer contact information is sensitive PII. Principle of least privilege limits exposure; modals provide intentional access gates. Secure credential management prevents unauthorized Shiftboard access.

### VI. Observable Systems

The system MUST provide operational visibility for debugging and performance monitoring.

- Structured timing metrics for all API operations (fetch duration, grouping duration)
- Request/response logging via morgan with configurable detail levels
- API health probe endpoint (`GET /api/system/health`) for infrastructure monitoring
- Error boundary captures uncaught exceptions with stack traces in development
- Client distinguishes loading states (initial vs refresh) for appropriate UI feedback

**Rationale**: Operations teams need visibility into system performance and error conditions. Metrics enable capacity planning; health probes support automated monitoring; detailed logging accelerates incident response.

## Technical Standards

The following constraints apply stack-agnostic requirements for any implementation:

- **Technology Stack**: Node.js/Express API (current); browser-based SPA with IndexedDB support; any replacement must maintain REST API contract
- **Time Zone**: All timestamps displayed in `America/Chicago`; server enforces consistent conversions from Shiftboard UTC responses
- **Date Formatting**: Use `MMM d, yyyy` and `h:mm a` patterns for operator familiarity; changes require user acceptance testing
- **Pagination**: Batch sizes up to 100 pages with guard limits to prevent runaway loops; log warnings when approaching limits
- **Error Responses**: JSON format `{error: <string>}` with appropriate HTTP status codes (400/401/403/404/500)
- **Deployment**: Azure App Service compatible; production mode serves static client from backend; environment configuration via .env or Key Vault

## Quality & Testing

Implementation MUST meet the following measurable standards:

- **Performance**: Calendar view renders ≤25 grouped shifts in <500ms; displays degradation message when >25 shifts
- **Reliability**: 95th percentile data refresh <6 seconds including Shiftboard fetch; cache fallback <2 seconds during outages
- **Accuracy**: Clock-in status must match Shiftboard for 99% of displayed assignments within 60 seconds of API fetch
- **Testing Requirements**:
  - Contract tests for all API endpoints verifying response shape
  - Integration tests for critical user flows (view shifts, filter workgroup, contact volunteer)
  - Manual accessibility review with keyboard navigation and screen reader testing
- **Code Review**: All pull requests verify principle compliance; deviations require documented justification and version bump consideration

## Governance

This constitution is the authoritative source for project architectural principles and quality standards.

- **Precedence**: Constitution supersedes implementation preferences, coding style guides, and tooling opinions
- **Amendment Process**: Changes require documented rationale explaining problem, proposed principle/change, and compatibility impact
- **Versioning**:
  - **MAJOR**: Backward-incompatible changes (principle removal, architecture redefinition)
  - **MINOR**: New principles/sections added, material expansions to existing guidance
  - **PATCH**: Clarifications, wording improvements, non-semantic refinements
- **Compliance Review**: All PRs must either comply with constitution or explicitly justify temporary deviations with remediation plans
- **Relationship to Specs**: PRD, Functional Spec, and Technical Specification define *what* to build; constitution defines *how* we build

**Version**: 1.0.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-17
