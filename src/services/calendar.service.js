const { shiftboardAPI } = require('./shiftboard.service')

async function calendarSummary(params = {}) {
    return await shiftboardAPI('calendar.summary', params)
}

module.exports = {
    calendarSummary
}
