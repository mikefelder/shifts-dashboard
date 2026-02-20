import * as crypto from 'crypto';

/**
 * Shiftboard HMAC SHA-1 Authentication Utility
 *
 * Implements Shiftboard's authentication protocol using HMAC SHA-1 signatures.
 * Required for all API calls to Shiftboard.
 *
 * @see https://www.shiftboard.com/api-docs
 */

export interface ShiftboardAuthParams {
  accessKeyId: string;
  secretKey: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface AuthenticatedRequest {
  method: string;
  url: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate HMAC SHA-1 signature for Shiftboard API request
 *
 * @param method - RPC method name (e.g., 'shift.whosOn')
 * @param params - Method parameters as object
 * @param timestamp - Unix timestamp in seconds
 * @param secretKey - Shiftboard secret key
 * @returns Hex-encoded HMAC SHA-1 signature
 */
export function generateSignature(
  method: string,
  params: Record<string, unknown>,
  timestamp: number,
  secretKey: string
): string {
  // Serialize parameters as JSON (empty object if no params)
  const paramsJson = JSON.stringify(params || {});

  // Construct message: method + params + timestamp + secret
  const message = `${method}${paramsJson}${timestamp}${secretKey}`;

  // Compute HMAC SHA-1
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(message);

  return hmac.digest('hex');
}

/**
 * Build authenticated URL for Shiftboard API request
 *
 * @param baseUrl - Shiftboard API base URL (e.g., 'https://api.shiftboard.com')
 * @param path - API path (e.g., '/api/v1/')
 * @param authParams - Authentication parameters
 * @returns Complete URL with authentication parameters
 */
export function buildAuthenticatedUrl(
  baseUrl: string,
  path: string,
  authParams: ShiftboardAuthParams
): string {
  const { accessKeyId, secretKey, method, params = {} } = authParams;

  // Generate current timestamp (seconds since epoch)
  const timestamp = Math.floor(Date.now() / 1000);

  // Generate signature
  const signature = generateSignature(method, params, timestamp, secretKey);

  // Serialize params for URL
  const paramsJson = JSON.stringify(params);

  // Build URL with query parameters
  const url = new URL(path, baseUrl);
  url.searchParams.set('method', method);
  url.searchParams.set('params', paramsJson);
  url.searchParams.set('access_key_id', accessKeyId);
  url.searchParams.set('timestamp', timestamp.toString());
  url.searchParams.set('signature', signature);

  return url.toString();
}

/**
 * Create authenticated request object for Shiftboard API
 *
 * @param baseUrl - Shiftboard API base URL
 * @param path - API path
 * @param authParams - Authentication parameters
 * @returns Authenticated request object with URL and metadata
 */
export function createAuthenticatedRequest(
  baseUrl: string,
  path: string,
  authParams: ShiftboardAuthParams
): AuthenticatedRequest {
  const { method, params = {} } = authParams;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(method, params, timestamp, authParams.secretKey);
  const url = buildAuthenticatedUrl(baseUrl, path, authParams);

  return {
    method,
    url,
    timestamp,
    signature,
  };
}

/**
 * Validate authentication configuration
 *
 * @param accessKeyId - Shiftboard access key ID
 * @param secretKey - Shiftboard secret key
 * @throws Error if configuration is invalid
 */
export function validateAuthConfig(accessKeyId: string, secretKey: string): void {
  if (!accessKeyId || accessKeyId.trim() === '') {
    throw new Error('SHIFTBOARD_ACCESS_KEY_ID is required');
  }

  if (!secretKey || secretKey.trim() === '') {
    throw new Error('SHIFTBOARD_SECRET_KEY is required');
  }

  if (secretKey.length < 16) {
    throw new Error('SHIFTBOARD_SECRET_KEY appears to be invalid (too short)');
  }
}
