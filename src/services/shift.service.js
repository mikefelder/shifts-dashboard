const { shiftboardAPI } = require('./shiftboard.service')

async function shiftWhosOn(params = {}) {
    const defaultParams = {
        page: {
            batch: 100,
            start: 1,
        },
        extended: true,
        timeclock_status: true
    }

    params = { ...defaultParams, ...params }
    let allShifts = []
    let allAccounts = []
    let allWorkgroups = []
    let hasMorePages = true

    try {
        while (hasMorePages) {
            const response = await shiftboardAPI('shift.whosOn', params)
            
            if (!response?.result?.shifts) {
                throw new Error('Invalid API response structure')
            }

            // Accumulate results
            allShifts = [...allShifts, ...response.result.shifts]
            if (response.result.referenced_objects?.account) {
                allAccounts = [...allAccounts, ...response.result.referenced_objects.account]
            }
            if (response.result.referenced_objects?.workgroup) {
                allWorkgroups = [...allWorkgroups, ...response.result.referenced_objects.workgroup]
            }

            // Check for next page
            if (response.result.page && response.result.page.next) {
                params.page = response.result.page.next
            } else {
                hasMorePages = false
            }
        }

        // Deduplicate arrays based on id
        const uniqueShifts = [...new Map(allShifts.map(shift => [shift.id, shift])).values()]
        const uniqueAccounts = [...new Map(allAccounts.map(acc => [acc.id, acc])).values()]
        const uniqueWorkgroups = [...new Map(allWorkgroups.map(wg => [wg.id, wg])).values()]

        console.log(`Total shifts collected: ${uniqueShifts.length}`)
        
        return {
            result: {
                shifts: uniqueShifts,
                referenced_objects: {
                    account: uniqueAccounts,
                    workgroup: uniqueWorkgroups
                }
            }
        }
    } catch (error) {
        console.error('Error in shiftWhosOn:', error)
        throw new Error(`Failed to fetch who's on data: ${error.message}`)
    }
}

async function shiftList(workgroupId, params = {}) {
    const defaultParams = {
        select: {
            workgroup: workgroupId
        },
        page: {
            batch: 100,
            start: 1,
        }
    }

    params = { ...defaultParams, ...params }

    try {
        const shiftListResult = await shiftboardAPI('shift.list', params)
        
        if (!shiftListResult || !shiftListResult.result) {
            throw new Error('Invalid API response structure')
        }

        if (shiftListResult.result.page && shiftListResult.result.page.next) {
            params.page = shiftListResult.result.page.next
            const nextPageResult = await shiftboardAPI('shift.list', params)
            return nextPageResult || shiftListResult
        }
        
        return shiftListResult
    } catch (error) {
        throw new Error(`Failed to fetch shift list: ${error.message}`)
    }
}

module.exports = {
    shiftList,
    shiftWhosOn
}
