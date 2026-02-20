/**
 * Pagination Utility for Shiftboard API
 *
 * Handles multi-page fetching from Shiftboard API with safety limits.
 * Shiftboard returns paginated results that must be fetched sequentially.
 *
 * Safety Features:
 * - Hard limit of 100 pages to prevent infinite loops
 * - Page count validation
 * - Error propagation
 */

export interface PaginationParams {
  start: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export interface FetchPageFunction<T> {
  (page: number, limit: number): Promise<PaginatedResponse<T>>;
}

/**
 * Maximum number of pages to fetch (safety limit)
 */
export const MAX_PAGES = 100;

/**
 * Default page size for fetching
 */
export const DEFAULT_PAGE_SIZE = 100;

/**
 * Fetch all pages from a paginated API endpoint
 *
 * @param fetchPage - Function that fetches a single page
 * @param pageSize - Number of items per page (default: 100)
 * @returns Promise resolving to all fetched items
 * @throws Error if page limit exceeded or fetch fails
 */
export async function fetchAllPages<T>(
  fetchPage: FetchPageFunction<T>,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  const allItems: T[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= MAX_PAGES) {
    const response = await fetchPage(currentPage, pageSize);

    // Add items from current page
    allItems.push(...response.data);

    // Check if more pages exist
    hasMore = response.hasMore && currentPage < response.totalPages;

    // Validate page count doesn't exceed safety limit
    if (response.totalPages > MAX_PAGES) {
      throw new Error(
        `Total pages (${response.totalPages}) exceeds maximum allowed (${MAX_PAGES})`
      );
    }

    currentPage++;
  }

  // Warn if we hit the page limit
  if (currentPage > MAX_PAGES && hasMore) {
    console.warn(`Pagination stopped at ${MAX_PAGES} pages. Some data may not be fetched.`);
  }

  return allItems;
}

/**
 * Calculate pagination parameters for a given page
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Pagination parameters (start, limit)
 */
export function calculatePaginationParams(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): PaginationParams {
  if (page < 1) {
    throw new Error('Page number must be >= 1');
  }

  if (pageSize < 1) {
    throw new Error('Page size must be >= 1');
  }

  return {
    start: (page - 1) * pageSize,
    limit: pageSize,
  };
}

/**
 * Parse pagination metadata from Shiftboard response
 *
 * @param response - Raw Shiftboard API response
 * @param currentPage - Current page number
 * @param pageSize - Items per page
 * @returns Paginated response metadata
 */
export function parsePaginationMetadata<T>(
  response: {
    data?: T[];
    results?: T[];
    total?: number;
    count?: number;
  },
  currentPage: number,
  pageSize: number
): PaginatedResponse<T> {
  // Extract data array (support both 'data' and 'results' fields)
  const data = response.data || response.results || [];

  // Extract total count (support both 'total' and 'count' fields)
  const totalCount = response.total ?? response.count ?? data.length;

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Determine if more pages exist
  const hasMore = currentPage < totalPages;

  return {
    data,
    page: currentPage,
    totalPages,
    totalCount,
    hasMore,
  };
}

/**
 * Fetch multiple pages in parallel (use with caution - may hit rate limits)
 *
 * @param fetchPage - Function that fetches a single page
 * @param startPage - Starting page number
 * @param endPage - Ending page number (inclusive)
 * @param pageSize - Items per page
 * @returns Promise resolving to all fetched items
 */
export async function fetchPagesInParallel<T>(
  fetchPage: FetchPageFunction<T>,
  startPage: number,
  endPage: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  if (endPage - startPage + 1 > MAX_PAGES) {
    throw new Error(`Cannot fetch more than ${MAX_PAGES} pages`);
  }

  // Create array of page numbers to fetch
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  // Fetch all pages in parallel
  const responses = await Promise.all(pageNumbers.map((page) => fetchPage(page, pageSize)));

  // Flatten results
  return responses.flatMap((response) => response.data);
}

/**
 * Estimate total fetch time for paginated data
 *
 * @param totalPages - Number of pages to fetch
 * @param avgResponseTimeMs - Average response time per page in milliseconds
 * @returns Estimated total time in seconds
 */
export function estimateFetchTime(totalPages: number, avgResponseTimeMs: number = 500): number {
  return (totalPages * avgResponseTimeMs) / 1000;
}
