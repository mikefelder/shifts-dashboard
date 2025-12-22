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
 * Get shifts that are currently active (who's on)
 * @param {*} req - Express request object
 * @param {*} res - Express response object
 */
async function whosOn(req, res) {
    try {
        const startTime = Date.now();
        
        console.log('WhosOn API request received:', req.query);
        
        // Always ensure timeclock_status and extended params are true (will be handled in service)
        // This is already taken care of in the service, just log the request
        
        // Get shifts with who's on data
        const result = await shiftWhosOn(req.query.workgroup, req.query);
        
        // Calculate duration and add timing information
        const duration = Date.now() - startTime;
        result.timing = {
            duration_ms: duration,
            timestamp: new Date().toISOString()
        };
        
        // Summary of shifts
        const shifts = result.result.shifts || [];
        const clockedInCount = shifts.reduce((count, shift) => {
            const shiftClockedIn = (shift.clockStatuses || []).filter(Boolean).length;
            return count + shiftClockedIn;
        }, 0);
        
        const totalAssigned = shifts.reduce((count, shift) => {
            return count + (shift.assignedPeople?.length || 0);
        }, 0);
        
        console.log(`API response ready: ${shifts.length} shifts with ${clockedInCount}/${totalAssigned} people clocked in`);
        
        res.json(result);
    } catch (error) {
        console.error('Error in whosOn controller:', error);
        
        // Send a more detailed error response
        res.status(500).json({ 
            error: 'Failed to fetch shift data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

module.exports = {
    listShifts,
    whosOn
}
