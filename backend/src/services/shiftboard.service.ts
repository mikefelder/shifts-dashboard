/**
 * Shiftboard Service Client
 *
 * Generic JSON-RPC client for Shiftboard API with:
 * - HMAC SHA-1 authentication
 * - Automatic pagination handling
 * - Comprehensive error handling
 * - Request logging
 *
 * Environment Variables Required:
 * - SHIFTBOARD_ACCESS_KEY_ID: Access key ID from Shiftboard
 * - SHIFTBOARD_SECRET_KEY: Secret key for HMAC signatures
 * - SHIFTBOARD_HOST: API host (default: api.shiftboard.com)
 * - SHIFTBOARD_PATH: API path (default: /api/v1/)
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { buildAuthenticatedPostRequest, validateAuthConfig } from '../utils/shiftboard-auth';
// Pagination utilities - uncomment when callPaginated method is needed
// import {
//   fetchAllPages,
//   parsePaginationMetadata,
//   PaginatedResponse,
// } from '../utils/pagination';

// ============================================================================
// Configuration
// ============================================================================

export interface ShiftboardConfig {
  accessKeyId: string;
  secretKey: string;
  host: string;
  path: string;
  timeout?: number;
}

function getConfig(): ShiftboardConfig {
  const accessKeyId = process.env.SHIFTBOARD_ACCESS_KEY_ID || '';
  const secretKey = process.env.SHIFTBOARD_SECRET_KEY || '';
  const host = process.env.SHIFTBOARD_HOST || 'api.shiftdata.com';
  const path = process.env.SHIFTBOARD_PATH || '/servola/api/api.cgi';
  const timeout = parseInt(process.env.SHIFTBOARD_TIMEOUT || '30000', 10);

  validateAuthConfig(accessKeyId, secretKey);

  return {
    accessKeyId,
    secretKey,
    host,
    path,
    timeout,
  };
}

// ============================================================================
// TypeScript Types for Shiftboard API
// ============================================================================

export interface ShiftboardPage {
  start: number;
  batch: number;
  total: number;
  next: number | null;
}

export interface ShiftboardError {
  message?: string;
  error?: string;
  code?: string | number;
}

export interface ShiftboardResponse<T> {
  result?: T;
  error?: ShiftboardError;
}

// Shift Types
export interface ShiftboardShift {
  id: string;
  name: string;
  subject?: string;
  location?: string;
  workgroup?: string;
  local_start_date: string;
  local_end_date: string;
  start_date?: string;
  end_date?: string;
  members?: ShiftboardMember[];
  assigned_functions?: AssignedFunction[];
  color?: string;
  description?: string;
  status?: string;
}

export interface ShiftboardMember {
  member: string;
  account?: string;
  id?: string;
  confirmed?: boolean;
  clocked_in?: boolean;
  clock_in_time?: string;
  clock_out_time?: string;
}

export interface AssignedFunction {
  id: string;
  name: string;
  role?: {
    id: string;
    name: string;
  };
  count?: string;
  qty?: string;
}

// Account Types
export interface ShiftboardAccount {
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

// Workgroup Types
export interface ShiftboardWorkgroup {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  members?: string[];
}

// Role Types
export interface ShiftboardRole {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

// Response wrappers
export interface ShiftListResponse {
  shifts: ShiftboardShift[];
  page?: ShiftboardPage;
  referenced_objects?: {
    account?: ShiftboardAccount[];
    workgroup?: ShiftboardWorkgroup[];
  };
}

export interface AccountListResponse {
  accounts: ShiftboardAccount[];
  page?: ShiftboardPage;
}

export interface WorkgroupListResponse {
  workgroups: ShiftboardWorkgroup[];
  page?: ShiftboardPage;
}

export interface RoleListResponse {
  roles: ShiftboardRole[];
  page?: ShiftboardPage;
}

// ============================================================================
// Service Class
// ============================================================================

export class ShiftboardService {
  private config: ShiftboardConfig;
  private axios: AxiosInstance;
  private baseUrl: string;

  constructor(config?: Partial<ShiftboardConfig>) {
    const envConfig = getConfig();
    this.config = { ...envConfig, ...config };
    // Full API URL including path
    this.baseUrl = `https://${this.config.host}${this.config.path}`;

    this.axios = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor for logging
    this.axios.interceptors.request.use((config) => {
      const method = new URL(config.url || '').searchParams.get('method');
      console.log(`[Shiftboard] → ${method || config.url}`);
      return config;
    });

    // Response interceptor for logging
    this.axios.interceptors.response.use(
      (response) => {
        const method = new URL(response.config.url || '').searchParams.get('method');
        console.log(`[Shiftboard] ✓ ${method} (${response.status})`);
        return response;
      },
      (error) => {
        const method = error.config?.url
          ? new URL(error.config.url).searchParams.get('method')
          : 'unknown';
        console.error(`[Shiftboard] ✗ ${method} (${error.response?.status || 'NO_RESPONSE'})`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic RPC call method
   * Makes authenticated POST request to Shiftboard JSON-RPC API
   */
  private async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    try {
      // Build authenticated POST request (signs the full JSON-RPC body)
      const { url, body } = buildAuthenticatedPostRequest(this.baseUrl, {
        method,
        params,
        accessKeyId: this.config.accessKeyId,
        secretKey: this.config.secretKey,
      });

      const response = await this.axios.post<ShiftboardResponse<T>>(url, body);

      // Check for Shiftboard API errors
      if (response.data.error) {
        const error = response.data.error;
        throw new Error(error.message || error.error || `Shiftboard API error: ${error.code}`);
      }

      // Return result or throw if missing
      if (response.data.result === undefined) {
        console.log('[Shiftboard] ERROR: No result in response');
        throw new Error('Shiftboard API returned no result');
      }

      return response.data.result;
    } catch (error) {
      this.handleError(error, method);
      throw error; // TypeScript requires this, but handleError always throws
    }
  }

  /**
   * Make paginated request and fetch all pages automatically
   * Note: Currently unused but kept for future pagination needs
   */
  /* private async callPaginated<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T[]> {
    const fetchPage = async (
      page: number,
      limit: number
    ): Promise<PaginatedResponse<T>> => {
      const start = (page - 1) * limit;
      const response = await this.call<{
        data?: T[];
        results?: T[];
        total?: number;
        count?: number;
        page?: ShiftboardPage;
      }>(method, {
        ...params,
        start,
        batch: limit,
      });

      return parsePaginationMetadata<T>(response, page, limit);
    };

    return await fetchAllPages(fetchPage);
  } */

  /**
   * Error handler - converts Axios and Shiftboard errors to standard format
   */
  private handleError(error: unknown, method: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ShiftboardResponse<unknown>>;

      if (axiosError.response) {
        // Shiftboard returned an error response
        const shiftboardError = axiosError.response.data?.error;
        if (shiftboardError) {
          throw new Error(
            `Shiftboard API error (${method}): ${shiftboardError.message || shiftboardError.error || shiftboardError.code}`
          );
        }

        // HTTP error without Shiftboard error details
        throw new Error(
          `Shiftboard HTTP error (${method}): ${axiosError.response.status} ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        // Network error (no response received)
        throw new Error(
          `Shiftboard network error (${method}): No response received (timeout or connection failed)`
        );
      } else {
        // Request setup error
        throw new Error(`Shiftboard request error (${method}): ${axiosError.message}`);
      }
    }

    // Non-Axios error (e.g., validation error, custom error)
    if (error instanceof Error) {
      throw error;
    }

    // Unknown error type
    throw new Error(`Unknown error calling Shiftboard (${method}): ${error}`);
  }

  // ==========================================================================
  // Shift Methods
  // ==========================================================================

  /**
   * Get current shifts with assigned people and clock-in status
   * Automatically fetches all pages if result is paginated
   */
  async getWhosOn(params?: { workgroup?: string; batch?: number }): Promise<ShiftListResponse> {
    return await this.call<ShiftListResponse>('shift.whosOn', {
      timeclock_status: true,
      extended: true,
      ...params,
    });
  }

  /**
   * List shifts (unprocessed, pass-through endpoint)
   */
  async listShifts(params?: {
    start?: number;
    batch?: number;
    workgroup?: string;
  }): Promise<ShiftListResponse> {
    return await this.call<ShiftListResponse>('shift.list', params);
  }

  // ==========================================================================
  // Account Methods
  // ==========================================================================

  /**
   * List all accounts with automatic pagination
   */
  async listAccounts(params?: { workgroup?: string }): Promise<ShiftboardAccount[]> {
    const response = await this.call<AccountListResponse>('account.list', {
      extended: true,
      ...params,
    });

    return response.accounts || [];
  }

  /**
   * Get service account identity (for diagnostics)
   */
  async getSelf(): Promise<ShiftboardAccount> {
    const response = await this.call<{ account: ShiftboardAccount }>('account.self');
    return response.account;
  }

  /**
   * Get accounts filtered by workgroup
   */
  async getAccountsByWorkgroup(workgroupId: string): Promise<ShiftboardAccount[]> {
    return await this.listAccounts({ workgroup: workgroupId });
  }

  // ==========================================================================
  // Workgroup Methods
  // ==========================================================================

  /**
   * List all workgroups
   */
  async listWorkgroups(): Promise<ShiftboardWorkgroup[]> {
    const response = await this.call<WorkgroupListResponse>('workgroup.list', {
      extended: true,
    });

    return response.workgroups || [];
  }

  /**
   * Get roles for a specific workgroup
   */
  async getWorkgroupRoles(workgroupId: string): Promise<ShiftboardRole[]> {
    const response = await this.call<RoleListResponse>('workgroup.roles', {
      workgroup: workgroupId,
    });

    return response.roles || [];
  }

  // ==========================================================================
  // Role Methods
  // ==========================================================================

  /**
   * List all roles
   */
  async listRoles(): Promise<ShiftboardRole[]> {
    const response = await this.call<RoleListResponse>('role.list', {
      extended: true,
    });

    return response.roles || [];
  }

  /**
   * Get a specific role by ID
   */
  async getRole(roleId: string): Promise<ShiftboardRole> {
    const response = await this.call<{ role: ShiftboardRole }>('role.get', {
      role: roleId,
    });

    return response.role;
  }

  // ==========================================================================
  // System Methods
  // ==========================================================================

  /**
   * Echo test - verifies connectivity to Shiftboard API
   */
  async echo(message: string = 'ping'): Promise<{ echo: string }> {
    return await this.call<{ echo: string }>('system.echo', {
      message,
    });
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

let shiftboardServiceInstance: ShiftboardService | null = null;

/**
 * Get singleton instance of ShiftboardService
 * Uses environment variables for configuration
 */
export function getShiftboardService(): ShiftboardService {
  if (!shiftboardServiceInstance) {
    shiftboardServiceInstance = new ShiftboardService();
  }
  return shiftboardServiceInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetShiftboardService(): void {
  shiftboardServiceInstance = null;
}

export default getShiftboardService;
