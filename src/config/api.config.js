require('dotenv').config();

/**
 * Configuration for Shiftboard API
 * Values come from .env file or environment variables
 */
const config = {
    // Shiftboard API credentials
    accessKeyID: process.env.SHIFTBOARD_ACCESS_KEY_ID,
    secretKey: process.env.SHIFTBOARD_SECRET_KEY,
    
    // Shiftboard API configuration
    host: process.env.SHIFTBOARD_HOST || 'api.shiftdata.com',
    path: process.env.SHIFTBOARD_PATH || '/',
    
    // Server configuration
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // CORS configuration
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

// Log critical configuration items
console.log('API Configuration:', {
    apiHost: config.host,
    hasCredentials: !!config.accessKeyID && !!config.secretKey,
    environment: config.nodeEnv,
    port: config.port
});

module.exports = config;
