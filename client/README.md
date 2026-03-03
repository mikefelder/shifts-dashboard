# Shift Dashboard - Frontend

> React + TypeScript + Vite + Material-UI

Frontend SPA for the Shift Dashboard application providing real-time visibility into volunteer shift assignments and clock-in status.

## Technology Stack

- **React 19.2+** - UI framework
- **TypeScript 5.x** - Type safety
- **Vite 7.3+** - Build tool and dev server
- **Material-UI (MUI) 7.3+** - Component library
- **React Router 7.13+** - Client-side routing
- **IndexedDB/idb 8.0+** - Offline-first data storage
- **date-fns 4.1+** - Date/time utilities
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Features

- **Active Shifts Timeline** - Vertical timeline view with dynamic time window
- **Tabular View** - Sortable data table with 8 columns
- **Shift Detail Page** - Dedicated view with responsive and large-screen modes
- **Workgroup Filtering** - Global dropdown to filter by workgroup
- **Offline Mode** - IndexedDB cache with graceful degradation
- **Auto Refresh** - Configurable intervals (5/10/15 minutes)
- **Responsive Design** - Mobile and desktop optimized

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env` file:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000/api

# Application name (displayed in header)
VITE_APP_NAME=Shift Dashboard

# Upcoming shift preview window in minutes (default: 30)
VITE_UPCOMING_SHIFT_PREVIEW_MINUTES=30

# Optional: Committee-specific deployment
# VITE_COMMITTEE_NAME=Finance Committee
# VITE_COMMITTEE_WORKGROUP=finance-committee-id
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Calendar/       # Timeline and shift views
│   ├── Filters/        # Workgroup filter dropdown
│   ├── Layout/         # App layout, header, sidebar
│   └── ErrorBoundary.tsx
├── contexts/           # React Context providers
│   └── WorkgroupContext.tsx
├── pages/              # Route pages
│   ├── Calendar.tsx    # Active shifts timeline
│   ├── Table.tsx       # Tabular view
│   └── ShiftDetail.tsx # Individual shift detail page
├── services/           # API and data services
│   ├── api.service.ts  # Backend API client
│   └── db.service.ts   # IndexedDB operations
├── theme/              # MUI theme configuration
│   └── theme.ts
├── types/              # TypeScript type definitions
│   └── shift.types.ts
├── App.tsx             # Root component with routing
└── main.tsx            # Application entry point
```

## Routes

- `/` - Active shifts timeline (Calendar view)
- `/calendar` - Same as `/` (alias)
- `/table` - Tabular view of all shifts
- `/shift/:shiftId` - Individual shift detail page

## Key Components

### Pages

- **Calendar** - Displays active shifts in vertical timeline format
- **Table** - Shows all shifts in sortable table with 8 columns
- **ShiftDetail** - Detailed view of single shift with two display modes

### Layout

- **AppLayout** - Main layout with header, sidebar, and content area
- **AppHeader** - Top navigation with app name and workgroup filter
- **Sidebar** - Refresh controls and auto-refresh settings

### Calendar Components

- **ActiveShiftsView** - Timeline view with current time indicator
- **TabularShiftView** - Sortable table with column headers
- **ShiftDetailModal** - Modal dialog for shift details
- **PersonDetailModal** - Modal dialog for person contact info

### Filters

- **WorkgroupFilter** - Dropdown selector for filtering by workgroup

## Data Flow

1. **API Layer** (`api.service.ts`)
   - Fetches data from backend API
   - Handles errors and retries
   - Returns `DataWithFreshness<T>` with fresh/stale indicators

2. **Cache Layer** (`db.service.ts`)
   - Stores data in IndexedDB (4 stores: shifts, accounts, workgroups, metadata)
   - Provides fallback when API unavailable
   - Tracks last sync timestamp

3. **UI Layer** (React components)
   - Displays data with loading/error states
   - Shows stale data warnings when offline
   - Auto-refreshes on configurable intervals

## Testing

```bash
# Unit tests (Vitest)
npm test
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui  # Interactive mode

# Lint and type-check
npm run lint
npm run type-check
```

## Docker

```bash
# Build image
docker build -t shift-dashboard-frontend .

# Run container
docker run -p 80:80 shift-dashboard-frontend
```

## Notes

- Uses **strict TypeScript** mode
- **ESLint** enforced on pre-commit
- **Prettier** for code formatting
- **Nginx** serves production build in Docker
- **IndexedDB** enables offline-first architecture

For full documentation, see [../README.md](../README.md)
