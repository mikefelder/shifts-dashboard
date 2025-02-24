const { shiftList, shiftWhosOn } = require('../services/shift.service')

async function listShifts(req, res) {
    try {
        const result = await shiftList(req.query.workgroup, req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function whosOn(req, res) {
    try {
        const result = await shiftWhosOn(req.query.workgroup, req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    listShifts,
    whosOn
}
