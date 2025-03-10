/**
 * Utility functions for handling pagination
 */
const axios = require('axios');
const { buildAuthenticatedUrl } = require('./shiftboard-auth');

/**
 * Fetch all pages from a Shiftboard API endpoint
 * Handles the "next"/"this" pagination format
 * @param {string} method - The Shiftboard API method (e.g., 'shift.whosOn')
 * @param {object} baseParams - The base parameters to send (without pagination)
 * @param {number} initialBatchSize - Initial number of results per page
 * @returns {Promise<object>} - Combined results from all pages
 */
async function fetchAllPages(method, baseParams = {}, initialBatchSize = 100) {
    let allResults = [];
    let allReferencedObjects = {};
    let hasMorePages = true;
    let currentStart = 0;
    let currentBatch = initialBatchSize;
    let pageCount = 0;
    
    console.log(`Fetching all pages for ${method} with initial batch size ${initialBatchSize}`);
    
    // Loop until no more pages are available
    while (hasMorePages) {
        pageCount++;
        // Add pagination parameters to the request
        const params = {
            ...baseParams,
            page: {
                start: currentStart,
                batch: currentBatch
            }
        };
        
        // Make the API call for this page
        console.log(`Fetching page ${pageCount} (start=${currentStart}, batch=${currentBatch})`);
        const url = buildAuthenticatedUrl(method, params);
        const response = await axios.get(url);
        
        // Check for errors
        if (response.data.error) {
            throw new Error(`API error: ${response.data.error.message}`);
        }
        
        // Add current page results to the combined results
        if (response.data.result?.shifts) {
            allResults = allResults.concat(response.data.result.shifts);
        }
        
        // Merge referenced objects
        if (response.data.result?.referenced_objects) {
            Object.entries(response.data.result.referenced_objects).forEach(([objectType, objects]) => {
                if (!allReferencedObjects[objectType]) {
                    allReferencedObjects[objectType] = [];
                }
                
                // Only add objects that aren't already in the list (by ID)
                objects.forEach(obj => {
                    if (!allReferencedObjects[objectType].some(existing => existing.id === obj.id)) {
                        allReferencedObjects[objectType].push(obj);
                    }
                });
            });
        }
        
        // Check if there are more pages using the next/this format
        const pageInfo = response.data.result?.page;
        if (pageInfo && pageInfo.next) {
            // Use the next page parameters directly
            currentStart = pageInfo.next.start;
            currentBatch = pageInfo.next.batch;
            hasMorePages = true;
        } else {
            // No more pages, exit the loop
            hasMorePages = false;
        }
        
        // Safety check - limit to 100 pages to prevent infinite loops
        if (pageCount >= 100) {
            console.warn('Reached maximum page count (100). Breaking pagination loop.');
            hasMorePages = false;
        }
    }
    
    console.log(`Fetched ${allResults.length} total results from ${pageCount} pages`);
    
    // Return the combined results in the same format as a single page response
    return {
        result: {
            shifts: allResults,
            referenced_objects: allReferencedObjects
        }
    };
}

module.exports = {
    fetchAllPages
};
