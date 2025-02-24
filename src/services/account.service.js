const { shiftboardAPI } = require('./shiftboard.service')

async function accountList(params = {}) {
    const defaultParams = {
        select: {},
        page: {
            batch: 120,
            start: 1,
        }
    }

    params = { ...defaultParams, ...params }

    try {
        const accountListResult = await shiftboardAPI('account.list', params)
        
        if (!accountListResult || !accountListResult.result) {
            throw new Error('Invalid API response structure')
        }

        if (accountListResult.result.page && accountListResult.result.page.next) {
            params.page = accountListResult.result.page.next
            const nextPageResult = await shiftboardAPI('account.list', params)
            return nextPageResult || accountListResult
        }
        
        return accountListResult
    } catch (error) {
        throw new Error(`Failed to fetch account list: ${error.message}`)
    }
}

async function accountSelf(extended = true, userActions = true) {
    const params = {
        extended,
        user_actions: userActions
    }
    return await shiftboardAPI('account.self', params)
}

async function accountListByWorkgroup(workgroupId, params = {}) {
    const queryParams = {
        ...params,
        workgroup: workgroupId
    }
    return await shiftboardAPI('account.list', queryParams)
}

async function getAccount(accountId) {
    const params = { id: accountId }
    return await shiftboardAPI('account.get', params)
}

module.exports = {
    accountList,
    accountSelf,
    accountListByWorkgroup,
    getAccount
}
