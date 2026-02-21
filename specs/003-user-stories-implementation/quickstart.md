# Quickstart — Shifts Dashboard

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

### 1. Clone and install

```bash
git clone <repo-url> shifts-dashboard
cd shifts-dashboard
npm install
cd client && npm install && cd ..
```

### 2. Configure environment

Create `backend/.env`:

```env
SHIFTBOARD_ACCESS_KEY=<your-access-key>
SHIFTBOARD_SECRET_KEY=<your-secret-key>
SHIFTBOARD_HOST=api.shiftdata.com
SHIFTBOARD_PATH=/servola/api/api.cgi
PORT=3000
```

### 3. Start backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3000`.

### 4. Start client

```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173`.

## Verify

- Backend health: `curl http://localhost:3000/health`
- API data: `curl http://localhost:3000/api/shifts/whos-on`
- Open client: `http://localhost:5173`

## Key URLs

| Endpoint                  | Description                |
| ------------------------- | -------------------------- |
| `GET /health`             | Backend health check       |
| `GET /api/shifts/whos-on` | Current active shifts      |
| `GET /api/shifts/list`    | Shift listing with filters |
