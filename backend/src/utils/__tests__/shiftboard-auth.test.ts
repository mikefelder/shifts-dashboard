/**
 * Shiftboard Auth Utility Tests
 *
 * Unit tests for HMAC SHA-1 authentication helpers.
 * Validates correct URL construction, signature generation, and config validation.
 */

import * as crypto from 'crypto';
import {
  buildAuthenticatedPostRequest,
  validateAuthConfig,
  type ShiftboardAuthParams,
} from '../shiftboard-auth';

// ============================================================================
// Fixtures
// ============================================================================

const BASE_URL = 'https://api.shiftdata.com/servola/api/api.cgi';

const AUTH_PARAMS: ShiftboardAuthParams = {
  accessKeyId: 'test-access-key-id-12345',
  secretKey: 'test-secret-key-abcdefghijklmnop',
  method: 'system.echo',
  params: { message: 'ping' },
};

// ============================================================================
// Tests: buildAuthenticatedPostRequest
// ============================================================================

describe('buildAuthenticatedPostRequest', () => {
  it('returns an object with url, body, and signature fields', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);

    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('body');
    expect(result).toHaveProperty('signature');
  });

  it('body is valid JSON-RPC 2.0 with correct method', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);
    const parsed = JSON.parse(result.body);

    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.id).toBe(1);
    expect(parsed.method).toBe('system.echo');
    expect(parsed.params).toEqual({ message: 'ping' });
  });

  it('body includes an empty params object when params not provided', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      params: undefined,
    });
    const parsed = JSON.parse(result.body);

    expect(parsed.params).toEqual({});
  });

  it('URL includes access_key_id query parameter', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);
    const url = new URL(result.url);

    expect(url.searchParams.get('access_key_id')).toBe(AUTH_PARAMS.accessKeyId);
  });

  it('URL includes signature query parameter', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);
    const url = new URL(result.url);

    expect(url.searchParams.get('signature')).toBeTruthy();
    expect(url.searchParams.get('signature')).toBe(result.signature);
  });

  it('URL base is preserved (no extra path changes)', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);
    const url = new URL(result.url);

    expect(url.hostname).toBe('api.shiftdata.com');
    expect(url.pathname).toBe('/servola/api/api.cgi');
  });

  it('signature is a valid base64-encoded HMAC SHA-1 of the body', () => {
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);

    const expected = crypto
      .createHmac('sha1', AUTH_PARAMS.secretKey)
      .update(result.body)
      .digest('base64');

    expect(result.signature).toBe(expected);
  });

  it('different methods produce different signatures', () => {
    const r1 = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      method: 'system.echo',
    });
    const r2 = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      method: 'shift.list',
    });

    expect(r1.signature).not.toBe(r2.signature);
  });

  it('different params produce different signatures', () => {
    const r1 = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      params: { key: 'value1' },
    });
    const r2 = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      params: { key: 'value2' },
    });

    expect(r1.signature).not.toBe(r2.signature);
  });

  it('different secret keys produce different signatures', () => {
    const r1 = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      secretKey: 'secret-key-aaaaaaaaaaaaaaaaaa',
    });
    const r2 = buildAuthenticatedPostRequest(BASE_URL, {
      ...AUTH_PARAMS,
      secretKey: 'secret-key-bbbbbbbbbbbbbbbbbb',
    });

    expect(r1.signature).not.toBe(r2.signature);
  });

  it('is deterministic: same inputs produce same signature', () => {
    const r1 = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);
    const r2 = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);

    expect(r1.signature).toBe(r2.signature);
    expect(r1.url).toBe(r2.url);
    expect(r1.body).toBe(r2.body);
  });

  it('URL-encodes special characters in the signature query param', () => {
    // Some base64 chars (+, /) need URL encoding in the query string
    const result = buildAuthenticatedPostRequest(BASE_URL, AUTH_PARAMS);
    const url = new URL(result.url);
    const encodedSig = url.searchParams.get('signature') || '';

    // The URL search params getter already decodes — so verify the raw search string is encoded
    const rawSearch = url.search;
    // If the signature contained + or /, they'd appear as %2B / %2F in the raw search
    // Verify the signature in result is correctly assigned to the query string
    expect(url.searchParams.get('signature')).toBe(result.signature);
    // Base64 can contain +, /, = — all must be percent-encoded in the query string
    if (result.signature.includes('+') || result.signature.includes('/')) {
      expect(rawSearch).not.toMatch(/[+/](?=[^&=]*signature)/); // no raw + or / in sig portion
    }
    expect(encodedSig).toBeTruthy();
  });
});

// ============================================================================
// Tests: validateAuthConfig
// ============================================================================

describe('validateAuthConfig', () => {
  const validKey = 'test-access-key-id';
  const validSecret = 'a-secret-that-is-long-enough';

  it('does not throw for valid config', () => {
    expect(() => validateAuthConfig(validKey, validSecret)).not.toThrow();
  });

  it('throws when accessKeyId is empty string', () => {
    expect(() => validateAuthConfig('', validSecret)).toThrow(
      'SHIFTBOARD_ACCESS_KEY_ID is required'
    );
  });

  it('throws when accessKeyId is only whitespace', () => {
    expect(() => validateAuthConfig('   ', validSecret)).toThrow(
      'SHIFTBOARD_ACCESS_KEY_ID is required'
    );
  });

  it('throws when secretKey is empty string', () => {
    expect(() => validateAuthConfig(validKey, '')).toThrow('SHIFTBOARD_SECRET_KEY is required');
  });

  it('throws when secretKey is only whitespace', () => {
    expect(() => validateAuthConfig(validKey, '   ')).toThrow('SHIFTBOARD_SECRET_KEY is required');
  });

  it('throws when secretKey is shorter than 16 characters', () => {
    expect(() => validateAuthConfig(validKey, 'short')).toThrow(
      'SHIFTBOARD_SECRET_KEY appears to be invalid (too short)'
    );
  });

  it('does not throw when secretKey is exactly 16 characters', () => {
    expect(() => validateAuthConfig(validKey, '1234567890abcdef')).not.toThrow();
  });
});
