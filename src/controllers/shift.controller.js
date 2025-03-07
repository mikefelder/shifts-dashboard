const { shiftList, shiftWhosOn } = require('../services/shift.service')

async function listShifts(req, res) {
    try {
        const result = await shiftList(req.query.workgroup, req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get shifts that are currently active or will start soon
 * By default loads all pages
 */
async function whosOn(req, res) {
    try {
        // Start time for performance tracking
        const startTime = Date.now();
        
        // Forward all query parameters to service
        // The service will handle pagination and determine if single_page or all_pages should be used
        const result = await shiftWhosOn(req.query.workgroup, req.query);
        
        // End time for performance tracking
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Add timing info to response
        result.timing = {
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };
        
        // Log performance metrics
        console.log(`WhosOn request completed in ${duration}ms, returned ${result.result.shifts.length} shifts`);
        
        res.json(result);
    } catch (error) {
        console.error('Error in whosOn controller:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch shift data',
            details: error.message
        });
    }
}

module.exports = {
    listShifts,
    whosOn
}
