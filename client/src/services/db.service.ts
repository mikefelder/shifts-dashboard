/**
 * IndexedDB Service
 *
 * Client-side persistent storage for offline resilience.
 * Provides graceful degradation when API is unavailable.
 *
 * Database: hlsr-shifts-db (version 1)
 * Stores: shifts, accounts, workgroups, metadata
 *
 * Features:
 * - Automatic upsert operations (update or insert)
 * - Workgroup filtering via index
 * - Last sync timestamp tracking
 * - Promise-based API (using idb library)
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// ============================================================================
// TypeScript Types
// ============================================================================

interface Shift {
  id: string;
  name: string;
  subject?: string;
  location?: string;
  workgroup?: string;
  local_start_date: string;
  local_end_date: string;
  start_date?: string;
  end_date?: string;
  members?: unknown[];
  assigned_functions?: unknown[];
  color?: string;
  description?: string;
  status?: string;
  // Backend-added fields
  assignedPeople?: unknown[];
  clockStatuses?: unknown[];
}

interface Account {
  id: string;
  external_id?: string;
  first_name: string;
  last_name: string;
  screen_name?: string;
  email?: string;
  mobile_phone?: string;
  seniority_order?: string;
  clocked_in?: boolean;
  workgroups?: string[];
}

interface Workgroup {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  members?: string[];
}

interface Metadata {
  key: string;
  timestamp: number;
}

// ============================================================================
// Database Schema
// ============================================================================

interface ShiftsDatabaseSchema extends DBSchema {
  shifts: {
    key: string;
    value: Shift;
    indexes: { workgroup: string };
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
    value: Metadata;
  };
}

// ============================================================================
// Database Connection
// ============================================================================

const DB_NAME = 'hlsr-shifts-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ShiftsDatabaseSchema> | null = null;

/**
 * Initialize and open database connection
 * Creates object stores and indexes if they don't exist
 */
async function getDatabase(): Promise<IDBPDatabase<ShiftsDatabaseSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ShiftsDatabaseSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Shifts store with workgroup index
      if (!db.objectStoreNames.contains('shifts')) {
        const shiftsStore = db.createObjectStore('shifts', {
          keyPath: 'id',
        });
        shiftsStore.createIndex('workgroup', 'workgroup', { unique: false });
      }

      // Accounts store
      if (!db.objectStoreNames.contains('accounts')) {
        db.createObjectStore('accounts', { keyPath: 'id' });
      }

      // Workgroups store
      if (!db.objectStoreNames.contains('workgroups')) {
        db.createObjectStore('workgroups', { keyPath: 'id' });
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ============================================================================
// Shift Operations
// ============================================================================

/**
 * Store shifts in IndexedDB (upsert operation)
 *
 * @param shifts - Array of shifts to store
 * @returns Promise resolving when complete
 */
export async function storeShifts(shifts: Shift[]): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('shifts', 'readwrite');

  await Promise.all([...shifts.map((shift) => tx.store.put(shift)), tx.done]);
}

/**
 * Get shifts filtered by workgroup
 *
 * @param workgroupId - Workgroup ID to filter by (null for all shifts)
 * @returns Promise resolving to array of shifts
 */
export async function getShiftsByWorkgroup(workgroupId: string | null): Promise<Shift[]> {
  const db = await getDatabase();

  if (workgroupId === null) {
    // Get all shifts
    return await db.getAll('shifts');
  }

  // Get shifts for specific workgroup using index
  return await db.getAllFromIndex('shifts', 'workgroup', workgroupId);
}

/**
 * Clear all shifts from cache
 */
export async function clearShifts(): Promise<void> {
  const db = await getDatabase();
  await db.clear('shifts');
}

// ============================================================================
// Account Operations
// ============================================================================

/**
 * Store accounts in IndexedDB (upsert operation)
 *
 * @param accounts - Array of accounts to store
 * @returns Promise resolving when complete
 */
export async function storeAccounts(accounts: Account[]): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('accounts', 'readwrite');

  await Promise.all([...accounts.map((account) => tx.store.put(account)), tx.done]);
}

/**
 * Get all accounts from cache
 *
 * @returns Promise resolving to array of accounts
 */
export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDatabase();
  return await db.getAll('accounts');
}

/**
 * Get account by ID
 *
 * @param accountId - Account ID
 * @returns Promise resolving to account or undefined
 */
export async function getAccountById(accountId: string): Promise<Account | undefined> {
  const db = await getDatabase();
  return await db.get('accounts', accountId);
}

/**
 * Clear all accounts from cache
 */
export async function clearAccounts(): Promise<void> {
  const db = await getDatabase();
  await db.clear('accounts');
}

// ============================================================================
// Workgroup Operations
// ============================================================================

/**
 * Store workgroups in IndexedDB (upsert operation)
 *
 * @param workgroups - Array of workgroups to store
 * @returns Promise resolving when complete
 */
export async function storeWorkgroups(workgroups: Workgroup[]): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('workgroups', 'readwrite');

  await Promise.all([...workgroups.map((workgroup) => tx.store.put(workgroup)), tx.done]);
}

/**
 * Get all workgroups from cache
 *
 * @returns Promise resolving to array of workgroups
 */
export async function getAllWorkgroups(): Promise<Workgroup[]> {
  const db = await getDatabase();
  return await db.getAll('workgroups');
}

/**
 * Get workgroup by ID
 *
 * @param workgroupId - Workgroup ID
 * @returns Promise resolving to workgroup or undefined
 */
export async function getWorkgroupById(workgroupId: string): Promise<Workgroup | undefined> {
  const db = await getDatabase();
  return await db.get('workgroups', workgroupId);
}

/**
 * Clear all workgroups from cache
 */
export async function clearWorkgroups(): Promise<void> {
  const db = await getDatabase();
  await db.clear('workgroups');
}

// ============================================================================
// Metadata Operations
// ============================================================================

/**
 * Update last sync timestamp to current time
 *
 * @returns Promise resolving when complete
 */
export async function updateLastSync(): Promise<void> {
  const db = await getDatabase();
  await db.put('metadata', {
    key: 'lastSync',
    timestamp: Date.now(),
  });
}

/**
 * Get last sync timestamp
 *
 * @returns Promise resolving to Date object or null if never synced
 */
export async function getLastSync(): Promise<Date | null> {
  const db = await getDatabase();
  const metadata = await db.get('metadata', 'lastSync');

  if (!metadata) {
    return null;
  }

  return new Date(metadata.timestamp);
}

/**
 * Get last sync timestamp as formatted string
 *
 * @returns Promise resolving to formatted string or 'Never'
 */
export async function getLastSyncFormatted(): Promise<string> {
  const lastSync = await getLastSync();

  if (!lastSync) {
    return 'Never';
  }

  // Format as relative time
  const now = Date.now();
  const diff = now - lastSync.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (seconds > 10) {
    return `${seconds} seconds ago`;
  }
  return 'Just now';
}

// ============================================================================
// Database Management
// ============================================================================

/**
 * Clear all data from database (useful for logout or reset)
 */
export async function clearAllData(): Promise<void> {
  await clearShifts();
  await clearAccounts();
  await clearWorkgroups();

  const db = await getDatabase();
  await db.clear('metadata');
}

/**
 * Close database connection
 * Note: Database will automatically reopen on next operation
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Get database statistics
 *
 * @returns Promise resolving to stats object
 */
export async function getDatabaseStats(): Promise<{
  shifts: number;
  accounts: number;
  workgroups: number;
  lastSync: Date | null;
}> {
  const db = await getDatabase();

  const [shiftsCount, accountsCount, workgroupsCount, lastSync] = await Promise.all([
    db.count('shifts'),
    db.count('accounts'),
    db.count('workgroups'),
    getLastSync(),
  ]);

  return {
    shifts: shiftsCount,
    accounts: accountsCount,
    workgroups: workgroupsCount,
    lastSync,
  };
}

// ============================================================================
// Export Types for Consumer Code
// ============================================================================

export type { Shift, Account, Workgroup, Metadata };
