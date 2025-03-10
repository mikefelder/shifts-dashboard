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
 * @param forceSync Force fetching from API instead of cache
 * @param workgroupId Optional workgroup ID to filter by
 * @returns WhosOn shift data with isFreshData flag
 */
export const getWorkgroupShifts = async (
    forceSync = false,
    workgroupId?: string | null
): Promise<WhosOnResponse & { isFreshData: boolean }> => {
    try {
        console.log(`getWorkgroupShifts called with forceSync=${forceSync}, workgroupId=${workgroupId}`);
        
        // If forceSync is true, always get from API
        if (forceSync) {
            console.log('Forcing sync with API...');
            return await fetchFromApi(workgroupId);
        }
        
        // Check if we have recent local data (less than 1 minute old)
        const lastSync = await dbService.getLastSync();
        const isCacheRecent = lastSync && 
            (new Date().getTime() - lastSync.getTime() <= 60 * 1000); // 1 minute
        
        // Use cache if it's recent and we're not forcing a sync
        if (isCacheRecent) {
            console.log('Using cached data (last sync within 1 minute)');
            return await fetchFromCache(workgroupId);
        }
        
        // Otherwise get fresh data from API
        console.log('Cache expired or not available, fetching from API...');
        return await fetchFromApi(workgroupId);
        
    } catch (error) {
        console.error('API/DB Error:', error);
        
        // Try to fall back to cached data on error
        try {
            console.log('Attempting to use cached data due to API error');
            return await fetchFromCache(workgroupId);
        } catch (cacheError) {
            throw new Error(`Failed to fetch shifts data: ${(error as Error).message}`);
        }
    }
};

// Helper function to fetch from API
async function fetchFromApi(workgroupId?: string | null): Promise<WhosOnResponse & { isFreshData: boolean }> {
    // Build API request params
    const params: Record<string, string> = {
        batch: '100' // Use larger batch size for efficiency
    };
    
    // Add workgroup filter to API call if provided
    if (workgroupId) {
        params.workgroup = workgroupId;
    }
    
    // Make API request
    console.log(`Fetching from API with params:`, params);
    const response = await api.get('/shifts/whos-on', {
        params,
        timeout: 60000 // Long timeout for all pages
    });
    
    // Store all data in IndexedDB regardless of workgroup filter
    await dbService.storeShifts(response.data.result.shifts);
    await dbService.storeAccounts(response.data.result.referenced_objects.account);
    await dbService.storeWorkgroups(response.data.result.referenced_objects.workgroup);
    await dbService.updateLastSync();
    
    console.log(`API fetch complete, stored ${response.data.result.shifts.length} shifts`);
    
    return {
        ...response.data,
        isFreshData: true // Fresh data from API
    };
}

// Helper function to fetch from cache
async function fetchFromCache(workgroupId?: string | null): Promise<WhosOnResponse & { isFreshData: boolean }> {
    const shifts = workgroupId 
        ? await dbService.getShiftsByWorkgroup(workgroupId)
        : await dbService.getShiftsByWorkgroup(null);
        
    const accounts = await dbService.getAllAccounts();
    const workgroups = await dbService.getAllWorkgroups();
    
    console.log(`Cache fetch complete, retrieved ${shifts.length} shifts`);
    
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

// Other API functions...
export const getAccountDetails = async (accountId: string) => {
    try {
        const response = await api.get(`/accounts/${accountId}`);
        return response.data;
    } catch (error) {
        console.error('API Error fetching account:', error);
        throw new Error(`Failed to fetch account data: ${(error as any).message}`);
    }
};
