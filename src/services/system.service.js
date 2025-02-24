const { shiftboardAPI } = require('./shiftboard.service')

async function systemEcho(params = {}) {
    return await shiftboardAPI('system.echo', params)
}

module.exports = {
    systemEcho
}
