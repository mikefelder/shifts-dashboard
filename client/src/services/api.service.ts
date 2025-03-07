import axios from 'axios';
import { WhosOnResponse } from '../types/shift.types';
import { dbService } from './db.service';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // Increase timeout for fetching all pages
});

/**
 * Get shifts for all workgroups or a specific workgroup if filtered
 * Uses cached data when possible, especially for workgroup filtering
 * @param forceSync Force fetching from API instead of cache
 * @param workgroupId Optional workgroup ID to filter by
 * @returns WhosOn shift data with isFreshData flag
 */
export const getWorkgroupShifts = async (
    forceSync = false,
    workgroupId?: string | null
): Promise<WhosOnResponse & { isFreshData: boolean }> => {
    try {
        // Check if we need to sync with the API
        const lastSync = await dbService.getLastSync();
        const shouldSync = forceSync || 
            !lastSync || 
            (new Date().getTime() - lastSync.getTime() > 60 * 1000); // 1 minute

        // If workgroup filter is provided and we have fresh data,
        // use the local database instead of making a new API call
        if (workgroupId && lastSync && !forceSync && 
            (new Date().getTime() - lastSync.getTime() <= 60 * 1000)) {
            console.log(`Using cached data for workgroup ${workgroupId}`);
            
            // Get filtered data from IndexedDB
            const shifts = await dbService.getShiftsByWorkgroup(workgroupId);
            const accounts = await dbService.getAllAccounts();
            const workgroups = await dbService.getAllWorkgroups();
            
            return {
                result: {
                    shifts,
                    referenced_objects: {
                        account: accounts,
                        workgroup: workgroups
                    }
                },
                isFreshData: false // Data from cache, not a fresh API call
            };
        }
        
        // If we need fresh data or don't have a workgroup filter
        if (shouldSync) {
            console.log('Fetching fresh data from API (all pages)...');
            
            // Build API request params
            const params: Record<string, string> = {
                batch: '100' // Use larger batch size for efficiency
            };
            
            // Add workgroup filter to API call if provided
            if (workgroupId) {
                params.workgroup = workgroupId;
            }
            
            // Make API request - always getting all pages
            const response = await api.get('/shifts/whos-on', {
                params,
                timeout: 60000 // Long timeout for all pages
            });
            
            // Store the data in IndexedDB
            await dbService.storeShifts(response.data.result.shifts);
            await dbService.storeAccounts(response.data.result.referenced_objects.account);
            await dbService.storeWorkgroups(response.data.result.referenced_objects.workgroup);
            await dbService.updateLastSync();
            
            // Log performance metrics if available
            if (response.data.result.metrics) {
                console.log('API Performance:', response.data.result.metrics);
            }
            
            return {
                ...response.data,
                isFreshData: true // Fresh data from API
            };
        }

        // Return full unfiltered data from IndexedDB if available
        const shifts = workgroupId 
            ? await dbService.getShiftsByWorkgroup(workgroupId)
            : await dbService.getShiftsByWorkgroup(null);
            
        const accounts = await dbService.getAllAccounts();
        const workgroups = await dbService.getAllWorkgroups();
        
        return {
            result: {
                shifts,
                referenced_objects: {
                    account: accounts,
                    workgroup: workgroups
                }
            },
            isFreshData: false // Data from cache, not a fresh API call
        };
    } catch (error) {
        console.error('API/DB Error:', error);
        throw new Error(`Failed to fetch shifts data: ${(error as Error).message}`);
    }
};

export const getAccountDetails = async (accountId: string) => {
    try {
        const response = await api.get(`/accounts/${accountId}`);
        return response.data;
    } catch (error) {
        console.error('API Error fetching account:', error);
        throw new Error(`Failed to fetch account data: ${(error as any).message}`);
    }
};
