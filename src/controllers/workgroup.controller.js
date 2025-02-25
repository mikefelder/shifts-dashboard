const { workgroupList, workgroupListRoles } = require('../services/workgroup.service')

async function listWorkgroups(req, res) {
    try {
        const result = await workgroupList(req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function listRoles(req, res) {
    try {
        const result = await workgroupListRoles(req.params.workgroupId, req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    listWorkgroups,
    listRoles
}
