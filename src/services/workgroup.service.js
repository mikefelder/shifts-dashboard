const { shiftboardAPI } = require('./shiftboard.service')

async function workgroupList(params = { extended: true }) {
    return await shiftboardAPI('workgroup.list', params)
}

async function workgroupListRoles(workgroupId, params = {}) {
    const queryParams = {
        ...params,
        workgroup: workgroupId
    }
    return await shiftboardAPI('workgroup.listRoles', queryParams)
}

module.exports = {
    workgroupList,
    workgroupListRoles
}
