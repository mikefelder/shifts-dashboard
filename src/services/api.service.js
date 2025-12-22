const axios = require('axios');
const config = require('../config');
const { getAuthToken } = require('./auth.service');

/**
 * Make authenticated API call to Shiftboard
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response
 */
const makeApiCall = async (endpoint, params = {}) => {
  try {
    const token = await getAuthToken();
    
    const url = `${config.SHIFTBOARD_API_BASE_URL}${endpoint}`;
    
    console.log(`Making API call to: ${url}`);
    console.log('With params:', params);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params
    });
    
    return response.data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Get Who's On data from Shiftboard API
 * Ensure we're requesting full account data including mobile_phone
 * @returns {Promise<Object>} - WhosOn API response
 */
const getWhosOnData = async () => {
  try {
    // Request the mobile_phone field explicitly in includes parameter
    // This ensures we get all the fields we need from the API
    const params = {
      include_organization: true,
      include_users: true,
      include_fields: 'mobile_phone,phone,email', // Explicitly request these fields
      start: 0,
      batch: 999  // Adjust batch size as needed
    };
    
    const whosOnData = await makeApiCall('/whos-on', params);
    
    // Check if we have mobile_phone in the response
    if (whosOnData?.result?.referenced_objects?.account?.length > 0) {
      const sampleAccount = whosOnData.result.referenced_objects.account[0];
      console.log('Sample raw account data from API:', {
        id: sampleAccount.id,
        has_mobile: sampleAccount.hasOwnProperty('mobile_phone'),
        mobile_phone: sampleAccount.mobile_phone,
        has_phone: sampleAccount.hasOwnProperty('phone'),
        phone: sampleAccount.phone
      });
    }
    
    return whosOnData;
  } catch (error) {
    console.error('Failed to get Who\'s On data:', error.message);
    throw error;
  }
};

module.exports = {
  makeApiCall,
  getWhosOnData
};
