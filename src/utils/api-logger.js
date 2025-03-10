/**
 * API Logger utility
 * Provides consistent logging for API calls and responses
 */
const fs = require('fs').promises;
const path = require('path');

// Log file path
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const API_LOG_FILE = path.join(LOG_DIR, 'api-calls.log');

// Ensure log directory exists
async function ensureLogDir() {
    try {
        await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating log directory:', error);
    }
}

/**
 * Log API call details
 * @param {string} method - API method being called
 * @param {object} params - Parameters sent to the API
 * @param {string} url - Full URL of the API call
 */
async function logApiRequest(method, params, url) {
    await ensureLogDir();
    
    const timestamp = new Date().toISOString();
    let logEntry = `\n[${timestamp}] API REQUEST: ${method}\n`;
    logEntry += `Parameters: ${JSON.stringify(params)}\n`;
    logEntry += `URL: ${url.split('?')[0]}\n`;
    
    try {
        await fs.appendFile(API_LOG_FILE, logEntry);
    } catch (error) {
        console.error('Error writing to API log:', error);
    }
}

/**
 * Log API response details
 * @param {string} method - API method that was called
 * @param {object} response - API response data
 * @param {number} duration - Duration of the call in milliseconds
 */
async function logApiResponse(method, response, duration) {
    await ensureLogDir();
    
    const timestamp = new Date().toISOString();
    let logEntry = `\n[${timestamp}] API RESPONSE: ${method} (${duration}ms)\n`;
    
    // Extract pagination info if available
    if (response.result && response.result.page) {
        logEntry += `Pagination: ${JSON.stringify(response.result.page)}\n`;
    }
    
    // Log basic response metrics to avoid excessive logs
    if (response.result && response.result.shifts) {
        logEntry += `Shifts count: ${response.result.shifts.length}\n`;
    }
    
    try {
        await fs.appendFile(API_LOG_FILE, logEntry);
    } catch (error) {
        console.error('Error writing to API log:', error);
    }
}

module.exports = {
    logApiRequest,
    logApiResponse
};
