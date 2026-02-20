# Implementation Plan: Shift Dashboard Rebuild

**Version**: 1.0.0  
**Date**: 2026-02-17  
**Type**: Full Application Rebuild  
**Specification Sources**:

- `.specify/analysis/codebase-spec.md`
- `.specify/analysis/api-contracts.md`
- `.specify/analysis/enhancements.md`
- `.specify/memory/constitution.md`

---

## Executive Summary

This plan outlines the complete rebuild of the Shift Dashboard application with feature parity to the original implementation, plus foundational enhancements. All legacy code has been removed; this is a greenfield implementation following constitutional principles and modern best practices.

**Timeline**: 8-10 weeks  
**Team**: 2 full-stack developers + 1 QA engineer  
**Target**: Production-ready deployment with testing infrastructure

---

## Technical Context

### Language/Version

- **Backend**: Node.js 20.x LTS (TypeScript 5.2+)
- **Frontend**: React 18.2+ with TypeScript 5.2+

### Primary Dependencies

#### Backend

- **Framework**: Express 4.19+
- **HTTP Client**: Axios 1.6+
- **Security**: Helmet 7.0+, CORS 2.8+
- **Logging**: Morgan 1.10+ (HTTP), Winston 3.11+ (structured)
- **Authentication**: jssha 3.3+ (Shiftboard HMAC)
- **Validation**: Zod 3.22+ (input validation)
- **Testing**: Jest 29.7+, Supertest 6.3+

#### Frontend

- **Build Tool**: Vite 5.0+
- **UI Framework**: Material-UI (@mui/material) 5.15+
- **Routing**: react-router-dom 6.21+
- **State Management**: React Context API + Zustand 4.4+
- **HTTP Client**: Axios 1.6+
- **Storage**: idb 8.0+ (IndexedDB wrapper)
- **Date Handling**: date-fns 3.0+
- **Testing**: Vitest 1.2+, React Testing Library 14.1+, Playwright 1.40+

### Storage

- **Client**: IndexedDB (4 object stores: shifts, accounts, workgroups, metadata)
- **Server**: In-memory (stateless); future: Redis for session management

### Testing

- **Unit**: Jest (backend), Vitest (frontend)
- **Integration**: Supertest (API), MSW (mock Shiftboard)
- **E2E**: Playwright
- **Contract**: Custom validators against api-contracts.md spec
- **Coverage Target**: 70% (Phase 1), 85% (Phase 2)

### Target Platform

- **Backend**: Linux container (Azure Container Apps), Docker, Azure Container Registry
- **Frontend**: Modern browsers (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- **Mobile**: Responsive web (1024px+); future: React Native

### Project Type

**Web application** (separate backend/frontend)

### Performance Goals

- **API Response Time**: p95 <2s for /api/shifts/whos-on
- **Page Load (First Paint)**: <1.5s
- **Time to Interactive**: <2.5s
- **Shift Grouping**: <50ms for 1000 shifts
- **IndexedDB Operations**: <10ms per operation
- **Lighthouse Scores**: Performance >90, Accessibility >95, Best Practices >95, SEO >90

### Constraints

- **Browser Compatibility**: Last 2 major versions of each browser
- **Offline Support**: Read-only cache fallback required
- **Time Zone**: America/Chicago (configurable via env var)
- **Shiftboard Rate Limits**: Unknown; implement exponential backoff
- **Data Freshness**: <60 seconds for manual refresh
- **Max Dataset**: 10,000 shifts (100 pages × 100 batch size)

### Scale/Scope

- **Concurrent Users**: 10-50 typical, 100 peak
- **Data Volume**: 150-500 shifts during events
- **API Endpoints**: 13 REST endpoints
- **UI Components**: ~25 React components
- **Lines of Code (Estimated)**: 8,000-10,000 (backend: 3k, frontend: 5-6k, tests: 2-3k)

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: API-First Architecture ✅

**Requirement**: All features exposed through RESTful API; client never handles Shiftboard credentials.

**Implementation**:

- ✅ Express backend proxies all Shiftboard calls
- ✅ HMAC authentication isolated to backend service
- ✅ Consistent error format: `{error: string}`
- ✅ Timing metadata in all responses
- ✅ Environment-based credential management

**Gates**:

- [ ] All API endpoints follow REST conventions (GET/POST, proper status codes)
- [ ] No Shiftboard credentials in client code
- [ ] API contract tests validate response schemas
- [ ] Error responses always return JSON with `error` field

**Status**: PASS (design compliant)

---

### Principle II: Resilient Data Access ✅

**Requirement**: Graceful degradation through local caching when external dependencies fail.

**Implementation**:

- ✅ IndexedDB cache with 4 object stores
- ✅ Automatic fallback on API failure
- ✅ `isFreshData` flag distinguishes live vs cached
- ✅ Last sync timestamp tracking
- ✅ Read-only offline mode

**Gates**:

- [ ] Cache stores all entity types (shifts, accounts, workgroups)
- [ ] API failure triggers automatic cache read
- [ ] UI indicates stale data state
- [ ] Cache survives page reloads
- [ ] Manual refresh always attempts live fetch first

**Status**: PASS (design compliant)

---

### Principle III: Real-Time Operations ✅

**Requirement**: Current shift data readily accessible with clear freshness indicators.

**Implementation**:

- ✅ Manual "Refresh Now" button (always available)
- ✅ Auto-refresh (5/10/15 min configurable)
- ✅ Timestamp display of last successful sync
- ✅ Force-sync flag on user-initiated actions
- ✅ Loading states differentiated (initial vs refresh)

**Gates**:

- [ ] Manual refresh forces API call
- [ ] Auto-refresh interval configurable (off/5/10/15)
- [ ] Changing interval triggers immediate refresh
- [ ] Timestamp updates only on successful API response
- [ ] Loading indicators visible during refresh

**Status**: PASS (design complian )

---

### Principle IV: User-Centered Design ✅

**Requirement**: Interface supports different operational use cases through multiple views.

**Implementation**:

- ✅ Two primary views: Calendar (timeline) + Tabular (sortable table)
- ✅ Global workgroup filter with session persistence
- ✅ WCAG AA compliance (color contrast, keyboard nav)
- ✅ Responsive design (min 1024px)
- ✅ Modals for shift/person details (minimize clutter)

**Gates**:

- [ ] Both views render same dataset differently
- [ ] Workgroup filter applies to both views
- [ ] Keyboard navigation functional (tab order, ESC to close)
- [ ] Color contrast ratios meet WCAG AA
- [ ] Layout adapts to viewport 1024px-1920px

**Status**: PASS (design compliant)

---

### Principle V: Security & Compliance ✅

**Requirement**: PII protected with appropriate access controls and transport security.

**Implementation**:

- ✅ Phone numbers visible only in Person Detail Modal
- ✅ HTTPS enforced in production
- ✅ Credentials in environment variables / Key Vault
- ✅ CORS restricted to allowed origins
- ✅ Helmet.js security headers

**Gates**:

- [ ] Phone numbers not displayed in table/calendar views
- [ ] Production deployment uses HTTPS
- [ ] No credentials in source code
- [ ] CORS whitelist configured
- [ ] Security headers present (CSP, X-Frame-Options, etc.)

**Status**: PASS (design compliant)

---

### Principle VI: Observable Systems ✅

**Requirement**: Operational visibility for debugging and performance monitoring.

**Implementation**:

- ✅ Structured timing metrics (fetch, grouping durations)
- ✅ Morgan HTTP logging + Winston structured logs
- ✅ Health check endpoint (`/api/system/health`)
- ✅ ErrorBoundary with stack traces
- ✅ Differentiated loading states

**Gates**:

- [ ] All API responses include timing metadata
- [ ] Logs written in JSON format (structured)
- [ ] Health check returns uptime and status
- [ ] Client errors captured by ErrorBoundary
- [ ] Performance metrics logged (shift counts, durations)

**Status**: PASS (design compliant)

---

### Principle VII: Cloud-Native Infrastructure ✅

**Requirement**: Deployable as cloud-native infrastructure with configuration-driven multi-tenancy.

**Implementation**:

- ✅ All Azure infrastructure provisioned via Bicep templates
- ✅ CI/CD automated through GitHub Actions
- ✅ Environment configuration drives instance isolation (no hardcoded org data)
- ✅ Resource provisioning supports elastic scaling (spin-up/spin-down)
- ✅ Application architecture is Shiftboard-generic (public repo compatible)
- ✅ Secrets managed through Azure Key Vault
- ✅ Deployment configuration accepts parameters for multi-tenant instances

**Gates**:

- [ ] Bicep templates provision all Azure resources (App Service, Key Vault, App Insights)
- [ ] GitHub Actions workflow automates infrastructure + application deployment
- [ ] No organization/committee-specific data hardcoded in source
- [ ] Deployment accepts parameters for different instances
- [ ] Infrastructure can be created in <15 minutes
- [ ] `destroy.sh` script cleanly removes all resources (spin-down)
- [ ] Key Vault integration works via managed identity
- [ ] Repository can be cloned publicly without exposing secrets

**Status**: PASS (design compliant)

---

### Summary

**All 6 constitutional principles satisfied by design.**

No gates failed. Proceed to implementation.

---

## Project Structure

### Documentation

```text
.specify/
├── analysis/
│   ├── README.md                    # Analysis summary (existing)
│   ├── codebase-spec.md            # Feature specification (existing)
│   ├── api-contracts.md            # API contracts (existing)
│   └── enhancements.md             # Enhancement roadmap (existing)
├── memory/
│   └── constitution.md             # Project constitution (existing)
├── plans/
│   └── rebuild-plan.md             # This file
└── templates/                       # Plan/spec templates (existing)

docs/
├── architecture.md                  # High-level architecture (NEW)
├── deployment.md                    # Deployment guide & parameters (NEW)
└── testing.md                       # Testing strategy (NEW)

infra/                               # Infrastructure as Code (NEW)
├── main.bicep                       # Main orchestration template
├── modules/
│   ├── container-registry.bicep     # Azure Container Registry
│   ├── container-apps-env.bicep     # Container Apps Environment + Log Analytics
│   ├── container-app.bicep          # Container App with scale config
│   ├── key-vault.bicep              # Key Vault with secrets
│   ├── app-insights.bicep           # Application Insights
│   └── networking.bicep             # VNet/subnet (optional)
├── params/
│   ├── dev.json                     # Development environment parameters
│   ├── staging.json                 # Staging environment parameters
│   └── prod.json                    # Production environment parameters (template)
└── scripts/
    ├── deploy.sh                    # Deployment automation script
    ├── destroy.sh                   # Cleanup/spin-down script
    └── validate.sh                  # Pre-deployment validation
```

### Source Code (Web Application)

```text
backend/
├── src/
│   ├── index.ts                    # Express app entry point
│   ├── config/
│   │   ├── api.config.ts          # Shiftboard credentials
│   │   ├── cors.config.ts         # CORS whitelist
│   │   └── logger.config.ts       # Winston configuration
│   ├── controllers/
│   │   ├── account.controller.ts
│   │   ├── calendar.controller.ts
│   │   ├── role.controller.ts
│   │   ├── shift.controller.ts
│   │   ├── system.controller.ts
│   │   └── workgroup.controller.ts
│   ├── services/
│   │   ├── shiftboard.service.ts  # Shiftboard API client
│   │   ├── shift.service.ts       # Shift business logic
│   │   ├── account.service.ts
│   │   ├── workgroup.service.ts
│   │   └── role.service.ts
│   ├── middleware/
│   │   ├── error.middleware.ts    # Global error handler
│   │   ├── validation.middleware.ts # Zod validators
│   │   └── logger.middleware.ts   # Request logging
│   ├── utils/
│   │   ├── shift.utils.ts         # Grouping algorithm
│   │   ├── shiftboard-auth.ts     # HMAC signature
│   │   ├── pagination.ts          # Multi-page fetching
│   │   └── metrics.ts             # Performance tracking
│   ├── routes/
│   │   ├── index.ts               # Route aggregator
│   │   ├── account.routes.ts
│   │   ├── shift.routes.ts
│   │   ├── workgroup.routes.ts
│   │   ├── role.routes.ts
│   │   ├── calendar.routes.ts
│   │   └── system.routes.ts
│   ├── types/
│   │   ├── shiftboard.types.ts    # Shiftboard API types
│   │   ├── api.types.ts           # Internal API types
│   │   └── config.types.ts
│   └── validators/
│       ├── shift.validators.ts    # Zod schemas
│       └── common.validators.ts
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── shift.utils.test.ts
│   │   │   ├── shiftboard-auth.test.ts
│   │   │   └── pagination.test.ts
│   │   └── services/
│   │       └── shift.service.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── shifts.test.ts
│   │   │   ├── accounts.test.ts
│   │   │   └── workgroups.test.ts
│   │   └── mocks/
│   │       └── shiftboard-mock.ts  # MSW handlers
│   └── contract/
│       └── api-contract.test.ts    # Validate against api-contracts.md
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── Dockerfile

frontend/
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Router + providers
│   ├── components/
│   │   ├── Calendar/
│   │   │   ├── ActiveShiftsView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── TabularShiftView.tsx
│   │   │   ├── ShiftDetailModal.tsx
│   │   │   └── PersonDetailModal.tsx
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── Filters/
│   │   │   └── WorkgroupFilter.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── LoadingSpinner.tsx
│   ├── contexts/
│   │   └── WorkgroupContext.tsx
│   ├── stores/
│   │   └── refreshStore.ts        # Zustand for refresh state
│   ├── services/
│   │   ├── api.service.ts
│   │   └── db.service.ts          # IndexedDB wrapper
│   ├── hooks/
│   │   ├── useShifts.ts           # Data fetching hook
│   │   ├── useWorkgroups.ts
│   │   └── useRefresh.ts
│   ├── utils/
│   │   ├── date.utils.ts
│   │   └── formatting.utils.ts
│   ├── types/
│   │   ├── shift.types.ts
│   │   ├── account.types.ts
│   │   └── api.types.ts
│   ├── theme/
│   │   └── theme.ts               # MUI theme
│   └── pages/
│       └── CalendarPage.tsx
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── api.service.test.ts
│   │   │   └── db.service.test.ts
│   │   └── utils/
│   │       └── date.utils.test.ts
│   ├── integration/
│   │   └── components/
│   │       ├── ActiveShiftsView.test.tsx
│   │       └── TabularShiftView.test.tsx
│   └── e2e/
│       ├── critical-flows.spec.ts
│       └── playwright.config.ts
├── public/
│   ├── manifest.json              # PWA manifest
│   └── service-worker.js          # Service worker (Phase 2)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── index.html

.github/
└── workflows/
    ├── backend-tests.yml          # CI for backend (lint, test, build)
    ├── frontend-tests.yml         # CI for frontend (lint, test, build)
    ├── bicep-validate.yml         # Validate Bicep templates on PR
    └── deploy.yml                 # CD: Deploy infrastructure + application to Azure
```

**Structure Decision**: Web application pattern selected due to separate API and client layers. Backend serves as stateless proxy; frontend is SPA with client-side routing.

---

## Phase 0: Setup & Foundation (Week 1-2)

**Goal**: Project scaffolding, tooling, and development environment.

### Prerequisites

- [ ] Node.js 20.x LTS installed
- [ ] Git repository initialized
- [ ] Shiftboard API credentials obtained
- [ ] Azure subscription ready (production deployment)

### Tasks

#### T001: Repository & Tooling Setup

**Owner**: DevOps Lead  
**Effort**: 4 hours

- [x] Initialize monorepo (or separate repos)
- [x] Configure ESLint + Prettier (shared config)
- [x] Set up Husky pre-commit hooks (lint + format)
- [x] Configure TypeScript (strict mode enabled)
- [x] Add `.gitignore` (node_modules, .env, dist, coverage)
- [x] Create `.env.example` files (backend + frontend)

**Acceptance**:

- `npm run lint` passes on empty project
- Pre-commit hook prevents commits with lint errors
- TypeScript strict mode enabled in tsconfig

---

#### T002: Backend Project Initialization

**Owner**: Backend Developer  
**Effort**: 4 hours

- [x] `npm init` in `/backend`
- [x] Install dependencies (Express, Axios, Helmet, CORS, Winston, Zod)
- [x] Install dev dependencies (Jest, Supertest, ts-node, nodemon)
- [x] Configure `tsconfig.json` (target: ES2022, module: commonjs)
- [x] Configure `jest.config.js` (coverage thresholds: 70%)
- [x] Create basic Express app skeleton
- [x] Add `npm scripts`: dev, build, test, lint

**Acceptance**:

- [x] `npm run dev` starts server on port 3000
- [x] `npm test` runs Jest (0 tests)
- [x] TypeScript compilation works (`npm run build`)

---

#### T003: Frontend Project Initialization

**Owner**: Frontend Developer  
**Effort**: 4 hours

- [x] Create Vite project: `npm create vite@latest frontend -- --template react-ts`
- [x] Install dependencies (MUI, react-router-dom, Axios, idb, date-fns, Zustand)
- [x] Install dev dependencies (Vitest, Testing Library, Playwright, MSW)
- [x] Configure `vite.config.ts` (proxy to backend, build optimizations)
- [x] Configure `vitest.config.ts` (coverage: 70%)
- [x] Configure Playwright (`npx playwright install`)
- [x] Add `npm scripts`: dev, build, test, test:e2e

**Acceptance**:

- [x] `npm run dev` starts Vite dev server on port 5173
- [x] `npm test` runs Vitest (0 tests)
- [x] Playwright launches browser (`npm run test:e2e`)

---

#### T004: Docker & Local Development Setup

**Owner**: DevOps Lead  
**Effort**: 6 hours

- [x] Create `backend/Dockerfile` (multi-stage build)
- [x] Create `frontend/Dockerfile`
- [x] Create `docker-compose.yml` (backend + frontend + optional Redis)
- [x] Document local setup in `README.md`
- [x] Add `.dockerignore` files

**Acceptance**:

- [x] `docker-compose up` starts both services
- [x] Backend accessible at localhost:3000
- [x] Frontend accessible at localhost:5173 (dev) or 8080 (prod)

---

#### T005: CI/CD Pipeline Setup

**Owner**: DevOps Lead  
**Effort**: 8 hours

- [x] Create `.github/workflows/backend-tests.yml` (lint, test, build)
- [x] Create `.github/workflows/frontend-tests.yml` (lint, test, build)
- [x] Create `.github/workflows/deploy.yml` (deploy to Azure on main push)
- [ ] Configure GitHub secrets (Shiftboard credentials, Azure credentials)
- [ ] Add status badges to README

**Acceptance**:

- [x] Pull requests trigger automated tests
- [x] Failed tests block merge
- [x] Push to main triggers deployment

---

#### T006: Infrastructure as Code (Bicep) Setup

**Owner**: DevOps Lead  
**Effort**: 8 hours  
**Status**: ✅ COMPLETE (Core implementation)

Create Bicep templates for Azure infrastructure provisioning:

- [x] Create `infra/main.bicep` (main orchestration template)
- [x] Create `infra/modules/container-registry.bicep` (Azure Container Registry)
- [x] Create `infra/modules/container-apps-env.bicep` (Container Apps Environment + Log Analytics)
- [x] Create `infra/modules/container-app.bicep` (Container App with scale-to-zero config)
- [ ] Create `infra/modules/key-vault.bicep` (Key Vault with secrets) - Deferred to Phase 6
- [ ] Create `infra/modules/app-insights.bicep` (Application Insights) - Deferred to Phase 6
- [ ] Create `infra/params/dev.json` (development parameters template) - Using inline parameters
- [ ] Create `infra/params/staging.json` (staging parameters template) - Using inline parameters
- [ ] Create `infra/params/prod.json` (production parameters template) - Using inline parameters
- [x] Create deployment automation script (`scripts/deploy-infrastructure.sh`)
- [x] Create cleanup/spin-down script (`scripts/destroy-infrastructure.sh`)
- [ ] Create `infra/scripts/validate.sh` (pre-deployment validation) - Integrated into deploy script
- [x] Document deployment in `infra/README.md` and `scripts/README.md`
- [x] Create GitHub infrastructure workflow (`.github/workflows/infrastructure.yml`)
- [x] Update deployment workflow to check for infrastructure (`.github/workflows/deploy.yml`)

**Key Features Implemented**:

- ✅ Scale-to-zero configuration (minReplicas: 0, maxReplicas: 3)
- ✅ Log Analytics integration for centralized logging (30-day retention)
- ✅ Container Registry with admin user (dev) for simplified deployment
- ✅ External HTTPS ingress with automatic SSL/TLS
- ✅ Environment parameter support (dev/staging/prod)
- ✅ Resource naming with unique suffix: `{appName}-{uniqueSuffix}`
- ✅ Infrastructure workflow with path filtering (`infra/**`)
- ✅ Deployment workflow checks infrastructure exists before deploying
- ✅ Bicep validation passes (`az bicep build` successful)

**Features Deferred to Phase 6 (Observability & Security)**:

- ⏸️ Key Vault integration for secrets (using registry admin credentials for now)
- ⏸️ Managed identity for Container App → Key Vault access
- ⏸️ Application Insights auto-instrumentation
- ⏸️ Advanced monitoring and alerting

**Acceptance**:

- [x] Bicep templates validate without errors (`az bicep build`)
- [x] `deploy-infrastructure.sh` can provision full infrastructure
- [x] Infrastructure workflow triggers on `infra/**` changes
- [x] Deployment workflow checks for infrastructure before deploying
- [x] Scale-to-zero configured (app can scale to 0 replicas)
- [x] Comprehensive documentation in `infra/README.md`
- [ ] End-to-end deployment tested in Azure (requires Azure subscription)

**Reference**: `constitution.md` § Principle VII (Cloud-Native Infrastructure)

---

### Phase 0 Deliverables

- [x] Project structure created
- [x] All dependencies installed
- [x] TypeScript + linting configured
- [x] Testing frameworks ready
- [x] Docker setup functional
- [x] CI/CD pipelines active
- [x] Bicep infrastructure templates ready

**Duration**: 1-2 weeks (depending on tooling familiarity)  
**Status**: ✅ COMPLETE

---

## Phase 1: Core Backend (Week 3-4)

**Goal**: Implement API layer with Shiftboard integration and shift grouping.

### T101: Shiftboard Authentication Utility

**Owner**: Backend Developer  
**Effort**: 4 hours

**Implementation**: `backend/src/utils/shiftboard-auth.ts`

- [ ] Implement HMAC SHA-1 signature generation
- [ ] Build authenticated URL constructor
- [ ] Support query parameter serialization
- [ ] Add timestamp generation

**Tests**: `backend/tests/unit/utils/shiftboard-auth.test.ts`

- [ ] Test signature generation with known inputs
- [ ] Test URL construction
- [ ] Test timestamp handling

**Reference**: `api-contracts.md` § Shiftboard API Integration

---

#### T102: Pagination Utility

**Owner**: Backend Developer  
**Effort**: 3 hours

**Implementation**: `backend/src/utils/pagination.ts`

- [ ] Implement multi-page fetching logic
- [ ] Add 100-page safety limit
- [ ] Log warnings when approaching limit
- [ ] Merge paginated results

**Tests**: `backend/tests/unit/utils/pagination.test.ts`

- [ ] Test single-page response
- [ ] Test multi-page fetching
- [ ] Test safety limit (stops at 100)
- [ ] Test result merging

**Reference**: `api-contracts.md` § Pagination Handling

---

#### T103: Shift Grouping Algorithm

**Owner**: Backend Developer  
**Effort**: 6 hours

**Implementation**: `backend/src/utils/shift.utils.ts`

- [ ] Implement `groupShiftsByAttributes` function
- [ ] Grouping key: name + start + end + workgroup + subject + location
- [ ] Build arrays: assignedPeople, assignedPersonNames, clockStatuses
- [ ] Handle edge cases (missing fields, invalid shifts, duplicates)

**Tests**: `backend/tests/unit/utils/shift.utils.test.ts`

- [ ] Test basic grouping (2 shifts → 1 group)
- [ ] Test no grouping needed (different times)
- [ ] Test edge cases (missing member, null clocked_in)
- [ ] Test performance (1000 shifts <50ms)

**Reference**: `codebase-spec.md` § Shift Grouping Algorithm

---

#### T104: Shiftboard Service Client

**Owner**: Backend Developer  
**Effort**: 8 hours

**Implementation**: `backend/src/services/shiftboard.service.ts`

- [ ] Implement generic RPC call method
- [ ] Support method dispatch: shift.whosOn, shift.list, account.list, etc.
- [ ] Integrate authentication utility
- [ ] Integrate pagination utility
- [ ] Add error handling (Axios errors, Shiftboard API errors)
- [ ] Add request logging

**Tests**: `backend/tests/integration/services/shiftboard.service.test.ts`

- [ ] Mock Shiftboard API with MSW
- [ ] Test successful call
- [ ] Test authentication failure
- [ ] Test network timeout
- [ ] Test paginated response

---

#### T105: Shift Service (Business Logic)

**Owner**: Backend Developer  
**Effort**: 8 hours

**Implementation**: `backend/src/services/shift.service.ts`

- [ ] Implement `shiftList` method
- [ ] Implement `shiftWhosOn` method
  - [ ] Call Shiftboard with timeclock_status=true, extended=true
  - [ ] Fetch all pages
  - [ ] Apply shift grouping
  - [ ] Collect metrics (original count, grouped count, clocked-in count, durations)
- [ ] Add workgroup filtering

**Tests**: `backend/tests/unit/services/shift.service.test.ts`

- [ ] Test shiftWhosOn grouping applied
- [ ] Test workgroup filter passed to Shiftboard
- [ ] Test metrics collection
- [ ] Test error propagation

**Reference**: `codebase-spec.md` § F6: API Layer

---

#### T106: Controllers (Request Handlers)

**Owner**: Backend Developer  
**Effort**: 6 hours

**Implementation**: `backend/src/controllers/*.controller.ts`

Create controllers for:

- [ ] `shift.controller.ts` (listShifts, whosOn)
- [ ] `account.controller.ts` (listAccounts, getSelf, getByWorkgroup, getById)
- [ ] `workgroup.controller.ts` (listWorkgroups, getRoles)
- [ ] `role.controller.ts` (getRole, listRoles)
- [ ] `calendar.controller.ts` (getSummary - stub)
- [ ] `system.controller.ts` (health, echo)

Each controller:

- [ ] Extract query params
- [ ] Validate with Zod
- [ ] Call service method
- [ ] Format response with timing metadata
- [ ] Handle errors

**Tests**: Covered by integration tests (T108)

---

#### T107: Routes & Middleware

**Owner**: Backend Developer  
**Effort**: 4 hours

**Implementation**:

- `backend/src/routes/*.routes.ts`
- `backend/src/middleware/error.middleware.ts`
- `backend/src/middleware/validation.middleware.ts`

- [ ] Define routes for each controller
- [ ] Wire up Express Router
- [ ] Implement error middleware (convert to {error: string} format)
- [ ] Implement validation middleware (Zod schemas)
- [ ] Add CORS configuration
- [ ] Add Helmet security headers
- [ ] Add Morgan request logging

**Reference**: `api-contracts.md` § Endpoints

---

#### T108: API Integration Tests

**Owner**: Backend Developer  
**Effort**: 8 hours

**Implementation**: `backend/tests/integration/api/*.test.ts`

Test each endpoint against contract:

- [ ] `/api/shifts/whos-on` (with/without workgroup filter)
- [ ] `/api/shifts/list`
- [ ] `/api/accounts/list`, `/api/accounts/self`, `/api/accounts/workgroup/:id`
- [ ] `/api/workgroups/list`, `/api/workgroups/:id/roles`
- [ ] `/api/roles/:id`, `/api/roles/list`
- [ ] `/api/system/health`, `/api/system/echo`

Each test:

- [ ] Verify response schema matches api-contracts.md
- [ ] Verify status codes
- [ ] Verify error format
- [ ] Verify timing metadata present

**Tools**: Supertest + MSW (mock Shiftboard)

---

#### T109: Contract Tests

**Owner**: Backend Developer  
**Effort**: 6 hours

**Implementation**: `backend/tests/contract/api-contract.test.ts`

- [ ] Load api-contracts.md
- [ ] Parse endpoint specifications
- [ ] Generate test cases from spec
- [ ] Validate response schemas automatically
- [ ] Fail on contract violations

**Optional Tool**: JSON Schema validation or custom validator

---

### Phase 1 Deliverables

- [ ] Backend API fully functional (13 endpoints)
- [ ] Shiftboard integration working
- [ ] Shift grouping algorithm tested (<50ms for 1000 shifts)
- [ ] 70%+ test coverage on backend
- [ ] All contract tests passing

**Duration**: 2 weeks

---

## Phase 2: Core Frontend (Week 5-6)

**Goal**: Implement UI components, state management, and IndexedDB cache.

### T201: IndexedDB Service

**Owner**: Frontend Developer  
**Effort**: 6 hours

**Implementation**: `frontend/src/services/db.service.ts`

- [ ] Initialize DB with 4 stores (shifts, accounts, workgroups, metadata)
- [ ] Create workgroup index on shifts store
- [ ] Implement CRUD operations:
  - [ ] `storeShifts(shifts)` - upsert
  - [ ] `getShiftsByWorkgroup(id)` - read with index
  - [ ] `storeAccounts(accounts)`
  - [ ] `getAllAccounts()`
  - [ ] `storeWorkgroups(workgroups)`
  - [ ] `getAllWorkgroups()`
  - [ ] `updateLastSync()` - set timestamp
  - [ ] `getLastSync()` - get Date
  - [ ] `getLastSyncFormatted()` - get formatted string

**Tests**: `frontend/tests/unit/services/db.service.test.ts`

- [ ] Test store creation
- [ ] Test upsert (add then update)
- [ ] Test workgroup filtering
- [ ] Test last sync timestamp

**Reference**: `codebase-spec.md` § F7: Local Cache

---

#### T202: API Service

**Owner**: Frontend Developer  
**Effort**: 6 hours

**Implementation**: `frontend/src/services/api.service.ts`

- [ ] Create Axios instance (baseURL, timeout: 60s)
- [ ] Implement `getWorkgroupShifts(forceSync, workgroupId)`
  - [ ] Check cache if !forceSync
  - [ ] Fetch from API
  - [ ] Store in IndexedDB
  - [ ] Update last sync
  - [ ] Return with isFreshData flag
  - [ ] On error, fall back to cache
- [ ] Implement `getWorkgroups()`
- [ ] Implement `getAccounts()`

**Tests**: `frontend/tests/unit/services/api.service.test.ts`

- [ ] Mock Axios with MSW
- [ ] Test successful fetch
- [ ] Test cache fallback on error
- [ ] Test isFreshData flag accuracy

**Reference**: `codebase-spec.md` § Data Flow

---

#### T203: Theme & Layout Shell

**Owner**: Frontend Developer  
**Effort**: 4 hours

**Implementation**:

- `frontend/src/theme/theme.ts`
- `frontend/src/components/Layout/AppLayout.tsx`
- `frontend/src/components/Layout/AppHeader.tsx`
- `frontend/src/components/Layout/Sidebar.tsx`

- [ ] Define MUI theme (navy primary color)
- [ ] Create AppLayout with header, sidebar, outlet
- [ ] Implement refresh state management (refreshTimestamp, triggerRefresh)
- [ ] Pass refresh context via Outlet
- [ ] Add navigation links (Calendar, Tabular View)

**Tests**: `frontend/tests/integration/components/AppLayout.test.tsx`

- [ ] Test rendering
- [ ] Test refresh trigger
- [ ] Test navigation

---

#### T204: Workgroup Context & Filter

**Owner**: Frontend Developer  
**Effort**: 4 hours

**Implementation**:

- `frontend/src/contexts/WorkgroupContext.tsx`
- `frontend/src/components/Filters/WorkgroupFilter.tsx`

- [ ] Create WorkgroupContext (selectedWorkgroup, workgroups, setters)
- [ ] Load cached workgroups on mount
- [ ] Implement WorkgroupFilter dropdown
  - [ ] "All workgroups" option (null value)
  - [ ] Alphabetical workgroup list
- [ ] Integrate into AppHeader

**Tests**: `frontend/tests/unit/contexts/WorkgroupContext.test.tsx`

- [ ] Test context provider
- [ ] Test default state
- [ ] Test selection change

**Reference**: `codebase-spec.md` § F3: Workgroup Filter

---

#### T205: Tabular Shift View

**Owner**: Frontend Developer  
**Effort**: 12 hours

**Implementation**: `frontend/src/components/Calendar/TabularShiftView.tsx`

- [ ] Create MUI Table with columns: Start, End, Name, Subject, Location, Assigned, Status, Actions
- [ ] Implement sorting (click header to toggle asc/desc)
- [ ] Implement person chips (clickable, colored by clock status)
- [ ] Implement status chip (All Clocked In / Not Clocked In / X/Y)
- [ ] Fetch data on mount and refresh
- [ ] Handle loading states (initial vs refresh)
- [ ] Display last sync timestamp
- [ ] Add animation on data update (Fade/Grow)

**Tests**: `frontend/tests/integration/components/TabularShiftView.test.tsx`

- [ ] Test rendering with mock data
- [ ] Test sorting (click header)
- [ ] Test person chip click opens modal
- [ ] Test refresh updates data

**Reference**: `codebase-spec.md` § F2: Tabular Shift View

---

#### T206: Active Shifts View (Timeline)

**Owner**: Frontend Developer  
**Effort**: 16 hours (complex)

**Implementation**: `frontend/src/components/Calendar/ActiveShiftsView.tsx`

- [ ] Calculate dynamic time window (current hour ±1, expand for active shifts)
- [ ] Render hourly columns
- [ ] Position shift cards based on start/end times
- [ ] Handle overlapping shifts (stagger with offsets)
- [ ] Render current time indicator line
- [ ] Implement "Too many shifts" guard (>25 threshold)
- [ ] Add "Show anyway" option
- [ ] Update current time every second

**Tests**: `frontend/tests/integration/components/ActiveShiftsView.test.tsx`

- [ ] Test time window calculation
- [ ] Test shift card rendering
- [ ] Test overlap detection
- [ ] Test too-many-shifts guard

**Reference**: `codebase-spec.md` § F1: Active Shifts Timeline View

---

#### T207: Modals (Shift & Person Detail)

**Owner**: Frontend Developer  
**Effort**: 8 hours

**Implementation**:

- `frontend/src/components/Calendar/ShiftDetailModal.tsx`
- `frontend/src/components/Calendar/PersonDetailModal.tsx`

**Shift Detail Modal**:

- [ ] Display shift name, time, location, subject
- [ ] List assigned people with clock status badges
- [ ] Person name clickable → opens Person Detail Modal
- [ ] Close button + ESC key + click outside

**Person Detail Modal**:

- [ ] Display person name, clock status badge
- [ ] Show phone number (formatted)
- [ ] Add Call button (tel: link)
- [ ] Add Text button (sms: link)
- [ ] Close button + ESC key + click outside

**Tests**: `frontend/tests/integration/components/Modals.test.tsx`

- [ ] Test ShiftDetailModal rendering
- [ ] Test PersonDetailModal rendering
- [ ] Test closing mechanisms
- [ ] Test phone action links

**Reference**: `codebase-spec.md` § F4, F5

---

#### T208: Error Boundary

**Owner**: Frontend Developer  
**Effort**: 2 hours

**Implementation**: `frontend/src/components/ErrorBoundary.tsx`

- [ ] Create React class component with getDerivedStateFromError
- [ ] Render MUI Alert on error
- [ ] Log to console
- [ ] Display error message

**Tests**: `frontend/tests/unit/components/ErrorBoundary.test.tsx`

- [ ] Test error catching
- [ ] Test error display

**Reference**: `codebase-spec.md` § F8: Error Handling

---

#### T209: Router & Pages

**Owner**: Frontend Developer  
**Effort**: 3 hours

**Implementation**:

- `frontend/src/App.tsx`
- `frontend/src/pages/CalendarPage.tsx`

- [ ] Set up react-router-dom
- [ ] Define routes: `/` → CalendarPage, `/tabular-view` → TabularShiftView
- [ ] Wrap with WorkgroupProvider, ThemeProvider, ErrorBoundary
- [ ] CalendarPage renders ActiveShiftsView + DayView

**Tests**: Covered by E2E tests (T210)

---

#### T210: E2E Tests (Critical Flows)

**Owner**: QA Engineer  
**Effort**: 12 hours

**Implementation**: `frontend/tests/e2e/critical-flows.spec.ts`

**Test Scenarios**:

1. **View Calendar**:
   - [ ] Load app → See calendar view
   - [ ] Shifts displayed in timeline
   - [ ] Current time indicator visible

2. **Filter by Workgroup**:
   - [ ] Select workgroup → Data updates
   - [ ] Both views show filtered data
   - [ ] Selection persists during session

3. **Tabular View**:
   - [ ] Navigate to /tabular-view
   - [ ] Table renders
   - [ ] Click header → Sort changes

4. **Shift Details**:
   - [ ] Click shift card → Modal opens
   - [ ] Modal shows shift details
   - [ ] Close modal → Returns to view

5. **Person Contact**:
   - [ ] Click person chip → Person modal opens
   - [ ] Phone number visible
   - [ ] Call/Text buttons present

6. **Manual Refresh**:
   - [ ] Click Refresh Now → Loading indicator
   - [ ] Data updates
   - [ ] Timestamp changes

**Tools**: Playwright

**Reference**: `codebase-spec.md` § Testing Strategy

---

### Phase 2 Deliverables

- [ ] Frontend UI fully functional
- [ ] IndexedDB cache working
- [ ] Both views (calendar + table) rendering correctly
- [ ] Modals functional
- [ ] E2E tests passing (6 critical flows)
- [ ] 70%+ test coverage on frontend

**Duration**: 2 weeks

---

## Phase 3: Integration & Polish (Week 7)

**Goal**: End-to-end integration, accessibility, performance optimization.

### T301: Integration Testing (Frontend + Backend)

**Owner**: QA Engineer  
**Effort**: 8 hours

- [ ] Start both services (docker-compose)
- [ ] Run E2E tests against live backend + mocked Shiftboard
- [ ] Verify API contracts honored
- [ ] Test error scenarios (API down, network timeout)
- [ ] Test cache fallback flow

**Acceptance**: All E2E tests pass with live API

---

#### T302: Accessibility Audit

**Owner**: Frontend Developer  
**Effort**: 6 hours

- [ ] Run Axe DevTools on all pages
- [ ] Fix color contrast issues (WCAG AA)
- [ ] Verify keyboard navigation (tab order, focus indicators)
- [ ] Test with screen reader (VoiceOver / NVDA)
- [ ] Add ARIA labels where needed
- [ ] Verify focus trap in modals

**Acceptance**:

- No Axe violations
- All interactive elements keyboard-accessible
- Screen reader announces content correctly

**Reference**: `codebase-spec.md` § F9: Accessibility

---

#### T303: Performance Optimization

**Owner**: Frontend Developer  
**Effort**: 6 hours

- [ ] Lazy load modal components
- [ ] Memoize expensive calculations (shift positioning)
- [ ] Add React.memo to shift cards
- [ ] Optimize re-renders (useCallback for event handlers)
- [ ] Run Lighthouse audit
- [ ] Measure render time with 100+ shifts

**Acceptance**:

- Table renders 100 shifts in <300ms
- Calendar renders 25 shifts in <200ms
- Lighthouse Performance score >90

---

#### T304: Security Hardening

**Owner**: Backend Developer  
**Effort**: 4 hours

- [ ] Add rate limiting (express-rate-limit): 100 req/min per IP
- [ ] Add input validation (Zod) to all endpoints
- [ ] Add Content Security Policy header
- [ ] Verify credentials not in code (env vars only)
- [ ] Add request ID to logs (traceability)

**Acceptance**:

- Rate limiting active (test with curl)
- Invalid requests return 400
- CSP header present
- No secrets in git history

---

#### T305: Documentation

**Owner**: Tech Lead  
**Effort**: 6 hours

Create documentation:

- [ ] `docs/architecture.md` (diagrams, data flow)
- [ ] `docs/deployment.md` (Azure setup, env vars)
- [ ] `docs/testing.md` (how to run tests)
- [ ] `README.md` (setup instructions, scripts)
- [ ] API documentation (generate from OpenAPI or manual)

**Acceptance**: New developer can set up project using docs only

---

#### T306: Production Build & Smoke Tests

**Owner**: DevOps Lead  
**Effort**: 4 hours

- [ ] Build Docker images for production
- [ ] Test production build locally
- [ ] Verify static file serving (frontend served from backend in prod)
- [ ] Test health check endpoint
- [ ] Test with production-like env vars

**Acceptance**:

- Production build runs without errors
- Health check returns 200
- Static frontend accessible

---

### Phase 3 Deliverables

- [ ] Integration tests passing
- [ ] Accessibility audit clean
- [ ] Performance targets met
- [ ] Security hardened
- [ ] Documentation complete
- [ ] Production build ready

**Duration**: 1 week

---

## Phase 4: Deployment & Monitoring (Week 8)

**Goal**: Deploy to production, set up monitoring, train users.

### T401: Infrastructure Deployment via Bicep

**Owner**: DevOps Lead  
**Effort**: 4 hours

Deploy Azure infrastructure using Bicep templates created in Phase 0 (T006):

- [ ] Validate Bicep templates (`infra/scripts/validate.sh`)
- [ ] Create Azure Resource Group
- [ ] Create Azure Container Registry
- [ ] Build and push initial Docker image to ACR
- [ ] Configure deployment parameters file with environment-specific values
- [ ] Populate Key Vault secrets (Shiftboard credentials)
- [ ] Execute infrastructure deployment (`infra/scripts/deploy.sh`)
- [ ] Verify managed identity for Container App → Key Vault access
- [ ] Verify health check endpoint responds
- [ ] Configure custom domain + SSL certificate (if applicable)
- [ ] Document deployment parameters used

**Key Deployment Commands**:

```bash
# Validate templates
az bicep build --file infra/main.bicep

# Create resource group
az group create --name rg-shifts-{orgId}-{env} --location eastus

# Create Container Registry and push image
az acr create --name acrshifts{orgId} --sku Basic
docker build -t acrshifts{orgId}.azurecr.io/shifts-dashboard:v1.0.0 .
az acr login --name acrshifts{orgId}
docker push acrshifts{orgId}.azurecr.io/shifts-dashboard:v1.0.0

# Deploy infrastructure with Container Apps
az deployment group create \
  --resource-group rg-shifts-{orgId}-{env} \
  --template-file infra/main.bicep \
  --parameters @infra/params/{env}.json \
               organizationId={orgId} \
               imageTag=v1.0.0 \
               shiftboardAccessKey=@secure-param \
               shiftboardSecretKey=@secure-param
```

**Multi-Tenant Testing**:

- [ ] Deploy dev environment for testing
- [ ] Deploy staging environment with different organizationId
- [ ] Verify instances are isolated (separate Container Apps, Key Vaults)
- [ ] Verify scale-to-zero: check replicas count after 5 minutes idle
- [ ] Test cold start: first request after scale-to-zero (~3-10 seconds)
- [ ] Test spin-down: `infra/scripts/destroy.sh` removes all resources

**Acceptance**:

- Infrastructure deployed successfully via Bicep
- Container App running with health check returning 200
- Key Vault secrets accessible via managed identity
- Application Insights receiving telemetry
- Scale-to-zero verified (0 replicas when idle)
- Cold start time acceptable (<10 seconds)
- Multiple instances can coexist with different parameters

**Reference**: `codebase-spec.md` § Azure-Native Deployment

---

#### T402: Monitoring Setup

**Owner**: DevOps Lead  
**Effort**: 6 hours

- [ ] Set up Application Insights (or alternative)
- [ ] Configure error tracking (Sentry or App Insights)
- [ ] Set up uptime monitoring (Pingdom or Azure Monitor)
- [ ] Create dashboards (requests/min, error rate, p95 latency)
- [ ] Set up alerts (error rate >1%, health check failing)

**Acceptance**:

- Errors visible in monitoring tool
- Alert triggered by test error
- Dashboard shows live metrics

---

#### T403: Logging Enhancement

**Owner**: Backend Developer  
**Effort**: 3 hours

- [ ] Ensure all logs are JSON-formatted (Winston)
- [ ] Add correlation IDs to requests
- [ ] Log key operations (shift grouping, API calls)
- [ ] Add log levels (debug, info, warn, error)
- [ ] Configure log streaming to Azure or external service

**Acceptance**:

- Production logs are structured JSON
- Can trace single request through logs

---

#### T404: User Acceptance Testing (UAT)

**Owner**: QA Engineer  
**Effort**: 8 hours

- [ ] Share staging environment with stakeholders
- [ ] Conduct walkthrough with shift captains
- [ ] Gather feedback on usability
- [ ] Fix critical bugs discovered
- [ ] Document known limitations

**Acceptance**: Stakeholders approve for production release

---

#### T405: Production Release & Infrastructure Verification

**Owner**: Tech Lead  
**Effort**: 3 hours

**Production Deployment**:

- [ ] Build production Docker image with semantic version tag
- [ ] Push production image to Azure Container Registry
- [ ] Deploy production infrastructure via Bicep (GitHub Actions or manual)
- [ ] Deploy container to Container App
- [ ] Verify health check endpoint (`/api/system/health`)
- [ ] Final smoke test on production (all critical user flows)
- [ ] Verify Application Insights receiving telemetry
- [ ] Test cache fallback scenario (simulate Shiftboard outage)

**Infrastructure Validation**:

- [ ] Verify Key Vault integration (secrets accessible)
- [ ] Verify scale-to-zero behavior (wait 5 minutes idle, check replicas = 0)
- [ ] Test cold start time (first request after scale-to-zero: <10 seconds acceptable)
- [ ] Test spin-down scenario in dev environment (`destroy.sh`)
- [ ] Verify spin-up time (<15 minutes from empty to running)
- [ ] Document actual infrastructure costs (baseline for seasonal budgeting)
- [ ] Test multi-tenant capability: deploy second instance with different organizationId
- [ ] Verify instances are isolated (different Container Apps, separate scaling)

**Release Communication**:

- [ ] Announce to users (email, Slack)
- [ ] Share quick start guide
- [ ] Monitor for first 2 hours (watch error rates, performance, scale events)
- [ ] Document any issues in incident log
- [ ] Schedule post-release retrospective

**Acceptance**:

- Application accessible to users at production URL
- No critical errors in first 2 hours
- Users successfully view shifts, filter workgroups, view contact info
- Scale-to-zero works (0 replicas during idle)
- Cold start acceptable (<10 seconds from 0 to serving requests)
- Infrastructure can be cleanly created and destroyed
- Multi-tenant deployments work with different parameters
- Monthly cost <$5 per instance at scale-to-zero

**Reference**: `constitution.md` § Principle VII (Cloud-Native Infrastructure)

---

### Phase 4 Deliverables

- [ ] Application deployed to production
- [ ] Monitoring and alerting active
- [ ] Users trained
- [ ] Release announced
- [ ] Production stable

**Duration**: 1 week

---

## Testing Strategy

### Test Coverage Goals

- **Backend Unit**: 80% (utils, services)
- **Backend Integration**: 70% (API endpoints)
- **Backend Contract**: 100% (all endpoints validated)
- **Frontend Unit**: 70% (services, utils)
- **Frontend Integration**: 60% (components)
- **E2E**: 100% (6 critical flows)

### Test Pyramid

```
       /\
      /E2E\          6 critical flows (Playwright)
     /------\
    /  Int   \       Component + API integration tests
   /----------\
  /   Unit     \     Utils, services, algorithms
 /--------------\
```

### Test Execution

- **Pre-commit**: Lint + format
- **PR**: All tests + coverage check
- **Pre-deploy**: E2E tests against staging
- **Post-deploy**: Smoke tests in production

### Contract Testing

All API responses validated against `api-contracts.md` spec using custom validator.

**Reference**: `codebase-spec.md` § Testing Strategy

---

## Risk Management

### High Risks

#### R001: Shiftboard API Changes

**Probability**: Medium  
**Impact**: High (app breaks)  
**Mitigation**:

- Contract tests detect breaking changes immediately
- Version API client code for easy rollback
- Maintain communication with Shiftboard support

---

#### R002: Performance Degradation with Large Datasets

**Probability**: Medium  
**Impact**: Medium (slow UX)  
**Mitigation**:

- Performance tests with synthetic 1000-shift dataset
- Virtual scrolling planned for Phase 5 (if needed)
- Pagination at API level limits single-response size

---

#### R003: Browser Cache Corruption

**Probability**: Low  
**Impact**: Medium (user sees errors)  
**Mitigation**:

- Implement cache version in metadata
- Clear cache on version mismatch
- Provide "Clear Cache" button in settings

---

#### R004: Missing Test Coverage

**Probability**: High (tight timeline)  
**Impact**: Medium (regressions)  
**Mitigation**:

- Prioritize critical path tests first
- Block merge on <70% coverage
- Add tests for bugs discovered in QA

---

#### R005: Deployment Issues

**Probability**: Medium  
**Impact**: High (launch delay)  
**Mitigation**:

- Test production build locally first
- Deploy to staging 1 week before production
- Maintain rollback plan (previous Docker image)

---

## Success Criteria

### Phase Completion Gates

**Phase 0 Complete**:

- ✅ All tasks green
- ✅ `docker-compose up` works
- ✅ CI/CD pipelines green

**Phase 1 Complete**:

- ✅ All 13 API endpoints functional
- ✅ Contract tests passing
- ✅ 70%+ backend test coverage
- ✅ Shift grouping <50ms for 1000 shifts

**Phase 2 Complete**:

- ✅ Both views rendering correctly
- ✅ IndexedDB cache working
- ✅ E2E tests passing (6 flows)
- ✅ 70%+ frontend test coverage

**Phase 3 Complete**:

- ✅ Lighthouse Performance >90
- ✅ 0 Axe accessibility violations
- ✅ Security headers present
- ✅ Documentation complete

**Phase 4 Complete**:

- ✅ Production deployment stable
- ✅ Monitoring dashboards live
- ✅ Users successfully using app
- ✅ 0 critical bugs in first week

### Production Readiness Checklist

- [ ] All automated tests passing
- [ ] Manual QA complete
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Documentation published
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Users notified
- [ ] Support process established

---

## Timeline Summary

| Phase                 | Duration  | Team                   | Deliverable                     |
| --------------------- | --------- | ---------------------- | ------------------------------- |
| **Phase 0: Setup**    | 1-2 weeks | DevOps (1)             | Project scaffolding, tooling    |
| **Phase 1: Backend**  | 2 weeks   | Backend (1), QA (0.5)  | API with tests, 70% coverage    |
| **Phase 2: Frontend** | 2 weeks   | Frontend (1), QA (0.5) | UI with E2E tests, 70% coverage |
| **Phase 3: Polish**   | 1 week    | All (2)                | Integration, a11y, security     |
| **Phase 4: Deploy**   | 1 week    | DevOps (1), QA (0.5)   | Production release              |

**Total**: 8-10 weeks with 2 FTE (full-time equivalent)

**Contingency**: +20% (2 weeks) for unforeseen issues

---

## Post-Launch Plan (Week 9+)

### Week 9: Stabilization

- Monitor production metrics
- Fix any high-priority bugs
- Gather user feedback
- Conduct retrospective

### Week 10-12: Quick Wins (Phase 5a)

Implement quick enhancements from `enhancements.md`:

- E11: Dark Mode (4 hours)
- E12: Keyboard Shortcuts (4 hours)
- E13: Export to CSV (1 day)
- E15: Analytics Integration (4 hours)

### Month 4-6: Phase 5b Enhancements

Implement high-priority enhancements:

- E1: Offline-First PWA (4 days)
- E2: Advanced Filtering UI (2 days)
- E3: Search Functionality (2 days)
- E7: Performance Optimization (3 days)

**Reference**: `enhancements.md` § Implementation Roadmap

---

## Team Structure & Roles

### Core Team (Minimum Viable)

- **1 Senior Full-Stack Developer**: Backend + complex frontend
- **1 Frontend Developer**: UI components, state management
- **1 QA Engineer** (0.5 FTE): Testing infrastructure, E2E tests

### Extended Team (Optional)

- **1 DevOps Engineer** (0.5 FTE): CI/CD, deployment, monitoring
- **1 Designer** (0.25 FTE): UX review, visual polish

### Skill Requirements

- **Backend**: Node.js, TypeScript, Express, REST APIs, testing (Jest)
- **Frontend**: React, TypeScript, MUI, state management, testing (Vitest, Playwright)
- **DevOps**: Docker, Azure, GitHub Actions, monitoring tools

---

## Communication & Collaboration

### Daily

- **Standup** (15 min): Progress, blockers, plan

### Weekly

- **Planning** (1 hour): Upcoming tasks, priorities
- **Demo** (30 min): Show progress to stakeholders

### Bi-Weekly

- **Retrospective** (1 hour): What worked, what didn't, improvements

### Tools

- **Code**: GitHub (pull requests, reviews)
- **Tasks**: GitHub Projects or Jira
- **Docs**: Markdown in repo + Confluence (optional)
- **Chat**: Slack or Teams

---

## Constitution Compliance Verification

### Post-Implementation Review

After Phase 3 completion, verify all principles upheld:

**Principle I (API-First)**: ✅

- All endpoints implemented per contracts
- Credentials isolated to backend

**Principle II (Resilient Data)**: ✅

- Cache fallback functional
- isFreshData flag present

**Principle III (Real-Time)**: ✅

- Manual + auto-refresh working
- Timestamps accurate

**Principle IV (User-Centered)**: ✅

- Multiple views functional
- Accessibility audit passed

**Principle V (Security)**: ✅

- PII protected in modals
- HTTPS enforced
- Security headers present

**Principle VI (Observable)**: ✅

- Metrics collected
- Logs structured
- Monitoring active

**Principle VII (Cloud-Native Infrastructure)**: ✅

- Bicep templates provision all resources
- GitHub Actions CI/CD functional
- Multi-tenant configuration working
- Spin-up/spin-down tested
- Key Vault integration verified

**Final Gate**: All 7 principles verified → Proceed to production

---

## Appendices

### A. Reference Documents

- `.specify/analysis/codebase-spec.md` - Feature specification
- `.specify/analysis/api-contracts.md` - API contracts
- `.specify/analysis/enhancements.md` - Enhancement roadmap
- `.specify/memory/constitution.md` - Project principles

### B. Key Decisions Log

| Date       | Decision                              | Rationale                                                        |
| ---------- | ------------------------------------- | ---------------------------------------------------------------- |
| 2026-02-17 | Use TypeScript for entire stack       | Type safety, better IDE support, reduced bugs                    |
| 2026-02-17 | Zustand for refresh state             | Simpler than Redux, sufficient for our needs                     |
| 2026-02-17 | Vitest > Jest for frontend            | Faster, better Vite integration                                  |
| 2026-02-17 | Playwright for E2E                    | Modern, reliable, better DX than Selenium                        |
| 2026-02-17 | Defer PWA to Phase 5                  | Core features first, enhancements later                          |
| 2026-02-17 | Azure-native deployment               | Aligns with organizational infrastructure, Key Vault integration |
| 2026-02-17 | Azure Container Apps over App Service | 69% cost savings with scale-to-zero for seasonal operations      |
| 2026-02-17 | Bicep for IaC                         | Native Azure support, better tooling than Terraform for Azure    |
| 2026-02-17 | Multi-tenant via config               | Enables multiple committees, supports seasonal spin-up/down      |
| 2026-02-17 | GitHub Actions for CI/CD              | Native GitHub integration, free for public repos                 |

### C. Environment Variables

**Backend** (`.env`):

```
NODE_ENV=development
PORT=3000
SHIFTBOARD_ACCESS_KEY_ID=your-key
SHIFTBOARD_SECRET_KEY=your-secret
SHIFTBOARD_HOST=api.shiftboard.com
SHIFTBOARD_PATH=/api/v1/
ALLOWED_ORIGINS=http://localhost:5173
LOG_LEVEL=debug
```

**Frontend** (`.env`):

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Shift Dashboard
```

---

## Next Steps

1. **Approval**: Review this plan with stakeholders → Sign-off required
2. **Team Formation**: Assign developers to roles → Confirm availability
3. **Kickoff**: Schedule kickoff meeting → Review plan, Q&A
4. **Phase 0 Start**: Begin T001-T005 → Target completion in 1-2 weeks

**Contact**: Plan owner for questions, updates, or concerns.

---

**Document Status**: Draft → Awaiting Approval  
**Plan Owner**: Tech Lead  
**Last Updated**: 2026-02-17  
**Next Review**: Post-Phase 0 (week 2)
