/**
 * Runtime configuration utilities
 * Provides access to configuration injected at container startup
 */

// Extend Window interface for runtime config
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

/**
 * Get runtime configuration value with fallback
 */
export function getRuntimeConfig() {
  // Check for runtime config (production)
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    return window.__RUNTIME_CONFIG__;
  }

  // Fallback to empty config (will use defaults)
  return {};
}

/**
 * Get API base URL from runtime config or environment
 */
export function getApiBaseUrl(): string {
  const runtimeConfig = getRuntimeConfig();

  // Priority: runtime config > Vite env var > localhost default
  return runtimeConfig.apiUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
}

export default {
  getRuntimeConfig,
  getApiBaseUrl,
};
