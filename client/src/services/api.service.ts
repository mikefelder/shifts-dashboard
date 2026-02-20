/**
 * API Service
 *
 * Handles communication with backend API with cache fallback.
 * Implements resilient data access per Constitution Principle II.
 *
 * Features:
 * - Automatic cache fallback on API failure
 * - isFreshData flag distinguishes live vs cached responses
 * - Last sync timestamp tracking
 * - 60-second timeout for API requests
 *
 * Cache Strategy:
 * - Always attempt live API fetch first
 * - Store successful responses in IndexedDB
 * - Fall back to cache only on API failure
 * - Return isFreshData flag with all responses
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import {
  storeShifts,
  getShiftsByWorkgroup,
  storeAccounts,
  getAllAccounts,
  storeWorkgroups,
  getAllWorkgroups,
  updateLastSync,
  getLastSync,
} from './db.service';
import type { Account, Workgroup } from './db.service';
import type { GroupedShift } from '../types/shift.types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = 60000; // 60 seconds

// ============================================================================
// Axios Instance
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] → ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ✓ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] ✗ ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error('[API] ✗ No response received:', error.message);
    } else {
      console.error('[API] ✗ Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// TypeScript Types
// ============================================================================

export interface ApiResponse<T> {
  result: T;
  timing?: {
    start: string;
    end: string;
    duration_ms: number;
  };
  metrics?: Record<string, unknown>;
}

export interface ShiftsResponse {
  shifts: GroupedShift[];
  referenced_objects?: {
    account?: Account[];
    workgroup?: Workgroup[];
  };
  metrics?: {
    original_shift_count?: number;
    grouped_shift_count?: number;
    clocked_in_count?: number;
    fetch_duration_ms?: number;
    grouping_duration_ms?: number;
  };
  page?: {
    start: number;
    batch: number;
    total: number;
    next: number | null;
  };
}

export interface DataWithFreshness<T> {
  data: T;
  isFreshData: boolean;
  lastSync: Date | null;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Check if error is a network/timeout error
 */
function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const axiosError = error as AxiosError;

  // No response (network error, timeout, CORS)
  if (!axiosError.response) {
    return true;
  }

  // 5xx errors (server error)
  if (axiosError.response.status >= 500) {
    return true;
  }

  return false;
}

/**
 * Extract error message from API error
 */
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string }>;

    // API returned error in standard format
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    // HTTP status error
    if (axiosError.response) {
      return `API error: ${axiosError.response.status} ${axiosError.response.statusText}`;
    }

    // Network error
    if (axiosError.request) {
      return 'Network error: Unable to reach API';
    }

    // Request setup error
    return `Request error: ${axiosError.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error occurred';
}

// ============================================================================
// Shift Operations
// ============================================================================

/**
 * Get shifts with optional workgroup filter
 *
 * @param options - Fetch options
 * @param options.forceSync - Force fresh API fetch (default: true)
 * @param options.workgroupId - Filter by workgroup ID (null for all)
 * @returns Promise resolving to shifts with freshness metadata
 */
export async function getShifts(options?: {
  forceSync?: boolean;
  workgroupId?: string | null;
}): Promise<DataWithFreshness<GroupedShift[]>> {
  const { forceSync = true, workgroupId = null } = options || {};

  // Always attempt API fetch first
  if (forceSync) {
    try {
      const params: Record<string, string> = {};
      if (workgroupId) {
        params.workgroup = workgroupId;
      }

      const response = await apiClient.get<ApiResponse<ShiftsResponse>>('/api/shifts/whos-on', {
        params,
      });

      const shifts = response.data.result.shifts || [];
      const accounts = response.data.result.referenced_objects?.account || [];
      const workgroups = response.data.result.referenced_objects?.workgroup || [];

      // Store in cache
      await Promise.all([
        storeShifts(shifts),
        accounts.length > 0 ? storeAccounts(accounts) : Promise.resolve(),
        workgroups.length > 0 ? storeWorkgroups(workgroups) : Promise.resolve(),
        updateLastSync(),
      ]);

      const lastSync = await getLastSync();

      console.log(`[API] Fetched ${shifts.length} shifts from API (fresh data)`);

      return {
        data: shifts,
        isFreshData: true,
        lastSync,
      };
    } catch (error) {
      console.warn('[API] Fetch failed, falling back to cache:', getErrorMessage(error));

      // Only fall back to cache on network errors
      if (isNetworkError(error)) {
        return await getShiftsFromCache(workgroupId);
      }

      // Re-throw non-network errors (e.g., 4xx errors)
      throw error;
    }
  }

  // Use cache if !forceSync
  return await getShiftsFromCache(workgroupId);
}

/**
 * Get shifts from cache
 */
async function getShiftsFromCache(
  workgroupId: string | null
): Promise<DataWithFreshness<GroupedShift[]>> {
  const shifts = await getShiftsByWorkgroup(workgroupId);
  const lastSync = await getLastSync();

  console.log(`[API] Loaded ${shifts.length} shifts from cache (stale data)`);

  return {
    data: shifts as GroupedShift[],
    isFreshData: false,
    lastSync,
  };
}

// ============================================================================
// Account Operations
// ============================================================================

/**
 * Get all accounts
 *
 * @param forceSync - Force fresh API fetch (default: true)
 * @returns Promise resolving to accounts with freshness metadata
 */
export async function getAccounts(
  forceSync: boolean = true
): Promise<DataWithFreshness<Account[]>> {
  if (forceSync) {
    try {
      const response =
        await apiClient.get<ApiResponse<{ accounts: Account[] }>>('/api/accounts/list');

      const accounts = response.data.result.accounts || [];

      // Store in cache
      await Promise.all([storeAccounts(accounts), updateLastSync()]);

      const lastSync = await getLastSync();

      console.log(`[API] Fetched ${accounts.length} accounts from API`);

      return {
        data: accounts,
        isFreshData: true,
        lastSync,
      };
    } catch (error) {
      console.warn('[API] Accounts fetch failed, falling back to cache:', getErrorMessage(error));

      if (isNetworkError(error)) {
        return await getAccountsFromCache();
      }

      throw error;
    }
  }

  return await getAccountsFromCache();
}

/**
 * Get accounts from cache
 */
async function getAccountsFromCache(): Promise<DataWithFreshness<Account[]>> {
  const accounts = await getAllAccounts();
  const lastSync = await getLastSync();

  console.log(`[API] Loaded ${accounts.length} accounts from cache`);

  return {
    data: accounts,
    isFreshData: false,
    lastSync,
  };
}

// ============================================================================
// Workgroup Operations
// ============================================================================

/**
 * Get all workgroups
 *
 * @param forceSync - Force fresh API fetch (default: true)
 * @returns Promise resolving to workgroups with freshness metadata
 */
export async function getWorkgroups(
  forceSync: boolean = true
): Promise<DataWithFreshness<Workgroup[]>> {
  if (forceSync) {
    try {
      const response =
        await apiClient.get<ApiResponse<{ workgroups: Workgroup[] }>>('/api/workgroups/list');

      const workgroups = response.data.result.workgroups || [];

      // Store in cache
      await Promise.all([storeWorkgroups(workgroups), updateLastSync()]);

      const lastSync = await getLastSync();

      console.log(`[API] Fetched ${workgroups.length} workgroups from API`);

      return {
        data: workgroups,
        isFreshData: true,
        lastSync,
      };
    } catch (error) {
      console.warn('[API] Workgroups fetch failed, falling back to cache:', getErrorMessage(error));

      if (isNetworkError(error)) {
        return await getWorkgroupsFromCache();
      }

      throw error;
    }
  }

  return await getWorkgroupsFromCache();
}

/**
 * Get workgroups from cache
 */
async function getWorkgroupsFromCache(): Promise<DataWithFreshness<Workgroup[]>> {
  const workgroups = await getAllWorkgroups();
  const lastSync = await getLastSync();

  console.log(`[API] Loaded ${workgroups.length} workgroups from cache`);

  return {
    data: workgroups,
    isFreshData: false,
    lastSync,
  };
}

// ============================================================================
// System Operations
// ============================================================================

/**
 * Check API health
 *
 * @returns Promise resolving to health status
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
  environment?: string;
}> {
  const response = await apiClient.get<{
    status: string;
    timestamp: string;
    uptime: number;
    environment?: string;
  }>('/health');

  return response.data;
}

/**
 * Echo test - verify connectivity
 *
 * @param message - Message to echo
 * @returns Promise resolving to echo response
 */
export async function echo(message: string = 'ping'): Promise<{ echo: string }> {
  const response = await apiClient.post<ApiResponse<{ echo: string }>>('/api/system/echo', {
    message,
  });

  return response.data.result;
}

// ============================================================================
// Export Axios Instance (for custom requests)
// ============================================================================

export { apiClient };

// ============================================================================
// Export Types
// ============================================================================

export type { Shift, Account, Workgroup };
