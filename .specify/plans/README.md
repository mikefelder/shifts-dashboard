# Development Plans

This directory contains implementation plans for the Shift Dashboard project.

## Current Plans

### [rebuild-plan.md](./rebuild-plan.md)

**Comprehensive development plan for rebuilding the application from scratch.**

**Status**: Draft → Awaiting Approval  
**Timeline**: 8-10 weeks  
**Team**: 2 FTE developers + 1 QA engineer (0.5 FTE)

#### Plan Overview

| Phase                 | Duration  | Focus                                | Key Deliverables                           |
| --------------------- | --------- | ------------------------------------ | ------------------------------------------ |
| **Phase 0: Setup**    | 1-2 weeks | Project scaffolding, tooling, CI/CD  | Docker setup, test frameworks, pipelines   |
| **Phase 1: Backend**  | 2 weeks   | API layer, Shiftboard integration    | 13 endpoints, shift grouping, 70% coverage |
| **Phase 2: Frontend** | 2 weeks   | UI components, IndexedDB cache       | Calendar + table views, modals, E2E tests  |
| **Phase 3: Polish**   | 1 week    | Integration, accessibility, security | A11y audit, performance, documentation     |
| **Phase 4: Deploy**   | 1 week    | Production deployment, monitoring    | Azure deployment, monitoring dashboards    |

**Total**: 8-10 weeks + 2 week contingency

#### Constitution Compliance

✅ All 6 constitutional principles verified and incorporated:

- I. API-First Architecture
- II. Resilient Data Access
- III. Real-Time Operations
- IV. User-Centered Design
- V. Security & Compliance
- VI. Observable Systems

#### Technology Stack

**Backend**: Node.js 20.x + TypeScript + Express + Jest  
**Frontend**: React 18 + TypeScript + Vite + Material-UI + Vitest + Playwright  
**Storage**: IndexedDB (client), stateless backend  
**Deployment**: Docker + Azure App Service

#### Key Metrics

- **API Endpoints**: 13 (all with contract tests)
- **UI Components**: ~25 React components
- **Test Coverage**: 70% minimum (Phase 1), 85% target (Phase 2)
- **Performance**: p95 <2s API, <300ms table render, >90 Lighthouse
- **Lines of Code**: 8,000-10,000 estimated

#### Quick Start

1. **Review Plan**: Read [rebuild-plan.md](./rebuild-plan.md) sections:
   - Executive Summary
   - Technical Context
   - Constitution Check
   - Phase breakdowns

2. **Get Approval**: Share with stakeholders for sign-off

3. **Form Team**: Assign:
   - 1 Backend Developer
   - 1 Frontend Developer
   - 1 QA Engineer (part-time)
   - 1 DevOps Lead (optional, part-time)

4. **Kickoff**: Schedule meeting to review plan and Q&A

5. **Begin Phase 0**: Start with T001-T005 (project setup)

#### Reference Documents

The plan is based on comprehensive codebase analysis:

- **[../analysis/codebase-spec.md](../analysis/codebase-spec.md)** (1,500 lines)
  - Complete feature specifications
  - Architecture diagrams
  - Implementation details for 9 core features
- **[../analysis/api-contracts.md](../analysis/api-contracts.md)** (850 lines)
  - Technology-agnostic API specifications
  - Request/response schemas for 13 endpoints
  - Shift grouping algorithm pseudocode
- **[../analysis/enhancements.md](../analysis/enhancements.md)** (750 lines)
  - 15 enhancement opportunities
  - 5-phase roadmap (post-launch)
  - Technical debt inventory

- **[../memory/constitution.md](../memory/constitution.md)**
  - 6 core principles
  - Technical standards
  - Quality gates

#### Success Criteria

**Phase 1 Complete**: All 13 API endpoints functional, 70%+ coverage, contract tests passing  
**Phase 2 Complete**: Both UI views working, E2E tests passing, 70%+ coverage  
**Phase 3 Complete**: Lighthouse >90, 0 a11y violations, security hardened  
**Phase 4 Complete**: Production stable, monitoring live, users trained

#### Post-Launch (Week 9+)

After production release, implement quick wins from enhancements:

- Week 10-12: Dark mode, keyboard shortcuts, CSV export, analytics (5 days total)
- Month 4-6: PWA, advanced filtering, search, performance optimization (11 days)

See [../analysis/enhancements.md](../analysis/enhancements.md) for full roadmap.

---

## Using This Plan

### For Project Managers

- Review timeline and milestones
- Assign resources (2 FTE + part-time QA)
- Schedule weekly demos
- Track against success criteria

### For Developers

- Follow phase tasks sequentially
- Reference specs in `../analysis/` for implementation details
- Run tests frequently (70% coverage minimum)
- Update plan if tasks blocked

### For QA Engineers

- Set up test infrastructure in Phase 0
- Write contract tests in Phase 1
- Write E2E tests in Phase 2
- Conduct accessibility audit in Phase 3

### For Stakeholders

- Review Executive Summary and timeline
- Approve plan before kickoff
- Attend weekly demos
- Provide feedback during UAT (Phase 4)

---

## Plan Maintenance

**Update Triggers**:

- ✅ Task completed → Mark task as done
- ✅ Blocker discovered → Document in Risk Management
- ✅ Timeline slips → Adjust phase dates + add contingency
- ✅ New requirement → Evaluate scope impact, update plan

**Review Schedule**:

- **Weekly**: Review progress against plan in team meeting
- **Phase End**: Review phase completion gates, adjust next phase if needed
- **Post-Launch**: Retrospective and plan update for enhancements

---

## Contact & Questions

**Plan Owner**: Tech Lead  
**Created**: 2026-02-17  
**Status**: Draft → Awaiting Approval

For questions about this plan, contact the project lead or technical architect.

---

## Related Documentation

- [Project Constitution](../memory/constitution.md) - Core principles and standards
- [Codebase Analysis](../analysis/README.md) - Source specifications
- [Enhancements Roadmap](../analysis/enhancements.md) - Post-launch improvements
