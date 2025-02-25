const { systemEcho } = require('../services/system.service')

async function echo(req, res) {
    try {
        const result = await systemEcho(req.body)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    echo
}
