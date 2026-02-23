/**
 * Timing Utility
 *
 * Provides utilities for tracking request timing metadata
 */

/**
 * Timing metadata structure returned in API responses
 */
export interface TimingMetadata {
  start: string;
  end: string;
  duration_ms: number;
}

/**
 * Alternative timing metadata structure with requestDuration
 * Used in some endpoints for consistency
 */
export interface RequestDurationMetadata {
  requestDuration: number;
}

/**
 * Calculate timing metadata from start timestamp
 *
 * @param startTime - Request start timestamp in milliseconds (from Date.now())
 * @returns Timing metadata object with ISO timestamps and duration
 *
 * @example
 * const requestStart = Date.now();
 * // ... do work ...
 * const timing = getTimingMetadata(requestStart);
 * res.json({ result: data, timing });
 */
export function getTimingMetadata(startTime: number): TimingMetadata {
  const endTime = Date.now();
  return {
    start: new Date(startTime).toISOString(),
    end: new Date(endTime).toISOString(),
    duration_ms: endTime - startTime,
  };
}

/**
 * Calculate request duration metadata from start timestamp
 * Simplified version that only returns duration
 *
 * @param startTime - Request start timestamp in milliseconds (from Date.now())
 * @returns Object with requestDuration field
 *
 * @example
 * const requestStart = Date.now();
 * // ... do work ...
 * const meta = getRequestDuration(startTime);
 * res.json({ result: data, meta });
 */
export function getRequestDuration(startTime: number): RequestDurationMetadata {
  return {
    requestDuration: Date.now() - startTime,
  };
}
