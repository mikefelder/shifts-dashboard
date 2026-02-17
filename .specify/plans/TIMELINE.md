# Shifts Dashboard Rebuild: Visual Timeline

**Project**: Shifts Dashboard - Complete Rebuild  
**Duration**: 8-10 weeks (+ 2 week contingency)  
**Team**: 2 FTE developers + 0.5 FTE QA engineer  
**Status**: Planning Complete → Awaiting Approval

---

## Timeline at a Glance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SHIFTS DASHBOARD REBUILD TIMELINE                     │
└─────────────────────────────────────────────────────────────────────────┘

Week 1-2    │ ████████████████ PHASE 0: SETUP & FOUNDATION
            │ • Project scaffolding
            │ • Docker & CI/CD setup  
            │ • Bicep infrastructure templates
            │ • Testing frameworks configured
            │ Deliverable: Development environment + IaC ready
            │
Week 3-4    │ ████████████████ PHASE 1: CORE BACKEND
            │ • 13 API endpoints implemented
            │ • Shiftboard integration working
            │ • Shift grouping algorithm (<50ms)
            │ • 70%+ test coverage
            │ Deliverable: API fully functional with tests
            │
Week 5-6    │ ████████████████ PHASE 2: CORE FRONTEND
            │ • Calendar view (timeline)
            │ • Tabular view (sortable table)
            │ • IndexedDB cache + offline fallback
            │ • E2E tests (6 critical flows)
            │ Deliverable: UI complete with automation
            │
Week 7      │ ████████ PHASE 3: INTEGRATION & POLISH
            │ • End-to-end integration tests
            │ • Accessibility audit (WCAG AA)
            │ • Performance optimization (Lighthouse >90)
            │ • Security hardening + documentation
            │ Deliverable: Production-ready application
            │
Week 8      │ ████████ PHASE 4: DEPLOYMENT & LAUNCH
            │ • Infrastructure deployment via Bicep
            │ • Application deployment to Azure
            │ • Monitoring & alerting setup
            │ • Multi-tenant verification
            │ • User acceptance testing
            │ • Production release + training
            │ Deliverable: Live application with IaC
            │
Week 9-10   │ ░░░░░░░░ CONTINGENCY BUFFER
            │ • Bug fixes from production
            │ • Address unforeseen issues
            │ • Stabilization
```

---

## Phase Breakdown

### 🔧 Phase 0: Setup & Foundation (Week 1-2)

**Focus**: Development environment, tooling, CI/CD pipelines, Infrastructure as Code

**Key Tasks** (6 tasks):
- T001: Repository & tooling setup (ESLint, Prettier, Husky)
- T002: Backend project initialization (Node.js + TypeScript + Express)
- T003: Frontend project initialization (React + TypeScript + Vite)
- T004: Docker & local development setup
- T005: CI/CD pipeline setup (GitHub Actions)
- T006: Infrastructure as Code (Bicep templates for Azure)

**Team**: Primarily DevOps Lead

**Deliverables**:
- ✅ Project structure created
- ✅ Docker Compose working
- ✅ CI/CD pipelines green
- ✅ Bicep templates validated
- ✅ Test frameworks configured

**Exit Criteria**: `docker-compose up` starts both services; tests run successfully; Bicep templates provision infrastructure

---

### ⚙️ Phase 1: Core Backend (Week 3-4)

**Focus**: API implementation, Shiftboard integration, business logic

**Key Tasks** (9 tasks):
- T101: Shiftboard HMAC authentication utility
- T102: Pagination utility (multi-page fetching)
- T103: Shift grouping algorithm
- T104: Shiftboard service client
- T105: Shift service (business logic)
- T106: Controllers (6 resource controllers)
- T107: Routes & middleware (error handling, validation)
- T108: API integration tests
- T109: Contract tests (validate against api-contracts.md)

**Team**: Backend Developer + QA Engineer (0.5)

**Deliverables**:
- ✅ 13 REST endpoints functional
- ✅ Shift grouping <50ms for 1000 shifts
- ✅ 70% test coverage
- ✅ All contract tests passing

**Exit Criteria**: All endpoints return correct schemas; integration tests pass

---

### 🎨 Phase 2: Core Frontend (Week 5-6)

**Focus**: UI components, state management, IndexedDB cache

**Key Tasks** (10 tasks):
- T201: IndexedDB service (4 object stores)
- T202: API service (with cache fallback)
- T203: Theme & layout shell
- T204: Workgroup context & filter
- T205: Tabular shift view (sortable table)
- T206: Active shifts view (timeline - 16 hours, complex)
- T207: Modals (shift detail + person detail)
- T208: Error boundary
- T209: Router & pages
- T210: E2E tests (6 critical flows with Playwright)

**Team**: Frontend Developer + QA Engineer (0.5)

**Deliverables**:
- ✅ Calendar view with dynamic time windows
- ✅ Tabular view with sorting
- ✅ IndexedDB cache functional
- ✅ E2E tests passing (6 flows)
- ✅ 70% test coverage

**Exit Criteria**: Both views render correctly; cache fallback works; E2E tests pass

---

### 🔍 Phase 3: Integration & Polish (Week 7)

**Focus**: Quality assurance, accessibility, performance, security

**Key Tasks** (6 tasks):
- T301: Integration testing (frontend + backend + mocked Shiftboard)
- T302: Accessibility audit (Axe DevTools, keyboard nav, screen reader)
- T303: Performance optimization (lazy loading, memoization, Lighthouse)
- T304: Security hardening (rate limiting, CSP, input validation)
- T305: Documentation (architecture, deployment, testing guides)
- T306: Production build & smoke tests

**Team**: All hands (2 FTE)

**Deliverables**:
- ✅ Integration tests passing
- ✅ 0 accessibility violations
- ✅ Lighthouse Performance >90
- ✅ Security headers configured
- ✅ Documentation complete

**Exit Criteria**: Production build runs without errors; accessibility audit clean

---

### 🚀 Phase 4: Deployment & Launch (Week 8)

**Focus**: Infrastructure provisioning, production deployment, monitoring, user training

**Key Tasks** (5 tasks):
- T401: Infrastructure deployment via Bicep (App Service, Key Vault, App Insights)
- T402: Monitoring setup (Application Insights dashboards, alerts)
- T403: Logging enhancement (structured JSON logs, correlation IDs)
- T404: User acceptance testing (stakeholder walkthrough)
- T405: Production release & infrastructure verification (go-live, multi-tenant testing)

**Team**: DevOps Lead + QA Engineer

**Deliverables**:
- ✅ Infrastructure provisioned via Bicep
- ✅ Application live on Azure
- ✅ Monitoring dashboards active
- ✅ Multi-tenant capability verified
- ✅ Spin-up/spin-down tested
- ✅ Users trained
- ✅ Production stable (no critical errors)

**Exit Criteria**: Users successfully using app; infrastructure can be created/destroyed cleanly; monitoring shows healthy metrics

---

## Team Roles & Allocation

```
┌────────────────────────┬────────┬────────┬────────┬────────┬────────┐
│ Role                   │ Phase 0│ Phase 1│ Phase 2│ Phase 3│ Phase 4│
├────────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Backend Developer      │   20%  │  100%  │   20%  │   50%  │   20%  │
│ Frontend Developer     │   20%  │   20%  │  100%  │   50%  │   20%  │
│ QA Engineer (0.5 FTE)  │   10%  │   50%  │   50%  │   50%  │   80%  │
│ DevOps Lead (optional) │  100%  │   10%  │   10%  │   20%  │  100%  │
└────────────────────────┴────────┴────────┴────────┴────────┴────────┘
```

**Core Team** (minimum viable):
- 1 Senior Full-Stack Developer (Backend focus)
- 1 Frontend Developer
- 1 QA Engineer (part-time, 0.5 FTE)

**Extended Team** (optimal):
- Add: 1 DevOps Engineer (part-time, 0.5 FTE)

---

## Key Milestones

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| **M0: Kickoff** | Week 1 | Team assembled, plan approved |
| **M1: Dev Environment Ready** | End of Week 2 | Docker + CI/CD working |
| **M2: API Complete** | End of Week 4 | 13 endpoints + tests |
| **M3: UI Complete** | End of Week 6 | Both views + E2E tests |
| **M4: Production-Ready** | End of Week 7 | All quality gates passed |
| **M5: Go-Live** | End of Week 8 | Application in production |
| **M6: Stabilized** | End of Week 10 | Bug fixes complete, monitoring validated |

---

## Success Metrics

### By Phase 4 Completion

**Code Quality**:
- ✅ 70%+ test coverage (backend + frontend)
- ✅ 100% contract tests passing (13 endpoints)
- ✅ 0 ESLint errors
- ✅ TypeScript strict mode enabled

**Performance**:
- ✅ API response time: p95 <2s for /api/shifts/whos-on
- ✅ Shift grouping: <50ms for 1000 shifts
- ✅ Table render: <300ms for 100 shifts
- ✅ Lighthouse Performance score: >90

**Accessibility**:
- ✅ WCAG AA compliance (0 Axe violations)
- ✅ Keyboard navigation functional
- ✅ Screen reader compatible

**Security**:
- ✅ HTTPS enforced
- ✅ Rate limiting active (100 req/min)
- ✅ Content Security Policy configured
- ✅ No credentials in source code

**Production Health**:
- ✅ Uptime: 99.5%+ (measured)
- ✅ Error rate: <0.1% of requests
- ✅ Monitoring dashboards live
- ✅ 0 critical bugs in first week

---

## Risk Assessment

### High Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Shiftboard API changes** | Medium | High | Contract tests detect breaks; maintain fallback |
| **Performance issues (large datasets)** | Medium | Medium | Test with 1000-shift dataset; plan virtualization |
| **Deployment issues** | Medium | High | Test production build locally; deploy to staging first |

### Medium Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Missing test coverage** | High | Medium | Block merges on <70% coverage |
| **Browser cache corruption** | Low | Medium | Implement cache versioning; add "Clear Cache" button |

All risks have documented mitigation strategies in the full plan.

---

## Budget Estimate

### Team Costs (8-10 weeks)

Assuming standard market rates:

```
Backend Developer:     2.0 FTE × 10 weeks = 20 FTE-weeks
Frontend Developer:    2.0 FTE × 10 weeks = 20 FTE-weeks
QA Engineer:           0.5 FTE × 10 weeks = 5 FTE-weeks
DevOps Lead (optional): 0.5 FTE × 10 weeks = 5 FTE-weeks
───────────────────────────────────────────────
Total:                                    50 FTE-weeks (with DevOps)
                                          45 FTE-weeks (core team)
```

**Note**: Actual staffing can be 2-3 people working over 10 weeks.

### Infrastructure Costs

- **Azure App Service**: ~$50-100/month (Basic B1 tier)
- **Azure Application Insights**: ~$20-50/month (based on usage)
- **Domain + SSL**: ~$15/year (if custom domain used)
- **Monitoring (optional)**: ~$20-50/month (Sentry, Pingdom)

**Estimated Monthly Infra**: $70-200

---

## Post-Launch Plan (Week 9+)

### Week 9-10: Stabilization
- Monitor production metrics (uptime, error rate, performance)
- Fix high-priority bugs
- Gather user feedback
- Conduct retrospective
- Update documentation

### Week 11-12: Quick Wins (5 days dev time)
Implement fast enhancements:
- ✨ Dark mode (4 hours)
- ✨ Keyboard shortcuts (4 hours)
- ✨ CSV export (1 day)
- ✨ Analytics integration (4 hours)

### Month 4-6: Phase 5 Enhancements (11 days dev time)
Implement high-priority improvements:
- 🚀 **E1**: Offline-First PWA (4 days)
- 🔍 **E2**: Advanced Filtering UI (2 days)
- 🔎 **E3**: Search Functionality (2 days)
- ⚡ **E7**: Performance Optimization / Virtual Scrolling (3 days)

See [enhancements.md](../analysis/enhancements.md) for full roadmap (15 opportunities identified).

---

## Constitution Compliance

### ✅ All 6 Principles Verified

| Principle | Status | Implementation |
|-----------|--------|----------------|
| **I. API-First Architecture** | ✅ PASS | Express REST API; credentials isolated |
| **II. Resilient Data Access** | ✅ PASS | IndexedDB cache with automatic fallback |
| **III. Real-Time Operations** | ✅ PASS | Manual + auto-refresh; timestamp tracking |
| **IV. User-Centered Design** | ✅ PASS | Multiple views; WCAG AA; responsive |
| **V. Security & Compliance** | ✅ PASS | PII in modals; HTTPS; env-based credentials |
| **VI. Observable Systems** | ✅ PASS | Metrics, structured logs, health checks |

**No constitutional violations identified.**

All implementations align with project principles as defined in [constitution.md](../memory/constitution.md).

---

## Technology Stack Summary

### Backend
- **Language**: Node.js 20.x LTS + TypeScript 5.2+
- **Framework**: Express 4.19+
- **Authentication**: HMAC SHA-1 (jssha) for Shiftboard
- **Validation**: Zod 3.22+
- **Logging**: Winston 3.11+ (structured JSON)
- **Testing**: Jest 29.7+ + Supertest 6.3+

### Frontend
- **Framework**: React 18.2+ + TypeScript 5.2+
- **Build**: Vite 5.0+
- **UI**: Material-UI (@mui/material) 5.15+
- **Routing**: react-router-dom 6.21+
- **State**: React Context + Zustand 4.4+
- **Storage**: IndexedDB via idb 8.0+
- **Testing**: Vitest 1.2+ + React Testing Library 14.1+ + Playwright 1.40+

### Infrastructure
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Azure App Service (Linux)
- **Monitoring**: Application Insights (Azure) or Sentry

---

## How to Get Started

### 1. Review & Approve This Plan
- **Audience**: Stakeholders, project sponsors
- **Action**: Review timeline, budget, success criteria → Approve to proceed

### 2. Assemble Team
- **Roles Needed**: 1 Backend Dev, 1 Frontend Dev, 1 QA Engineer (part-time)
- **Action**: Assign developers to roles; confirm availability for 8-10 weeks

### 3. Schedule Kickoff Meeting
- **Agenda**: 
  - Plan review (1 hour)
  - Q&A session
  - Assign Phase 0 tasks
  - Establish communication channels (Slack, standups, demos)

### 4. Begin Phase 0
- **First Tasks**: T001-T005 (project setup)
- **Target**: Complete in 1-2 weeks
- **Next Check-in**: End of Phase 0 (review dev environment setup)

---

## Questions?

**For technical questions**: Review the full [rebuild-plan.md](./rebuild-plan.md) (8,000 words, comprehensive)

**For specification details**: See [.specify/analysis/](../analysis/) directory:
- [codebase-spec.md](../analysis/codebase-spec.md) - Feature specifications
- [api-contracts.md](../analysis/api-contracts.md) - API contracts
- [enhancements.md](../analysis/enhancements.md) - Post-launch roadmap

**For project principles**: See [constitution.md](../memory/constitution.md) - Core principles and standards

---

## Document Status

**Status**: Draft → **Awaiting Approval**  
**Created**: 2026-02-17  
**Plan Owner**: Tech Lead  
**Next Action**: Stakeholder review and sign-off

**Once approved**, update status to "Approved" and schedule kickoff meeting (Week 1, Day 1).

---

_This is a visual summary of the comprehensive [rebuild-plan.md](./rebuild-plan.md). For full task details, acceptance criteria, and technical specifications, refer to the complete plan document._
