# Shift Dashboard

[![Phase](https://img.shields.io/badge/Phase-0%3A%20Setup-blue)](.specify/plans/tasks.md)
[![Progress](https://img.shields.io/badge/Progress-2%2F80%20Tasks-orange)](.specify/plans/tasks.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Real-time volunteer shift visibility dashboard with clock-in status tracking, powered by the Shiftboard API.

> **🚧 Project Status**: Active rebuild in progress. Legacy code removed. Building from greenfield following constitutional principles and Azure-native architecture.

## Overview

The Shift Dashboard provides real-time visibility into volunteer shift assignments and clock-in status. Built as a full-stack web application with offline-first capabilities and Azure Container Apps deployment.

### Key Features

- **Active Shifts Timeline**: Vertical hourly timeline with dynamic time window and overlap handling
- **Tabular View**: Sortable data table with 8 columns (time, name, location, people, status)
- **Workgroup Filtering**: Global dropdown selector to filter shifts by workgroup
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
│  └────────────────────┘         └─────────────────────┘    │
│           │                                │                 │
│           │                                │                 │
│           ▼                                ▼                 │
│  ┌────────────────────┐         ┌─────────────────────┐    │
│  │   Key Vault        │         │   IndexedDB Cache   │    │
│  │   (Secrets)        │         │   (Browser)         │    │
│  └────────────────────┘         └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Shiftboard API        │
              │   (JSON-RPC over HTTPS) │
              └─────────────────────────┘
```

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

- React 18.2+
- TypeScript 5.2+
- Vite 5.0+ (build tool)
- Material-UI 5.15+
- React Router 6.21+
- IndexedDB/idb 8.0+
- date-fns 3.0+
- Vitest + Playwright (testing)

**Infrastructure**:

- Azure Container Apps (scale-to-zero)
- Azure Container Registry
- Azure Key Vault
- Azure Application Insights
- Bicep (Infrastructure as Code)
- GitHub Actions (CI/CD)

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
PORT=3000
NODE_ENV=development
SHIFTBOARD_ACCESS_KEY_ID=your_access_key_id
SHIFTBOARD_SECRET_KEY=your_secret_key
SHIFTBOARD_SITE_URL=https://yoursite.shiftboard.com
```

**Frontend** (`client/.env`):

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
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
│   │   ├── codebase-spec.md # Feature specification
│   │   ├── api-contracts.md # API endpoint contracts
│   │   └── enhancements.md  # Future improvements
│   ├── memory/
│   │   └── constitution.md  # 7 core principles (v1.1.0)
│   ├── plans/
│   │   ├── rebuild-plan.md  # Implementation plan (8-10 weeks)
│   │   ├── tasks.md         # Task breakdown (80 tasks)
│   │   └── TIMELINE.md      # Phase timeline
│   └── templates/           # Document templates
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration management
│   │   ├── controllers/     # Request handlers (T020, T036, T050, T069)
│   │   ├── middleware/      # Express middleware (T010, T011)
│   │   ├── routes/          # API routes (T021, T037, T051, T070)
│   │   ├── services/        # Business logic (T009, T019, T035, T049)
│   │   ├── utils/           # Utilities (T007, T008, T018)
│   │   ├── types/           # TypeScript types
│   │   ├── validators/      # Zod schemas
│   │   └── index.ts         # Express app entry point ✅
│   ├── tests/               # Jest tests
│   ├── dist/                # Compiled JavaScript ✅
│   ├── package.json         # ✅ Backend dependencies
│   ├── tsconfig.json        # ✅ TypeScript config
│   └── jest.config.js       # ✅ Jest config
├── client/                  # Frontend (T003 - pending)
│   └── .env.example         # ✅ Frontend env template
├── infra/                   # Bicep IaC (T073-T076)
│   ├── main.bicep
│   ├── modules/
│   │   ├── container-registry.bicep
│   │   ├── container-apps-env.bicep
│   │   ├── container-app.bicep
│   │   ├── key-vault.bicep
│   │   └── app-insights.bicep
│   ├── params/
│   │   ├── dev.json
│   │   ├── staging.json
│   │   └── prod.json
│   └── scripts/
│       ├── deploy.sh
│       ├── destroy.sh
│       └── validate.sh
├── docs/                    # Documentation
│   ├── API-reference.md
│   └── deployment.md        # (T076)
├── .eslintrc.json           # ✅ ESLint config
├── .prettierrc.json         # ✅ Prettier config
├── tsconfig.json            # ✅ Root TypeScript config
├── package.json             # ✅ Workspace definition
└── README.md                # This file
```

**Legend**: ✅ Complete | 🚧 In Progress | ⬜ Not Started

## API Endpoints

> See [docs/API-reference.md](docs/API-reference.md) and [.specify/analysis/api-contracts.md](.specify/analysis/api-contracts.md) for complete specifications.

### Shifts

- **GET** `/api/shifts/whos-on` - Get active shifts with clock-in status (grouped)
  - Query: `?workgroup={id}` (optional)
  - Response: Grouped shifts with `assignedPeople`, `clockStatuses`, metrics
- **GET** `/api/shifts/list` - Get all shifts (raw from Shiftboard)

### Accounts

- **GET** `/api/accounts/list` - Get all accounts
- **GET** `/api/accounts/self` - Get current user's account
- **GET** `/api/accounts/workgroup/:id` - Get accounts in workgroup
- **GET** `/api/accounts/:id` - Get account by ID

### Workgroups

- **GET** `/api/workgroups/list` - Get all workgroups
- **GET** `/api/workgroups/:id/roles` - Get roles for workgroup

### Roles

- **GET** `/api/roles/:id` - Get role by ID
- **GET** `/api/roles/list` - Get all roles

### System

- **GET** `/api/system/health` - Health check (200 OK with uptime)
- **POST** `/api/system/echo` - Connectivity test (proxies to Shiftboard)

## Development Status

### ✅ Completed (2/80 tasks)

- **T001**: Repository & Tooling Setup
  - ESLint, Prettier, Husky pre-commit hooks
  - TypeScript strict mode
  - Workspace structure
- **T002**: Backend Project Initialization
  - Express app skeleton with TypeScript
  - Jest configuration (70% coverage thresholds)
  - Health endpoint functional

### 🚧 Current Focus

- **T003**: Frontend Project Initialization (next)
- **Phase 0**: Setup & Foundation (4 tasks remaining)

### 📋 Upcoming Phases

1. **Phase 2**: Foundational (11 tasks) - Blocks all user stories
2. **Phase 3**: User Story 1 - Active Shifts Timeline (10 tasks) 🎯 **MVP**
3. **Phase 4-9**: User Stories 2-7 (53 tasks)
4. **Phase 10**: Polish & Infrastructure (10 tasks)

**Full task breakdown**: [.specify/plans/tasks.md](.specify/plans/tasks.md)

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

### Azure Container Apps (Recommended)

1. **Validate Bicep templates**:

   ```bash
   cd infra
   ./scripts/validate.sh
   ```

2. **Deploy to dev environment**:

   ```bash
   ./scripts/deploy.sh dev
   ```

3. **Verify deployment**:

   ```bash
   curl https://ca-shifts-yourorg-dev.azurecontainerapps.io/api/system/health
   ```

4. **Spin down for seasonal idle** (saves ~$10/month):
   ```bash
   ./scripts/destroy.sh dev
   ```

**Cost breakdown**:

- **Active season**: $10-15/month (Container Apps + ACR + Key Vault + App Insights)
- **Idle season**: $1-3/month (storage only, scaled to zero)
- **Annual cost**: ~$48/year vs $156/year for App Service (69% savings)

### GitHub Actions CI/CD

Push to `main` branch triggers:

1. Backend tests + lint
2. Frontend tests + lint
3. Docker image build → Azure Container Registry
4. Deploy to Azure Container Apps
5. Health check validation

**Status**: T005 pending

## Documentation

- **[Constitution](.specify/memory/constitution.md)**: 7 core principles guiding architecture
- **[Codebase Spec](.specify/analysis/codebase-spec.md)**: Complete feature specification
- **[API Contracts](.specify/analysis/api-contracts.md)**: Endpoint contracts & schemas
- **[Rebuild Plan](.specify/plans/rebuild-plan.md)**: 8-10 week implementation plan
- **[Tasks Breakdown](.specify/plans/tasks.md)**: 80 tasks organized by user story
- **[Enhancements](.specify/analysis/enhancements.md)**: Future improvements roadmap

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
