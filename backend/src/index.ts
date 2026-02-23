import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { getShiftboardService } from './services/shiftboard.service';
import { createShiftService } from './services/shift.service';
import { createShiftController } from './controllers/shift.controller';
import { createShiftRoutes } from './routes/shift.routes';
import { createWorkgroupService } from './services/workgroup.service';
import { createWorkgroupController } from './controllers/workgroup.controller';
import { createWorkgroupRoutes } from './routes/workgroup.routes';
import { createAccountService } from './services/account.service';
import { createAccountController } from './controllers/account.controller';
import { createAccountRoutes } from './routes/account.routes';
import { createRoleService } from './services/role.service';
import { createRoleController } from './controllers/role.controller';
import { createRoleRoutes } from './routes/role.routes';
import { createCalendarService } from './services/calendar.service';
import { createCalendarController } from './controllers/calendar.controller';
import { createCalendarRoutes } from './routes/calendar.routes';
import { createSystemController } from './controllers/system.controller';
import { createSystemRoutes } from './routes/system.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS - Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:8080',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================================================
// Logging Middleware
// ============================================================================

// Morgan - HTTP request logging
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Request ID (for tracing)
app.use((req, _res, next) => {
  req.headers['x-request-id'] =
    req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  next();
});

// ============================================================================
// Body Parsing Middleware
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Shift Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Initialize shared Shiftboard service
const shiftboardService = getShiftboardService();

// Shift routes
const shiftService = createShiftService(shiftboardService);
const shiftController = createShiftController(shiftService);
const shiftRoutes = createShiftRoutes(shiftController);
app.use('/api/shifts', shiftRoutes);

// Workgroup routes
const workgroupService = createWorkgroupService(shiftboardService);
const workgroupController = createWorkgroupController(workgroupService);
const workgroupRoutes = createWorkgroupRoutes(workgroupController);
app.use('/api/workgroups', workgroupRoutes);

// Account routes
const accountService = createAccountService(shiftboardService);
const accountController = createAccountController(accountService);
const accountRoutes = createAccountRoutes(accountController);
app.use('/api/accounts', accountRoutes);

// Role routes
const roleService = createRoleService(shiftboardService);
const roleController = createRoleController(roleService);
const roleRoutes = createRoleRoutes(roleController);
app.use('/api/roles', roleRoutes);

// Calendar routes
const calendarService = createCalendarService();
const calendarController = createCalendarController(calendarService);
const calendarRoutes = createCalendarRoutes(calendarController);
app.use('/api/calendar', calendarRoutes);

// System routes
const systemController = createSystemController();
const systemRoutes = createSystemRoutes(systemController);
app.use('/api/system', systemRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler (must be BEFORE error handler)
app.use(notFoundHandler);

// Error handler (must be LAST)
app.use(errorHandler);

// ============================================================================
// Server Start
// ============================================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Shift Dashboard API Server          ║
╠════════════════════════════════════════╣
║ Port:        ${PORT.toString().padEnd(25)}║
║ Environment: ${NODE_ENV.padEnd(25)}║
║ Status:      Running                  ║
╚════════════════════════════════════════╝
    `);
  });
}

export default app;
