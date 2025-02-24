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

module.exports = {
    shiftboardAPI
}
