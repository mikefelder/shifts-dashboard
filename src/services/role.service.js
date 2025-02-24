const { shiftboardAPI } = require('./shiftboard.service')

async function roleGet(roleId) {
    const params = { id: roleId }
    return await shiftboardAPI('role.get', params)
}

async function roleList(params = {}) {
    return await shiftboardAPI('role.list', params)
}

module.exports = {
    roleGet,
    roleList
}
