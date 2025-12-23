#!/usr/local/bin/node

// Load environment variables first, before any other imports
require('dotenv').config();

// Log the module path so we can debug import issues
console.log('Node module paths:', module.paths);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Add this to help with module resolution
module.paths.push(path.join(__dirname, '..', 'node_modules'));

// Test the import of critical modules
try {
    const { groupShiftsByAttributes } = require('./utils/shift.utils');
    console.log('Successfully loaded shift.utils module');
} catch (error) {
    console.error('Failed to load shift.utils module:', error);
}

const errorHandler = require('./middleware/error.middleware');
const config = require('./config/api.config');

const app = express()

// CORS configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOptions = {
    origin: isDevelopment ? 'http://localhost:5173' : true, // Allow all origins in production (or specify your Azure URL)
    optionsSuccessStatus: 200
}

// Middleware
app.use(cors(corsOptions))
app.use(helmet())
app.use(express.json())
app.use(morgan('dev'))

// API Routes
app.use('/api/accounts', require('./routes/account.routes'))
app.use('/api/shifts', require('./routes/shift.routes'))
app.use('/api/workgroups', require('./routes/workgroup.routes'))
app.use('/api/roles', require('./routes/role.routes'))
app.use('/api/calendar', require('./routes/calendar.routes'))
app.use('/api/system', require('./routes/system.routes'))
// Add other routes here as needed

// Serve static files from the React app in production
if (!isDevelopment) {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`API Server is running on http://localhost:${PORT}`)
})
