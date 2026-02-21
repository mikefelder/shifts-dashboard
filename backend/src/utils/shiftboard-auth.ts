import * as crypto from 'crypto';

/**
 * Shiftboard HMAC SHA-1 Authentication Utility
 *
 * Implements Shiftboard's authentication protocol using HMAC SHA-1 signatures.
 * Uses POST-based JSON-RPC 2.0 with the full request body as the HMAC message.
 *
 * @see https://www.shiftdata.com/tryit.html
 */

export interface ShiftboardAuthParams {
  accessKeyId: string;
  secretKey: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface AuthenticatedPostRequest {
  url: string;
  body: string;
  signature: string;
}

/**
 * Build an authenticated POST request for the Shiftboard JSON-RPC API.
 *
 * Authentication algorithm (from working implementation):
 * 1. Build the full JSON-RPC 2.0 request body as a JSON string
 * 2. HMAC SHA-1 sign the entire body string using the secret key
 * 3. Base64-encode the signature
 * 4. Append access_key_id and signature as query parameters
 *
 * @param baseUrl - Full API URL (e.g., 'https://api.shiftdata.com/servola/api/api.cgi')
 * @param authParams - Authentication parameters including method and params
 * @returns Object with url, body, and signature for the POST request
 */
export function buildAuthenticatedPostRequest(
  baseUrl: string,
  authParams: ShiftboardAuthParams
): AuthenticatedPostRequest {
  const { accessKeyId, secretKey, method, params = {} } = authParams;

  // 1. Build JSON-RPC 2.0 request body
  const body = JSON.stringify({
    id: 1,
    jsonrpc: '2.0',
    method,
    params,
  });

  // 2. Sign the full body with HMAC SHA-1, output as base64
  const signature = crypto.createHmac('sha1', secretKey).update(body).digest('base64');

  // 3. Build URL with auth query parameters only
  const url =
    baseUrl +
    '?access_key_id=' +
    encodeURIComponent(accessKeyId) +
    '&signature=' +
    encodeURIComponent(signature);

  return { url, body, signature };
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
