/**
 * Client Logger Utility
 *
 * Lightweight console wrapper that gates logs behind development mode.
 * In production, only errors and warnings are logged to reduce noise.
 */

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Client logger with conditional logging based on environment.
 */
const logger = {
  /**
   * Debug log - only in development
   */
  debug(...args: unknown[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info log - only in development
   */
  info(...args: unknown[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Warning log - always shown
   */
  warn(...args: unknown[]): void {
    console.warn(...args);
  },

  /**
   * Error log - always shown
   */
  error(...args: unknown[]): void {
    console.error(...args);
  },
};

export default logger;
