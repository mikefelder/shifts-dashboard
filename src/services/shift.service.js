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
        // Base parameters (non-pagination)
        const baseParams = {};
        
        // Add workgroup filter if provided
        if (workgroupId) {
            baseParams.select = { workgroup: workgroupId };
        }
        
        // Additional parameters for the whosOn API
        if (queryParams.include_clocked_in !== undefined) {
            baseParams.include_clocked_in = queryParams.include_clocked_in === 'true';
        }
        
        // Start time for performance tracking
        const fetchStartTime = Date.now();
        
        // Fetch all pages
        const initialBatchSize = parseInt(queryParams.batch) || 100;
        console.log(`Fetching ALL shift pages with initial batch size ${initialBatchSize}`);
        
        const rawData = await fetchAllPages('shift.whosOn', baseParams, initialBatchSize);
        
        const fetchEndTime = Date.now();
        console.log(`Fetched all pages in ${fetchEndTime - fetchStartTime}ms`);
        
        // Get account and shift data
        const accounts = rawData.result?.referenced_objects?.account || [];
        const shifts = rawData.result?.shifts || [];
        
        console.log(`Retrieved ${shifts.length} total shifts from Shiftboard whosOn API`);
        
        // Process and group shifts
        const groupingStartTime = Date.now();
        const groupedShifts = groupShiftsByAttributes(shifts, accounts);
        const groupingEndTime = Date.now();
        
        console.log(`Grouped ${shifts.length} shifts into ${groupedShifts.length} distinct shifts in ${groupingEndTime - groupingStartTime}ms`);
        
        // Create the final result object with timing information
        const result = {
            result: {
                shifts: groupedShifts,
                referenced_objects: rawData.result.referenced_objects,
                metrics: {
                    original_shift_count: shifts.length,
                    grouped_shift_count: groupedShifts.length,
                    fetch_time_ms: fetchEndTime - fetchStartTime,
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

module.exports = {
    shiftList,
    shiftWhosOn
};
