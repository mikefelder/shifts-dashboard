const { accountList, accountSelf, accountListByWorkgroup, getAccount } = require('../services/account.service')

async function listAccounts(req, res) {
    try {
        const result = await accountList(req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function getSelf(req, res) {
    try {
        const result = await accountSelf(
            req.query.extended === 'true',
            req.query.user_actions === 'true'
        )
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function listByWorkgroup(req, res) {
    try {
        const result = await accountListByWorkgroup(req.params.workgroupId, req.query)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function getAccountById(req, res) {
    try {
        const result = await getAccount(req.params.accountId)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    listAccounts,
    getSelf,
    listByWorkgroup,
    getAccount: getAccountById  // Match the route's expected method name
}
