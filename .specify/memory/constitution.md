<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Type: Minor Amendment (New Principle Added)
Date: 2026-02-17

Principles Defined:
  1. API-First Architecture (unchanged)
  2. Resilient Data Access (unchanged)
  3. Real-Time Operations (unchanged)
  4. User-Centered Design (unchanged)
  5. Security & Compliance (unchanged)
  6. Observable Systems (unchanged)
  7. Cloud-Native Infrastructure (NEW)

Sections Modified:
  - Technical Standards (expanded with Azure-native, IaC, multi-tenancy requirements)

Impact Analysis:
  ✅ Existing code compatible (additive change only)
  ⚠️  New deployment requirements:
      - Bicep templates required for infrastructure
      - GitHub Actions CI/CD pipeline required
      - Configuration-driven multi-tenancy architecture needed
      - Azure Key Vault integration for secrets

Follow-up Actions:
  - Update rebuild-plan.md Phase 0 to include Bicep scaffolding (T001-T005)
  - Update rebuild-plan.md Phase 4 to replace manual Azure setup with IaC deployment
  - Update codebase-spec.md deployment section
  - Update TIMELINE.md to reflect infrastructure work

Notes:
  - Amendment driven by operational requirements: seasonal operations (cost optimization),
    multi-committee support (multi-tenancy), and public code sharing (generic architecture)
  - Aligns with Azure best practices and modern DevOps principles
  - Version bump: MINOR (new principle added without breaking existing principles)
-->

# Shift Dashboard Constitution

**Version**: 1.3.0  
**Display Context**: Large-Screen Room Monitoring System  
**Date**: 2026-02-21

## Application Purpose

This application is a **large-screen dashboard display** designed for shared room monitoring of volunteer shift staffing. It is **NOT** a personal workstation application.

### Display Context

- **Primary Environment**: Large TV/monitor in operations room or command center
- **Viewing Distance**: 5-15 feet from screen
- **Primary Use**: Passive monitoring by multiple viewers simultaneously
- **User Interaction**: Minimal (auto-refresh handles updates)
- **Information Access**: Glanceable - users understand staffing status within 3-5 seconds

### Core Use Cases

1. **Who's On Shift**: Quickly identify currently active shifts and assigned personnel
2. **Arrival Status**: Visual indication of who has clocked in (arrived on-site) vs. not yet arrived
3. **Upcoming Shifts**: See next shift transitions to anticipate staffing changes
4. **Staffing Gaps**: Identify no-shows or unstaffed positions requiring immediate action
5. **Committee Response**: Provide real-time situational awareness for operations decisions

### Design Implications

- **Large Typography**: All text sized for distance viewing (minimum 18px body, 24px+ headers)
- **High Contrast**: Colors must be distinguishable from across the room
- **Auto-Refresh**: Automatic updates every 5-15 minutes without user interaction
- **Minimal Chrome**: Reduce UI clutter; maximize information density
- **Status Indicators**: Clear visual differentiation (clocked in = green, not arrived = red)
- **Current Time**: Prominent display to contextualize shift timing

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

### VIII. Code Quality Standards

All code MUST pass automated quality checks before being considered complete or deployed.

- ESLint and Prettier enforce consistent code style and catch common errors
- TypeScript strict mode is enabled; all types must be explicit (no implicit `any`)
- Linting must pass with zero errors before commits (`npm run lint` returns exit code 0)
- Test files may use relaxed rules (e.g., `any` types allowed) but production code must be strict
- Pre-commit hooks enforce linting and formatting automatically
- CI/CD pipelines fail builds if linting fails, preventing broken code from deploying

**Rationale**: Automated quality checks catch bugs early, ensure maintainable code, and prevent common mistakes. Consistent code style improves readability and reduces cognitive load. Type safety catches errors at compile time rather than runtime. Failing fast on quality issues prevents technical debt accumulation.

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

### VII. Cloud-Native Infrastructure

The system MUST be deployable as cloud-native infrastructure with configuration-driven multi-tenancy.

- All Azure infrastructure provisioned via Bicep templates (Infrastructure as Code)
- CI/CD automated through GitHub Actions for consistent, repeatable deployments
- Environment configuration drives instance isolation (no hardcoded organization/committee data)
- Resource provisioning supports elastic scaling (easy spin-up/down for seasonal operations)
- Application architecture is Shiftboard-generic, enabling reuse by any organization via public repository clone
- Secrets managed through Azure Key Vault, never in code or CI/CD definitions
- Deployment configuration accepts parameters for committee/organization-specific instances

**Rationale**: Seasonal operations (e.g., HLSR Rodeo) require cost-effective resource management through automated provisioning and decommissioning. Multi-tenant architecture enables multiple independent instances for different organizational units. Infrastructure as Code ensures reproducible deployments, reduces manual errors, and enables version-controlled infrastructure changes. Configuration-driven design allows public code sharing without exposing organizational specifics.

## Technical Standards

The following constraints apply stack-agnostic requirements for any implementation:

- **Technology Stack**: Node.js/Express API (current); browser-based SPA with IndexedDB support; any replacement must maintain REST API contract
- **Cloud Platform**: Azure-native deployment (Container Apps, Key Vault, Application Insights, Container Registry); infrastructure provisioned via Bicep templates
- **Container Strategy**: Docker-based deployment with multi-stage builds; container images stored in Azure Container Registry
- **CI/CD**: GitHub Actions for automated build, test, containerization, and deployment pipelines
- **Multi-Tenancy**: Configuration-driven instances supporting isolated deployments per organizational unit (e.g., different committees)
- **Configuration**: Environment-specific parameters (organization name, Shiftboard credentials, resource names) passed via deployment parameters or Key Vault references
- **Infrastructure as Code**: All Azure resources defined in versioned Bicep modules; manual portal changes prohibited in production
- **Time Zone**: All timestamps displayed in `America/Chicago`; server enforces consistent conversions from Shiftboard UTC responses
- **Date Formatting**: Use `MMM d, yyyy` and `h:mm a` patterns for operator familiarity; changes require user acceptance testing
- **Pagination**: Batch sizes up to 100 pages with guard limits to prevent runaway loops; log warnings when approaching limits
- **Error Responses**: JSON format `{error: <string>}` with appropriate HTTP status codes (400/401/403/404/500)
- **Resource Management**: Support for automated spin-up/spin-down to minimize costs during off-season; Container Apps scale-to-zero during idle periods; infrastructure templates enable rapid provisioning (<15 minutes from parameters to running app)

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
- **Relationship to Specs**: PRD, Functional Spec, and Technical Specification define _what_ to build; constitution defines _how_ we build

**Version**: 1.1.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-17
