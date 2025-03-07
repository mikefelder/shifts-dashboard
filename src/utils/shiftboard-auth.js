/**
 * Utility functions for Shiftboard API authentication
 */
const crypto = require('crypto');
const config = require('../config/api.config');

/**
 * Build a full URL with authentication for Shiftboard API
 * @param {string} method - The API method to call (e.g., 'shift.whosOn')
 * @param {object} params - The parameters to send with the request
 * @returns {string} - Complete URL with auth parameters
 */
function buildAuthenticatedUrl(method, params = {}) {
    const accessKeyID = config.accessKeyID;
    const secretKey = config.secretKey;
    const host = config.host || 'api.shiftdata.com';
    const path = config.path || '/';
    
    if (!accessKeyID || !secretKey) {
        throw new Error('Shiftboard API credentials not configured');
    }
    
    // Convert params to string for signature calculation
    const paramsString = JSON.stringify(params);
    
    // Create the string to sign
    const shaData = `method${method}params${paramsString}`;
    
    // Create HMAC-SHA1 signature
    const hmac = crypto.createHmac('sha1', secretKey);
    hmac.update(shaData);
    const signature = hmac.digest('base64');
    
    // Encode parameters as base64
    const encodedParams = Buffer.from(paramsString).toString('base64');
    
    // Build query string
    const queryParams = {
        method,
        params: encodedParams,
        access_key_id: accessKeyID,
        jsonrpc: '2.0',
        id: '1',
        signature
    };
    
    // Convert to URL query string
    const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    // Construct full URL
    const baseUrl = `https://${host}${path}`;
    return `${baseUrl}?${queryString}`;
}

module.exports = {
    buildAuthenticatedUrl
};
