import { openDB, IDBPDatabase } from 'idb';
import { Shift, Account, Workgroup } from '../types/shift.types';

// Database name and version
const DB_NAME = 'hlsr-shifts-db';
const DB_VERSION = 1;

// IndexedDB instance
let db: IDBPDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
async function initDB() {
    if (db) return db;
    
    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(database) {
            // Create stores if they don't exist
            if (!database.objectStoreNames.contains('shifts')) {
                const shiftsStore = database.createObjectStore('shifts', { keyPath: 'id' });
                // Create index for workgroup to enable efficient filtering
                shiftsStore.createIndex('workgroup', 'workgroup', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('accounts')) {
                database.createObjectStore('accounts', { keyPath: 'id' });
            }
            
            if (!database.objectStoreNames.contains('workgroups')) {
                database.createObjectStore('workgroups', { keyPath: 'id' });
            }
            
            if (!database.objectStoreNames.contains('metadata')) {
                database.createObjectStore('metadata', { keyPath: 'key' });
            }
        }
    });
    
    return db;
}

/**
 * Store shifts in IndexedDB
 * @param shifts Array of shifts to store
 */
export async function storeShifts(shifts: Shift[]): Promise<void> {
    const database = await initDB();
    const tx = database.transaction('shifts', 'readwrite');
    
    // Use put instead of add to update existing records
    for (const shift of shifts) {
        await tx.store.put(shift);
    }
    
    await tx.done;
    console.log(`Stored ${shifts.length} shifts in IndexedDB`);
}

/**
 * Get shifts from IndexedDB, optionally filtered by workgroup
 * @param workgroupId Optional workgroup ID to filter by, null for all shifts
 */
export async function getShiftsByWorkgroup(workgroupId: string | null): Promise<Shift[]> {
    const database = await initDB();
    
    // If workgroup ID is provided, use the index for efficient filtering
    if (workgroupId) {
        const tx = database.transaction('shifts', 'readonly');
        const index = tx.store.index('workgroup');
        return await index.getAll(workgroupId);
    } 
    
    // Otherwise return all shifts
    return await database.getAll('shifts');
}

/**
 * Store account information in IndexedDB
 * @param accounts Array of accounts to store
 */
export async function storeAccounts(accounts: Account[]): Promise<void> {
    const database = await initDB();
    const tx = database.transaction('accounts', 'readwrite');
    
    for (const account of accounts) {
        await tx.store.put(account);
    }
    
    await tx.done;
    console.log(`Stored ${accounts.length} accounts in IndexedDB`);
}

/**
 * Get all accounts from IndexedDB
 */
export async function getAllAccounts(): Promise<Account[]> {
    const database = await initDB();
    return await database.getAll('accounts');
}

/**
 * Store workgroup information in IndexedDB
 * @param workgroups Array of workgroups to store
 */
export async function storeWorkgroups(workgroups: Workgroup[]): Promise<void> {
    const database = await initDB();
    const tx = database.transaction('workgroups', 'readwrite');
    
    for (const workgroup of workgroups) {
        await tx.store.put(workgroup);
    }
    
    await tx.done;
    console.log(`Stored ${workgroups.length} workgroups in IndexedDB`);
}

/**
 * Get all workgroups from IndexedDB
 */
export async function getAllWorkgroups(): Promise<Workgroup[]> {
    const database = await initDB();
    return await database.getAll('workgroups');
}

/**
 * Update the last sync timestamp
 */
export async function updateLastSync(): Promise<void> {
    const database = await initDB();
    const timestamp = new Date();
    await database.put('metadata', { key: 'lastSync', timestamp });
    console.log(`Updated last API sync timestamp: ${timestamp.toISOString()}`);
}

/**
 * Get the timestamp of the last sync
 */
export async function getLastSync(): Promise<Date | null> {
    try {
        const database = await initDB();
        const result = await database.get('metadata', 'lastSync');
        return result ? new Date(result.timestamp) : null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
}

/**
 * Get the timestamp when data was last fetched from the API
 * Returns a formatted string for UI display
 */
export async function getLastSyncFormatted(): Promise<string> {
    const lastSync = await getLastSync();
    if (!lastSync) {
        return 'Never';
    }
    
    // Format as "Today 12:34 PM" or "Dec 20 12:34 PM" if not today
    const now = new Date();
    const isToday = now.toDateString() === lastSync.toDateString();
    
    if (isToday) {
        return `Today ${lastSync.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    return lastSync.toLocaleString([], { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Export the service as an object
export const dbService = {
    storeShifts,
    getShiftsByWorkgroup,
    storeAccounts,
    getAllAccounts,
    storeWorkgroups,
    getAllWorkgroups,
    updateLastSync,
    getLastSync,
    getLastSyncFormatted
};
