const { calendarSummary } = require('../services/calendar.service')

async function getSummary(req, res) {
    try {
        const result = await calendarSummary(req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    getSummary
}
