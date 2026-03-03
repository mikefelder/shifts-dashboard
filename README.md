# Shift Dashboard

[![Phase](https://img.shields.io/badge/Phase-10%3A%20Polish-blue)](specs/003-user-stories-implementation/tasks.md)
[![Progress](https://img.shields.io/badge/Progress-77%2F80%20Tasks-brightgreen)](specs/003-user-stories-implementation/tasks.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Real-time volunteer shift visibility dashboard with clock-in status tracking, powered by the Shiftboard API.

> **✅ Project Status**: Core implementation complete! All 7 user stories implemented. Infrastructure ready for deployment. Remaining: Performance optimization, security hardening, and accessibility audit.

## Overview

The Shift Dashboard provides real-time visibility into volunteer shift assignments and clock-in status. Built as a full-stack web application with offline-first capabilities and Azure Container Apps deployment.

### Key Features

- **Active Shifts Timeline**: Vertical hourly timeline with dynamic time window and overlap handling
- **Tabular View**: Sortable data table with 8 columns (time, name, location, people, status)
- **Shift Detail Page**: Dedicated view for individual shifts with two display modes:
  - **Responsive Mode**: Mobile and desktop-friendly layout
  - **Large Screen Mode**: Optimized for 50"+ displays in operations rooms
  - **Upcoming Shift Preview**: Shows next shifts starting within configurable time window
- **Workgroup Filtering**: Global dropdown selector to filter shifts by workgroup
- **Committee Configuration**: Optional single-committee mode for white-label deployments
- **Shift Details Modal**: Comprehensive shift information with assigned people and clock status
- **Person Contact Modal**: Direct call/text actions with phone number access
- **Manual & Auto Refresh**: Configurable refresh intervals (5/10/15 minutes) with manual refresh button
- **Offline Mode**: IndexedDB cache with graceful degradation when API unavailable
- **Responsive Design**: Desktop and mobile-optimized layouts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Container Apps                     │
│  ┌────────────────────┐         ┌─────────────────────┐    │
│  │   Backend API      │         │   Frontend SPA      │    │
│  │   (Express)        │◄────────│   (React + Vite)    │    │
│  │   Port 3000        │         │   Static Serve      │    │
│  │ [Managed Identity] │         │ [Managed Identity]  │    │
│  └────────────────────┘         └─────────────────────┘    │
│           │                                │                 │
│           │ RBAC Access                    │                 │
│           ▼                                ▼                 │
│  ┌────────────────────┐         ┌─────────────────────┐    │
│  │   Key Vault        │         │   IndexedDB Cache   │    │
│  │   (Secrets)        │         │   (Browser)         │    │
│  │ [RBAC Enabled]     │         └─────────────────────┘    │
│  └────────────────────┘                                     │
│           │                                                  │
│           │ ACR Pull (Managed Identity)                     │
│           ▼                                                  │
│  ┌────────────────────┐                                     │
│  │ Container Registry │                                     │
│  │ (Docker Images)    │                                     │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Shiftboard API        │
              │   (JSON-RPC over HTTPS) │
              └─────────────────────────┘
```

### Security Architecture

- **Managed Identity**: Both container apps use Azure system-assigned managed identities for authentication
- **RBAC-Based Access**: Key Vault uses Azure RBAC with "Key Vault Secrets User" role (no access policies)
- **Secure Registry Access**: Container Registry pull via managed identity with "AcrPull" role, no admin credentials
- **Health Probes**: Liveness, readiness, and startup probes ensure container reliability
- **Autoscaling**: HTTP request, CPU, and memory-based scaling rules for optimal resource usage
- **Environment-Specific**: Dev/Staging/Prod configurations with appropriate resource allocations

### Technology Stack

**Backend**:

- Node.js 20.x LTS
- Express 4.22+
- TypeScript 5.9+
- Axios (HTTP client)
- Helmet (security)
- CORS (cross-origin)
- Winston (logging)
- Zod (validation)
- Jest (testing)

**Frontend**:

- React 19.2+
- TypeScript 5.x
- Vite 7.3+ (build tool)
- Material-UI (MUI) 7.3+
- React Router 7.13+
- IndexedDB/idb 8.0+
- date-fns 4.1+
- Vitest + Playwright (testing)

**Infrastructure**:

- Azure Container Apps (scale-to-zero with health probes and autoscaling)
- Azure Container Registry (managed identity authentication)
- Azure Key Vault (RBAC-based secrets management)
- Azure Application Insights (environment-specific retention)
- Azure Log Analytics (centralized logging)
- Managed Identity (system-assigned for secure resource access)
- Bicep (Infrastructure as Code with environment configs)
- GitHub Actions (CI/CD with managed identity)

**Cost**: ~$48/year per instance (69% savings vs App Service with scale-to-zero)

## Prerequisites

- **Node.js**: 20.x LTS ([Download](https://nodejs.org/))
- **Git**: For version control
- **Docker**: For local containerized development (optional)
- **Azure CLI**: For infrastructure deployment (optional)
- **Shiftboard API Credentials**: `access_key_id` and `secret_key`

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/shifts-dashboard.git
cd shifts-dashboard
```

### 2. Install Dependencies

This is a monorepo workspace. Install all dependencies from the root:

```bash
npm install
```

### 3. Configure Environment

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3000
SHIFTBOARD_ACCESS_KEY_ID=your-access-key-id
SHIFTBOARD_SECRET_KEY=your-secret-key
SHIFTBOARD_HOST=api.shiftboard.com
SHIFTBOARD_PATH=/api/v1/
ALLOWED_ORIGINS=http://localhost:5173
LOG_LEVEL=debug

# Optional: Committee Configuration (for single-committee deployments)
# COMMITTEE_WORKGROUP=finance-committee-id
```

**Frontend** (`client/.env`):

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Shift Dashboard

# Optional: Upcoming shift preview window in minutes (default: 30)
VITE_UPCOMING_SHIFT_PREVIEW_MINUTES=30

# Optional: Committee Configuration (for single-committee deployments)
# VITE_COMMITTEE_NAME=Finance Committee
# VITE_COMMITTEE_WORKGROUP=finance-committee-id
```

### 3.1 Committee Configuration (Optional)

The application supports **multi-committee deployment** for multi-tenant or white-label scenarios. This allows you to filter the dashboard to specific committees/workgroups and customize the branding.

#### Configuration Modes

**Global Mode (Default)**: Shows all workgroups with dropdown filter enabled.

```env
# Frontend (.env)
VITE_APP_NAME=Shift Dashboard
# No committee-specific configuration

# Backend (.env)
# No COMMITTEE_IDS, COMMITTEE_CODES, or COMMITTEE_WORKGROUP set
```

**Multi-Committee Mode (by IDs)**: Filter to specific workgroups by ID.

```env
# Backend (.env)
COMMITTEE_IDS=5676546,5676571,198353    # Comma-separated workgroup IDs
```

**Multi-Committee Mode (by Codes)**: Filter to specific workgroups by code.

```env
# Backend (.env)
COMMITTEE_CODES=ITCS,ITC365,ITC         # Comma-separated workgroup codes
```

**Single Committee Mode (Legacy)**: Locks dashboard to one committee.

```env
# Frontend (.env)
VITE_APP_NAME=Shift Dashboard
VITE_COMMITTEE_NAME=Finance Committee           # Display name in header
VITE_COMMITTEE_WORKGROUP=finance-committee-id   # Shiftboard workgroup ID

# Backend (.env)
COMMITTEE_WORKGROUP=finance-committee-id        # Must match frontend
```

**Priority Order**: `COMMITTEE_IDS` > `COMMITTEE_CODES` > `COMMITTEE_WORKGROUP`

#### Behavior

| Mode                        | Workgroup Filter    | Data Filtering                        | Use Case                             |
| --------------------------- | ------------------- | ------------------------------------- | ------------------------------------ |
| **Global**                  | ✅ Visible dropdown | None (all workgroups)                 | Single deployment for all committees |
| **Multi-Committee (IDs)**   | ✅ Visible dropdown | Filtered to specified workgroup IDs   | Department-specific view             |
| **Multi-Committee (Codes)** | ✅ Visible dropdown | Filtered to specified workgroup codes | Role-based filtering                 |
| **Single Committee**        | ❌ Hidden           | Locked to configured workgroup        | One deployment per committee         |

#### Security

- **Frontend**: Committee name displayed in header; workgroup filter auto-selected
- **Backend**: API calls enforced with `committeeConfig.workgroupIds` fallback (supports single or multiple workgroups)
- **Data Isolation**: Backend filters all shift, account, and workgroup queries

#### Deployment Examples

```bash
# Multi-committee deployment (by IDs)
docker run -e COMMITTEE_IDS="5676546,5676571,198353" \
           shifts-dashboard

# Multi-committee deployment (by codes)
docker run -e COMMITTEE_CODES="ITCS,ITC365,ITC" \
           shifts-dashboard

# Single committee deployment (legacy)
docker run -e COMMITTEE_WORKGROUP="finance-123" \
           -e VITE_COMMITTEE_NAME="Finance Committee" \
           shifts-dashboard
```

### 4. Development

Run both backend and frontend in development mode:

**Backend** (Terminal 1):

```bash
cd backend
npm run dev
# Server starts at http://localhost:3000
```

**Frontend** (Terminal 2):

```bash
cd client
npm run dev
# Vite dev server starts at http://localhost:5173
```

#### 4.1 Mock Data Mode (Development Only)

For UI development and testing when there are no active shifts, you can enable mock data generation:

**Backend** (`backend/.env`):

```env
ENABLE_MOCK_DATA=true
```

**Features**:

- Generates realistic shift data based on current time
- Includes morning (6am-12pm), afternoon (12pm-6pm), and evening (6pm-10pm) shifts
- Mix of clocked in/out statuses for testing different UI states
- Multiple workgroups, locations, and roles
- Includes overlapping shifts to test grouping algorithm

**When to use**:

- UI development when real Shiftboard API has no active shifts
- Testing edge cases (empty shifts, all clocked in, mixed statuses)
- Developing without access to Shiftboard credentials
- Playwright/integration tests

**Note**: Mock mode is only active when `ENABLE_MOCK_DATA=true`. The app automatically falls back to the real Shiftboard API when disabled.

**Or use Docker Compose**:

```bash
# Production mode (Nginx + Node)
docker-compose --profile prod up

# Development mode (hot-reload for both services, dev-only)
docker-compose --profile dev up backend-dev frontend-dev

# Build images from scratch
docker-compose build

# Stop and remove containers
docker-compose down
```

### 5. Build for Production

**Backend**:

```bash
cd backend
npm run build
npm start
```

**Frontend**:

```bash
cd client
npm run build
# Output: client/dist/
```

## Project Structure

```
shifts-dashboard/
├── .github/
│   ├── agents/              # Speckit agent definitions
│   ├── prompts/             # Speckit prompt templates
│   └── workflows/           # CI/CD pipelines (T005)
├── .specify/
│   ├── analysis/            # Codebase analysis & specs
│   ├── memory/
│   │   └── constitution.md  # 7 core principles (v1.1.0)
│   ├── plans/
│   ├── scripts/             # Helper bash scripts
│   └── templates/           # Document templates
├── specs/
│   └── 003-user-stories-implementation/
│       ├── spec.md          # Feature specification
│       ├── plan.md          # Implementation plan
│       ├── tasks.md         # Task breakdown
│       ├── contracts/
│       │   └── api-contracts.md # API endpoint contracts
│       ├── data-model.md    # Data structures
│       ├── quickstart.md    # Quick start guide
│       └── research.md      # Technical research
├── backend/                 # Backend API ✅
│   ├── src/
│   │   ├── config/          # Configuration management ✅
│   │   ├── controllers/     # Request handlers ✅
│   │   │   ├── account.controller.ts
│   │   │   ├── role.controller.ts
│   │   │   ├── calendar.controller.ts
│   │   │   ├── shift.controller.ts
│   │   │   ├── system.controller.ts
│   │   │   └── workgroup.controller.ts
│   │   ├── middleware/      # Express middleware ✅
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/          # API routes ✅
│   │   │   ├── account.routes.ts
│   │   │   ├── role.routes.ts
│   │   │   ├── calendar.routes.ts
│   │   │   ├── shift.routes.ts
│   │   │   ├── system.routes.ts
│   │   │   └── workgroup.routes.ts
│   │   ├── services/        # Business logic ✅
│   │   │   ├── account.service.ts
│   │   │   ├── role.service.ts
│   │   │   ├── calendar.service.ts
│   │   │   ├── shift.service.ts
│   │   │   ├── shiftboard.service.ts
│   │   │   └── workgroup.service.ts
│   │   ├── utils/           # Utilities ✅
│   │   │   ├── shift.utils.ts      # Shift grouping & clock status
│   │   │   ├── shiftboard-auth.ts  # HMAC authentication
│   │   │   └── timing.ts           # Request timing metadata
│   │   ├── types/           # TypeScript types ✅
│   │   ├── validators/      # Zod schemas ✅
│   │   └── index.ts         # Express app entry point ✅
│   ├── tests/               # Jest tests ✅
│   │   └── __tests__/
│   │       └── test-helpers.ts # Shared test utilities (makeReq, makeRes, runHandler)
│   ├── dist/                # Compiled JavaScript ✅
│   ├── package.json         # ✅ Backend dependencies
│   ├── tsconfig.json        # ✅ TypeScript config
│   ├── jest.config.js       # ✅ Jest config
│   └── Dockerfile           # ✅ Multi-stage build
├── client/                  # Frontend SPA ✅
│   ├── src/
│   │   ├── components/      # React components ✅
│   │   │   ├── Calendar/
│   │   │   │   ├── ActiveShiftsView.tsx
│   │   │   │   ├── TabularShiftView.tsx
│   │   │   │   ├── ShiftDetailModal.tsx
│   │   │   │   └── PersonDetailModal.tsx
│   │   │   ├── Filters/
│   │   │   │   └── WorkgroupFilter.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── contexts/        # React Context ✅
│   │   │   └── WorkgroupContext.tsx
│   │   ├── pages/           # Route pages ✅
│   │   │   ├── Calendar.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ShiftDetail.tsx
│   │   ├── services/        # API & IndexedDB ✅
│   │   │   ├── api.service.ts
│   │   │   └── db.service.ts
│   │   ├── theme/           # MUI theme ✅
│   │   │   └── theme.ts
│   │   ├── types/           # TypeScript types ✅
│   │   │   └── shift.types.ts
│   │   ├── App.tsx          # ✅ React Router setup
│   │   └── main.tsx         # ✅ Entry point
│   ├── public/              # Static assets ✅
│   ├── e2e/                 # Playwright tests ✅
│   ├── dist/                # Build output ✅
│   ├── package.json         # ✅ Frontend dependencies
│   ├── tsconfig.json        # ✅ TypeScript config
│   ├── vite.config.ts       # ✅ Vite configuration
│   ├── playwright.config.ts # ✅ Playwright config
│   ├── Dockerfile           # ✅ Multi-stage build
│   ├── nginx.conf           # ✅ Nginx configuration
│   └── .env.example         # ✅ Frontend env template
├── docs/                    # Documentation ✅
│   └── deployment.md        # Deployment guide & seasonal operations ✅
├── infra/                   # Bicep IaC ✅
│   ├── main.bicep           # Main infrastructure template ✅
│   ├── main.json            # Compiled ARM template ✅
│   ├── params/              # Environment-specific parameters ✅
│   │   ├── dev.parameters.json
│   │   ├── staging.parameters.json
│   │   └── prod.parameters.json
│   ├── README.md
│   └── modules/
│       ├── container-registry.bicep    # Azure Container Registry ✅
│       ├── container-apps-env.bicep    # Container Apps Environment ✅
│       ├── container-app.bicep         # Container App instances ✅
│       ├── key-vault.bicep             # Key Vault for secrets ✅
│       └── app-insights.bicep          # Application Insights ✅
├── scripts/                 # Deployment scripts ✅
│   ├── deploy-infrastructure.sh        # Deploy infrastructure ✅
│   ├── destroy-infrastructure.sh       # Teardown infrastructure ✅
│   ├── validate-infrastructure.sh      # Pre-deployment validation ✅
│   └── README.md
├── .eslintrc.json           # ✅ ESLint config
├── .prettierrc.json         # ✅ Prettier config
├── tsconfig.json            # ✅ Root TypeScript config
├── package.json             # ✅ Workspace definition
└── README.md                # This file
```

**Legend**: ✅ Complete | 🚧 In Progress | ⬜ Not Started

## API Endpoints

> See [specs/003-user-stories-implementation/contracts/api-contracts.md](specs/003-user-stories-implementation/contracts/api-contracts.md) for complete specifications.

### Shifts

- **GET** `/api/shifts/whos-on` - Get active shifts with clock-in status (grouped)
  - Query: `?workgroup={id}` (optional)
  - Response: Grouped shifts with `assignedPeople`, `clockStatuses`, metrics
- **GET** `/api/shifts/upcoming` - Get upcoming shifts within a future time window
  - Query: `?minutes={n}&workgroup={id}&batch={size}` (all optional)
  - Response: Grouped shifts starting within specified time window
- **GET** `/api/shifts/list` - Get all shifts (raw from Shiftboard)

### Accounts

- **GET** `/api/accounts/list` - Get all accounts
- **GET** `/api/accounts/self` - Get current user's account
- **GET** `/api/accounts/workgroup/:workgroupId` - Get accounts in workgroup
- **GET** `/api/accounts/:accountId` - Get account by ID

### Workgroups

- **GET** `/api/workgroups/list` - Get all workgroups
- **GET** `/api/workgroups/:workgroupId/roles` - Get roles for workgroup

### Roles

- **GET** `/api/roles/list` - Get all roles (sorted alphabetically)
- **GET** `/api/roles/:roleId` - Get specific role by ID

### Calendar

- **GET** `/api/calendar/summary` - Get aggregated statistics (stub implementation)

### System

- **GET** `/health` - Health check (200 OK with uptime)
- **GET** `/api/system/health` - Health check (200 OK with uptime)
- **POST** `/api/system/echo` - Connectivity test (proxies to Shiftboard)

## Development Status

### ✅ Completed (77/80 tasks)

**Phase 1: Setup** (6/6 tasks) ✓

- T001-T006: Project structure, backend/frontend initialization, Docker, CI/CD workflows

**Phase 2: Foundational** (11/11 tasks) ✓

- T007-T017: Shiftboard authentication, services, middleware, IndexedDB, MUI theme, app layout

**Phase 3: User Story 1 - Active Shifts Timeline** (10/10 tasks) ✓ 🎯 **MVP**

- T018-T027: Shift grouping, services, controllers, ActiveShiftsView, timeline with clock status

**Phase 4: User Story 2 - Tabular View** (7/7 tasks) ✓

- T028-T034: TabularShiftView, column sorting, status chips, animations

**Phase 5: User Story 3 - Workgroup Filter** (7/7 tasks) ✓

- T035-T041: Workgroup service, WorkgroupFilter dropdown, filtering integration

**Phase 6: User Story 4 - Shift Details** (7/7 tasks) ✓

- T042-T048: ShiftDetailModal, shift information display, click triggers

**Phase 7: User Story 5 - Contact Members** (8/8 tasks) ✓

- T049-T056: Account service, PersonDetailModal, call/text actions

**Phase 8: User Story 6 - Refresh Data** (7/7 tasks) ✓

- T057-T063: Refresh controls, auto-refresh intervals, sync timestamps

**Phase 9: User Story 7 - Offline Mode** (7/7 tasks) ✓

- T064-T070: Cache-first logic, ErrorBoundary, stale data warnings

**Phase 10: Polish & Infrastructure** (7/10 tasks) ✓

- T071-T077: Role/calendar services, Bicep templates, deployment scripts, parameter files, deployment documentation, code cleanup
  - **T077 Cleanup**: Created `timing.ts` utility (reduced 250+ lines), consolidated test helpers, removed unused code

### 🚧 Remaining Tasks (3/80)

- **T078**: Performance optimization (shift grouping <50ms for 1000 shifts)
- **T079**: Security hardening (rate limiting, input sanitization, CSP headers)
- **T080**: Accessibility audit (ARIA labels, keyboard navigation, screen reader support)

**Full task breakdown**: [specs/003-user-stories-implementation/tasks.md](specs/003-user-stories-implementation/tasks.md)

## Testing

**Backend** (Jest):

```bash
cd backend
npm test                 # Run tests
npm run test:coverage    # Run with coverage
npm run test:watch       # Watch mode
```

**Frontend** (Vitest + Playwright):

```bash
cd client
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:coverage    # Coverage report
```

**Linting**:

```bash
npm run lint             # Lint all packages
npm run lint:fix         # Auto-fix issues
npm run format           # Format with Prettier
```

## Deployment

> **📖 Complete Guide**: See [docs/deployment.md](docs/deployment.md) for comprehensive deployment instructions including seasonal operations, monitoring, and troubleshooting.

### Quick Deploy to Azure Container Apps

1. **Validate environment**:

   ```bash
   ./scripts/validate-infrastructure.sh dev
   ```

2. **Deploy infrastructure**:

   ```bash
   ./scripts/deploy-infrastructure.sh dev
   ```

3. **Build and push Docker images**:

   ```bash
   # Login to Azure Container Registry
   az acr login --name <registry-name>

   # Build and push
   docker build -t <registry>.azurecr.io/shift-dashboard-backend:latest -f backend/Dockerfile .
   docker push <registry>.azurecr.io/shift-dashboard-backend:latest

   docker build -t <registry>.azurecr.io/shift-dashboard-frontend:latest -f client/Dockerfile .
   docker push <registry>.azurecr.io/shift-dashboard-frontend:latest
   ```

4. **Update Container Apps**:

   ```bash
   az containerapp update --name shift-dashboard-backend-dev \
     --resource-group shift-dashboard-rg \
     --image <registry>.azurecr.io/shift-dashboard-backend:latest
   ```

5. **Verify deployment**:

   ```bash
   curl https://<app-url>.azurecontainerapps.io/health
   ```

### Seasonal Operations

**Before Season (Spin-Up)**:

```bash
./scripts/validate-infrastructure.sh prod
az containerapp update --min-replicas 1 --max-replicas 5
```

**After Season (Spin-Down)**:

```bash
az containerapp update --min-replicas 0 --max-replicas 1
```

**Complete Teardown** (Off-season):

```bash
./scripts/destroy-infrastructure.sh
```

**Cost breakdown**:

- **Active season**: $65-70/month (Container Apps + Log Analytics + ACR + Key Vault + App Insights)
- **Scale-to-zero**: $20-25/month (minimal logging + storage)
- **Complete teardown**: $0/month (requires redeployment)

### GitHub Actions CI/CD

Push to `main` branch triggers:

1. Backend tests + lint
2. Frontend tests + lint
3. Docker image build → Azure Container Registry
4. Deploy to Azure Container Apps
5. Health check validation

## Documentation

- **[Deployment Guide](docs/deployment.md)**: Complete deployment instructions, seasonal operations, monitoring, cost management
- **[Constitution](.specify/memory/constitution.md)**: 7 core principles guiding architecture
- **[Feature Specification](specs/003-user-stories-implementation/spec.md)**: Complete feature specification
- **[API Contracts](specs/003-user-stories-implementation/contracts/api-contracts.md)**: Endpoint contracts & schemas
- **[Implementation Plan](specs/003-user-stories-implementation/plan.md)**: Technical implementation plan
- **[Tasks Breakdown](specs/003-user-stories-implementation/tasks.md)**: Tasks organized by user story (77/80 complete)
- **[Data Model](specs/003-user-stories-implementation/data-model.md)**: Data structures & schemas

## Contributing

This is currently a greenfield rebuild. Contributions welcome after MVP (Phase 3 complete).

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following ESLint/Prettier rules (pre-commit hook enforces)
3. Write tests (70% coverage required)
4. Commit with conventional commits: `feat: add new feature`
5. Push and create pull request
6. CI tests must pass before merge

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** enforced on pre-commit
- **Prettier** auto-formatting (100 char line width, single quotes)
- **Conventional commits** for changelog generation

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [.specify/](.specify/) folder
- **Issues**: GitHub Issues (after MVP launch)
- **Shiftboard API**: [Shiftboard API Documentation](https://www.shiftboard.com/api/)

---

**Built with ❤️ following constitutional principles for resilient, user-centered, cloud-native applications.**
