const { roleGet, roleList } = require('../services/role.service')

async function getRole(req, res) {
    try {
        const result = await roleGet(req.params.roleId)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function listRoles(req, res) {
    try {
        const result = await roleList(req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    getRole,
    listRoles
}
