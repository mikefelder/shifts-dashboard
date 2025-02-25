import axios from 'axios';
import { WhosOnResponse } from '../types/shift.types';
import { dbService } from './db.service';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const getWorkgroupShifts = async (forceSync = false): Promise<WhosOnResponse> => {
    try {
        // Check if we need to sync
        const lastSync = await dbService.getLastSync();
        const shouldSync = forceSync || 
            !lastSync || 
            (new Date().getTime() - lastSync.getTime() > 5 * 60 * 1000); // 5 minutes

        if (shouldSync) {
            console.log('Fetching fresh data from API...');
            const response = await api.get('/shifts/whos-on');
            
            // Store the data
            await dbService.storeShifts(response.data.result.shifts);
            await dbService.storeAccounts(response.data.result.referenced_objects.account);
            await dbService.storeWorkgroups(response.data.result.referenced_objects.workgroup);
            await dbService.updateLastSync();
            
            return response.data;
        }

        // Return data from IndexedDB
        const shifts = await dbService.getShiftsByWorkgroup(null);
        const accounts = await dbService.getAllAccounts();
        const workgroups = await dbService.getAllWorkgroups();

        return {
            result: {
                shifts,
                referenced_objects: {
                    account: accounts,
                    workgroup: workgroups
                }
            }
        };
    } catch (error) {
        console.error('API/DB Error:', error);
        throw new Error(`Failed to fetch shifts data: ${(error as any).message}`);
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
