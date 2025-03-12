const axios = require('axios');
const config = require('../config/api.config');
const { buildAuthenticatedUrl } = require('../utils/shiftboard-auth');
const { fetchAllPages } = require('../utils/pagination');

// Make sure groupShiftsByAttributes is available
let groupShiftsByAttributes;
try {
    const shiftUtils = require('../utils/shift.utils');
    groupShiftsByAttributes = shiftUtils.groupShiftsByAttributes;
    
    if (typeof groupShiftsByAttributes !== 'function') {
        console.error('Warning: groupShiftsByAttributes is not a function');
        groupShiftsByAttributes = (shifts) => shifts;
    }
} catch (error) {
    console.error('Failed to import shift.utils:', error);
    groupShiftsByAttributes = (shifts) => shifts;
}

/**
 * Get list of shifts from Shiftboard API
 * @param {string} workgroupId - Optional workgroup ID to filter shifts
 * @param {object} queryParams - Additional query parameters
 * @returns {Promise<object>} - Shift data
 */
async function shiftList(workgroupId, queryParams = {}) {
    try {
        const params = {};
        
        // Add workgroup filter if provided
        if (workgroupId) {
            params.select = { workgroup: workgroupId };
        }
        
        // Add pagination if specified in query
        if (queryParams.start || queryParams.batch) {
            params.page = {
                start: parseInt(queryParams.start) || 0,
                batch: parseInt(queryParams.batch) || 100
            };
        }
        
        // Build authenticated URL
        const url = buildAuthenticatedUrl('shift.list', params);
        console.log(`Making request to shift.list`);
        
        // Call the Shiftboard API
        const response = await axios.get(url);
        
        // Check for errors in the API response
        if (response.data.error) {
            throw new Error(`Shiftboard API error: ${response.data.error.message}`);
        }
        
        // Return the raw response data
        return response.data;
    } catch (error) {
        console.error('Error in shiftList service:', error.message);
        throw error;
    }
}

/**
 * Get who's on shifts with support for complete data retrieval
 * @param {string} workgroupId - Optional workgroup ID to filter shifts
 * @param {object} queryParams - Additional query parameters
 * @returns {Promise<object>} - Processed shift data with grouped shifts from all pages
 */
async function shiftWhosOn(workgroupId, queryParams = {}) {
    try {
        // Base parameters - ALWAYS include timeclock_status
        const baseParams = {
            // Explicitly set timeclock_status to true
            timeclock_status: true
        };
        
        // Add workgroup filter if provided
        if (workgroupId) {
            baseParams.select = { workgroup: workgroupId };
        }
        
        console.log('Using parameters for whosOn API call:', JSON.stringify(baseParams));
        
        // Start time for performance tracking
        const fetchStartTime = Date.now();
        
        // Fetch a single page first to verify parameters are working
        const initialBatchSize = parseInt(queryParams.batch) || 100;
        baseParams.page = {
            start: 0,
            batch: initialBatchSize
        };
        
        // Log the exact parameters we're sending
        console.log(`Making initial API call with parameters:`, JSON.stringify(baseParams));
        
        // Make a direct API call first to test parameters
        const url = buildAuthenticatedUrl('shift.whosOn', baseParams);
        
        const response = await axios.get(url);
        
        // Check if we got clock-in data in the first page
        if (response.data.result?.shifts) {
            const clockedInShifts = response.data.result.shifts.filter(s => s.clocked_in === true);
            console.log(`Found ${clockedInShifts.length} clocked-in shifts out of ${response.data.result.shifts.length}`);
            
            // If no shifts have clock-in data, try alternative format
            if (response.data.result.shifts.length > 0 && clockedInShifts.length === 0) {
                console.log('No clocked-in shifts found, trying with string "true"');
                baseParams.timeclock_status = "true";
                
                // Try again with string "true"
                const altUrl = buildAuthenticatedUrl('shift.whosOn', baseParams);
                const altResponse = await axios.get(altUrl);
                
                // Use this response if it contains clocked-in shifts
                if (altResponse.data.result?.shifts) {
                    const altClockedInShifts = altResponse.data.result.shifts.filter(s => s.clocked_in === true);
                    if (altClockedInShifts.length > 0) {
                        console.log(`String "true" worked! Found ${altClockedInShifts.length} clocked-in shifts`);
                        // Use this response for the rest of the processing
                        response.data = altResponse.data;
                    }
                }
            }
        }
        
        // Now proceed with full pagination using the working parameter format
        const fetchEndTime = Date.now();
        console.log(`Initial page fetch time: ${fetchEndTime - fetchStartTime}ms`);
        
        // Continue with pagination if needed
        let allResults = response.data.result.shifts || [];
        const allReferencedObjects = response.data.result.referenced_objects || {};
        
        // If there are more pages, fetch them using the same parameter format
        if (response.data.result?.page?.next) {
            console.log('Fetching additional pages with working parameter format');
            const remainingPages = await fetchRemainingPages(
                'shift.whosOn', 
                baseParams, 
                response.data.result.page.next
            );
            
            // Merge results
            allResults = allResults.concat(remainingPages.shifts || []);
            
            // Merge referenced objects
            Object.entries(remainingPages.referencedObjects || {}).forEach(([objectType, objects]) => {
                if (!allReferencedObjects[objectType]) {
                    allReferencedObjects[objectType] = [];
                }
                
                objects.forEach(obj => {
                    if (!allReferencedObjects[objectType].some(existing => existing.id === obj.id)) {
                        allReferencedObjects[objectType].push(obj);
                    }
                });
            });
        }
        
        // Finish time for data fetching
        const completeEndTime = Date.now();
        console.log(`All data fetched in ${completeEndTime - fetchStartTime}ms`);
        console.log(`Retrieved ${allResults.length} total shifts`);
        
        // Process and group shifts
        const groupingStartTime = Date.now();
        const accounts = allReferencedObjects.account || [];
        const groupedShifts = groupShiftsByAttributes(allResults, accounts);
        const groupingEndTime = Date.now();
        
        // Clock in status summary
        const clockedInCount = allResults.filter(s => s.clocked_in === true).length;
        console.log(`Clock-in status: ${clockedInCount} of ${allResults.length} shifts clocked in (${Math.round(clockedInCount/allResults.length*100)}%)`);
        
        // Create the final result object with timing information
        const result = {
            result: {
                shifts: groupedShifts,
                referenced_objects: allReferencedObjects,
                metrics: {
                    original_shift_count: allResults.length,
                    clocked_in_count: clockedInCount,
                    grouped_shift_count: groupedShifts.length,
                    fetch_time_ms: completeEndTime - fetchStartTime,
                    grouping_time_ms: groupingEndTime - groupingStartTime,
                    total_time_ms: Date.now() - fetchStartTime
                }
            }
        };
        
        return result;
    } catch (error) {
        console.error('Error in shiftWhosOn service:', error);
        throw error;
    }
}

/**
 * Helper function to fetch remaining pages
 */
async function fetchRemainingPages(method, baseParams, nextPageInfo) {
    let allShifts = [];
    let allReferencedObjects = {};
    let hasMorePages = true;
    let currentPage = nextPageInfo;
    let pageCount = 1; // Start from 1 because we already fetched the first page
    
    while (hasMorePages) {
        pageCount++;
        try {
            // Use the same baseParams but update the page info
            const params = {
                ...baseParams,
                page: currentPage
            };
            
            const url = buildAuthenticatedUrl(method, params);
            const response = await axios.get(url);
            
            // Add shifts to the result
            if (response.data.result?.shifts) {
                allShifts = allShifts.concat(response.data.result.shifts);
            }
            
            // Merge referenced objects
            if (response.data.result?.referenced_objects) {
                Object.entries(response.data.result.referenced_objects).forEach(([objectType, objects]) => {
                    if (!allReferencedObjects[objectType]) {
                        allReferencedObjects[objectType] = [];
                    }
                    
                    objects.forEach(obj => {
                        if (!allReferencedObjects[objectType].some(existing => existing.id === obj.id)) {
                            allReferencedObjects[objectType].push(obj);
                        }
                    });
                });
            }
            
            // Check for more pages
            if (response.data.result?.page?.next) {
                currentPage = response.data.result.page.next;
                hasMorePages = true;
            } else {
                hasMorePages = false;
            }
            
            // Safety check
            if (pageCount >= 100) {
                console.warn('Reached maximum page count (100). Breaking pagination loop.');
                hasMorePages = false;
            }
            
        } catch (error) {
            console.error(`Error fetching page ${pageCount}:`, error);
            hasMorePages = false;
        }
    }
    
    console.log(`Fetched ${pageCount} additional pages with ${allShifts.length} shifts`);
    return {
        shifts: allShifts,
        referencedObjects: allReferencedObjects
    };
}

module.exports = {
    shiftList,
    shiftWhosOn
};
