import { openDB, DBSchema } from 'idb';
import { Shift, Account, Workgroup } from '../types/shift.types';

interface ShiftboardDB extends DBSchema {
    shifts: {
        key: string;
        value: Shift;
        indexes: {
            'by-workgroup': string;
            'by-date': string;
        };
    };
    accounts: {
        key: string;
        value: Account;
    };
    workgroups: {
        key: string;
        value: Workgroup;
    };
    metadata: {
        key: string;
        value: {
            lastSync: Date;
        };
    };
}

const dbPromise = openDB<ShiftboardDB>('shiftboard-store', 1, {
    upgrade(db) {
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' });
        shiftStore.createIndex('by-workgroup', 'workgroup');
        shiftStore.createIndex('by-date', 'local_start_date');
        
        db.createObjectStore('accounts', { keyPath: 'id' });
        db.createObjectStore('workgroups', { keyPath: 'id' });
        db.createObjectStore('metadata', { keyPath: 'key' });
    },
});

export const dbService = {
    async storeShifts(shifts: Shift[]) {
        const db = await dbPromise;
        const tx = db.transaction('shifts', 'readwrite');
        await Promise.all(shifts.map(shift => tx.store.put(shift)));
        await tx.done;
    },

    async storeAccounts(accounts: Account[]) {
        const db = await dbPromise;
        const tx = db.transaction('accounts', 'readwrite');
        await Promise.all(accounts.map(account => tx.store.put(account)));
        await tx.done;
    },

    async storeWorkgroups(workgroups: Workgroup[]) {
        const db = await dbPromise;
        const tx = db.transaction('workgroups', 'readwrite');
        await Promise.all(workgroups.map(workgroup => tx.store.put(workgroup)));
        await tx.done;
    },

    async getShiftsByWorkgroup(workgroupId: string | null = null) {
        const db = await dbPromise;
        if (workgroupId) {
            return await db.getAllFromIndex('shifts', 'by-workgroup', workgroupId);
        }
        return await db.getAll('shifts');
    },

    async getAllAccounts() {
        const db = await dbPromise;
        return await db.getAll('accounts');
    },

    async getAllWorkgroups() {
        const db = await dbPromise;
        return await db.getAll('workgroups');
    },

    async updateLastSync() {
        const db = await dbPromise;
        await db.put('metadata', { key: 'lastSync', lastSync: new Date() });
    },

    async getLastSync() {
        const db = await dbPromise;
        const meta = await db.get('metadata', 'lastSync');
        return meta?.lastSync;
    }
};
