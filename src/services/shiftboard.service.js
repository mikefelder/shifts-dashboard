const https = require('https')
const jsSHA = require('jssha')
const apiConfig = require('../config/api.config')
const { btoa } = require('../utils/encoding')

async function shiftboardAPI(api_method, obj) {
    var options = {
        host: apiConfig.host,
        path: apiConfig.path,
        method: 'POST',
    }
    var post_data
    var params = JSON.stringify(obj)

    var path = '?access_key_id=' + encodeURIComponent(apiConfig.accessKeyID)

    var shaObj = new jsSHA('SHA-1', 'TEXT')
    shaObj.setHMACKey(apiConfig.secretKey, 'TEXT')

    if (options.method == 'POST') {
        post_data = JSON.stringify({ 
            'id': 1, 
            'jsonrpc': '2.0', 
            'method': api_method, 
            'params': JSON.parse(params) 
        })
        shaObj.update(post_data)
        options.headers = { 
            'Content-Type': 'application/json', 
            'Content-Length': post_data.length 
        }
    }

    var hmac = shaObj.getHMAC('B64')
    path += '&signature=' + encodeURIComponent(hmac)

    options.path += path

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';
            
            res.on('data', (chunk) => {
                responseBody += chunk
            })

            res.on('end', () => {
                try {
                    const parsedResponse = JSON.parse(responseBody)
                    if (parsedResponse.error) {
                        reject(new Error(parsedResponse.error.message || 'API Error'))
                    } else {
                        resolve(parsedResponse)
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse API response: ${error.message}`))
                }
            })
        })

        req.on('error', (error) => {
            reject(new Error(`API request failed: ${error.message}`))
        })

        if (options.method == 'POST') {
            req.write(post_data)
        }
        req.end()
    })
}

/**
 * Process and normalize account data from Shiftboard API
 * @param {Object} accountData - Raw account data from API 
 * @returns {Object} - Normalized account object matching our schema
 */
const processAccountData = (accountData) => {
  if (!accountData || typeof accountData !== 'object') {
    console.error('Invalid account data received:', accountData);
    return null;
  }
  
  try {
    const processedAccount = {
      id: accountData.id,
      external_id: accountData.external_id,
      first_name: accountData.first_name,
      last_name: accountData.last_name,
      screen_name: accountData.screen_name,
      mobile_phone: accountData.mobile_phone || accountData.phone || '',
      profile_type: accountData.profile_type,
      seniority_order: accountData.seniority_order,
      phone: accountData.phone,
      email: accountData.email,
      clocked_in: Boolean(accountData.clocked_in),
      
      // Store the original data for reference
      raw_data: accountData
    };
    
    // Log any missing required fields
    const requiredFields = ['id', 'external_id', 'first_name', 'last_name'];
    const missingFields = requiredFields.filter(field => !processedAccount[field]);
    
    if (missingFields.length > 0) {
      console.warn(`Missing required fields for account ${accountData.id || 'unknown'}: ${missingFields.join(', ')}`);
    }
    
    return processedAccount;
  } catch (error) {
    console.error('Error processing account data:', error);
    return null;
  }
};

/**
 * Process the WhosOn API response to ensure consistent data structure
 * @param {Object} apiResponse - Response from Shiftboard WhosOn API
 * @returns {Object} - Processed response with normalized data
 */
const processWhosOnResponse = (apiResponse) => {
  if (!apiResponse || !apiResponse.result) {
    console.error('Invalid API response format');
    return { result: { shifts: [], referenced_objects: { account: [], workgroup: [] } } };
  }

  try {
    const result = apiResponse.result;
    
    // Process accounts to ensure mobile_phone is included
    const accounts = Array.isArray(result.referenced_objects?.account) 
      ? result.referenced_objects.account.map(processAccountData).filter(Boolean)
      : [];
    
    // Log account data to verify mobile_phone is present
    console.log('Processed accounts sample:', accounts.slice(0, 2));
    
    // Create the processed response
    return {
      result: {
        shifts: result.shifts || [],
        referenced_objects: {
          account: accounts,
          workgroup: result.referenced_objects?.workgroup || []
        },
        pagination: result.pagination,
        page: result.page,
        metrics: result.metrics
      },
      timing: apiResponse.timing
    };
  } catch (error) {
    console.error('Error processing WhosOn response:', error);
    return { result: { shifts: [], referenced_objects: { account: [], workgroup: [] } } };
  }
};

module.exports = {
    shiftboardAPI
}
