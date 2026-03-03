# Shift Dashboard - Frontend

React + TypeScript + Vite frontend for the Shift Dashboard application.

## Overview

The frontend provides a real-time dashboard for viewing volunteer shift assignments and clock-in status. Built with React 19, Material-UI, and Vite for optimal development experience and production performance.

### Key Features

- **Active Shifts Timeline**: Vertical hourly timeline with dynamic time window
- **Tabular View**: Sortable data table with 8 columns
- **Workgroup Filtering**: Global dropdown selector
- **Shift Details Modal**: Comprehensive shift information
- **Person Contact Modal**: Direct call/text actions
- **Manual & Auto Refresh**: Configurable intervals (5/10/15 minutes)
- **Offline Mode**: IndexedDB cache with graceful degradation
- **Responsive Design**: Desktop and mobile-optimized layouts

## Technology Stack

- **React 19.2+**: UI framework with latest features
- **TypeScript 5.x**: Type-safe development
- **Vite 7.3+**: Fast build tool with HMR
- **Material-UI (MUI) 7.3+**: Component library
- **React Router 7.13+**: Client-side routing
- **IndexedDB/idb 8.0+**: Offline storage
- **date-fns 4.1+**: Date formatting and manipulation

## Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/           # Runtime configuration utilities
│   ├── contexts/         # React contexts (Settings, Cache, Theme)
│   ├── pages/            # Route page components
│   ├── services/         # API and cache services
│   ├── theme/            # MUI theme configuration
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── e2e/                  # Playwright E2E tests
├── Dockerfile            # Production container image
├── nginx.conf            # Nginx server configuration
└── index.html            # HTML template
```

## Runtime Configuration

The frontend uses a **runtime configuration** system to inject the backend API URL at container startup, avoiding the need to rebuild images for different environments.

### How It Works

1. **Build Time**: Frontend is built with placeholders
2. **Container Start**: `entrypoint.sh` generates `/usr/share/nginx/html/config.js`:
   ```javascript
   window.__RUNTIME_CONFIG__ = {
     apiUrl: 'https://backend.example.com',
   };
   ```
3. **Runtime**: Application reads config via `getRuntimeConfig()` utility

### Configuration Utilities

**`src/config/runtime.ts`**:

```typescript
// Get runtime configuration
export function getRuntimeConfig(): RuntimeConfig {
  return window.__RUNTIME_CONFIG__ || {};
}

// Get API base URL (runtime or build-time fallback)
export function getApiBaseUrl(): string {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig.apiUrl || import.meta.env.VITE_API_BASE_URL || '';
}
```

**Usage in Services**:

```typescript
import { getApiBaseUrl } from '@/config/runtime';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
});
```

### Environment Variables

**Development** (`.env.development`):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

**Production** (injected at runtime):

```bash
# Set in Azure Container App environment
VITE_API_BASE_URL=https://shift-dashboard-backend-prod.azurecontainerapps.io
```

## Development

### Prerequisites

- Node.js 20.x LTS
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Runs on `http://localhost:5173` with hot module replacement.

### Build for Production

```bash
npm run build
```

Outputs to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

## Docker Deployment

### Build Image

```bash
docker build -t shift-dashboard-frontend -f client/Dockerfile .
```

### Run Container

```bash
docker run -p 8080:80 \
  -e VITE_API_URL=http://backend:3000 \
  shift-dashboard-frontend
```

The `entrypoint.sh` script will:

1. Generate `/usr/share/nginx/html/config.js` with runtime config
2. Start Nginx server

### Azure Container Apps

The frontend is deployed to Azure Container Apps with:

- **Managed Identity**: System-assigned for secure resource access
- **Health Probes**: Liveness (/) and readiness (/) checks
- **Autoscaling**: HTTP (10 concurrent), CPU (70%), Memory (80%)
- **Environment Variables**: `VITE_API_URL` injected from backend URL output

## Key Dependencies

- **@mui/material**: Material-UI component library
- **react-router-dom**: Client-side routing
- **axios**: HTTP client for API calls
- **idb**: IndexedDB wrapper for offline storage
- **date-fns**: Date utility library

## ESLint Configuration

This template uses a minimal ESLint setup. For production applications, we recommend enabling type-aware lint rules:

```js
export default defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
```

## Troubleshooting

### Backend API Not Reachable

Check runtime configuration:

```javascript
// In browser console
console.log(window.__RUNTIME_CONFIG__);
```

Expected output:

```json
{
  "VITE_API_URL": "https://backend.example.com"
}
```

### Offline Mode Not Working

1. Check IndexedDB in browser DevTools → Application → Storage
2. Verify cache service is initialized in browser console:
   ```javascript
   // Should see cache operations in Network tab
   ```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```
