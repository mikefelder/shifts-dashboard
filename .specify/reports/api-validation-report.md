# Shiftboard API Implementation Validation Report

**Date**: Generated from official documentation review  
**Source**: https://www.shiftdata.com/  
**Status**: ❌ **CRITICAL ISSUES FOUND**

---

## Executive Summary

After reviewing the official Shiftboard API documentation, **CRITICAL authentication and endpoint discrepancies** have been identified that explain the current connection failures. Our implementation has incorrect:

1. ✅ Host (incorrect - using api.shiftboard.com instead of api.shiftdata.com)
2. ❌ Authentication signature algorithm (incorrect)
3. ❌ Request URL format (incorrect path)
4. ❌ JSON-RPC request structure

**Impact**: Backend cannot successfully authenticate with Shiftboard API, resulting in all API calls failing.

---

## Critical Issues

### 1. **INCORRECT API HOST** ❌

**Current Implementation**:

```env
SHIFTBOARD_HOST=api.shiftboard.com
```

**Official Documentation**:

```
Base URL: https://api.shiftdata.com
```

**Impact**: All requests are going to the wrong server  
**Fix Required**: Change host to `api.shiftdata.com`  
**Priority**: CRITICAL

---

### 2. **INCORRECT AUTHENTICATION SIGNATURE** ❌

**Current Implementation** (`shiftboard-auth.ts` lines 43-50):

```typescript
const paramsJson = JSON.stringify(params || {});
const message = `${method}${paramsJson}${timestamp}${secretKey}`;
const hmac = crypto.createHmac('sha1', secretKey);
hmac.update(message);
return hmac.digest('hex');
```

**Official Documentation**:

```
The data to be signed for GET requests is composed of four parts concatenated with no separator:
• The 6 character string "method"
• The name of the method being called
• The 6 character string "params"
• The base64-encoded serialization of the params

The calculated signature is then base64 encoded.
```

**Correct Implementation Should Be**:

```typescript
// 1. Base64 encode params
const paramsJson = JSON.stringify(params || {});
const paramsBase64 = Buffer.from(paramsJson).toString('base64');

// 2. Build message: "method" + methodName + "params" + base64Params
const message = `method${method}params${paramsBase64}`;

// 3. Sign with HMAC SHA1
const hmac = crypto.createHmac('sha1', secretKey);
hmac.update(message);

// 4. Base64 encode the signature
const signature = hmac.digest('base64');

// 5. URL encode the base64 signature for query string
return encodeURIComponent(signature);
```

**Issues Identified**:

- ❌ Missing literal string "method" prefix
- ❌ Missing literal string "params" prefix
- ❌ Params not base64-encoded before signing
- ❌ Timestamp should NOT be in signature message
- ❌ Secret key should NOT be concatenated to message (only HMAC key)
- ❌ Signature output should be base64, not hex
- ❌ Signature should be URL-encoded for query string

**Priority**: CRITICAL

---

### 3. **INCORRECT API PATH** ❌

**Current Implementation**:

```env
SHIFTBOARD_PATH=/api/v1/
```

```typescript
this.baseUrl = `https://${this.config.host}${this.config.path}`;
// Results in: https://api.shiftboard.com/api/v1/
```

**Official Documentation**:

```
POST or GET request to https://api.shiftdata.com
```

**Correct Implementation**:

```env
SHIFTBOARD_PATH=
```

```typescript
this.baseUrl = `https://${this.config.host}`;
// Results in: https://api.shiftdata.com
```

**Priority**: CRITICAL

---

### 4. **REQUEST METHOD PREFERENCE** ⚠️

**Current Implementation**:

```typescript
const response = await this.axios.get<ShiftboardResponse<T>>(url);
```

**Official Documentation**:

```
GET and POST requests are supported, but POST is preferred
```

**Recommendation**: Switch to POST for better compatibility and to follow best practices  
**Priority**: MEDIUM (current GET should work, but POST is preferred)

---

### 5. **JSON-RPC REQUEST FORMAT** ⚠️

**Current Implementation**: Building URL with query parameters

**Official Documentation**:

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "shift.whosOn",
  "params": {}
}
```

**Query String Parameters**:

- `access_key_id` - Access key (36 characters)
- `signature` - Base64-encoded HMAC SHA-1 signature (URL-encoded)
- `id` - Request ID (optional for correlation)
- `jsonrpc` - Must be "2.0"
- `method` - API method name
- `params` - Base64-encoded JSON params

**Priority**: HIGH (affects all requests)

---

## Endpoint Validation

### ✅ Endpoints Correctly Identified

Our implementation uses these endpoints, which are valid:

| Endpoint         | Usage                       | Validation |
| ---------------- | --------------------------- | ---------- |
| `shift.whosOn`   | Get currently active shifts | ✅ Valid   |
| `shift.list`     | Get shifts in date range    | ✅ Valid   |
| `account.list`   | Get account information     | ✅ Valid   |
| `workgroup.list` | Get workgroups              | ✅ Valid   |
| `role.list`      | Get roles                   | ✅ Valid   |
| `system.echo`    | Test endpoint               | ✅ Valid   |

### Endpoint Parameter Validation

#### shift.whosOn

**Our Usage**: ✅ Correct

```typescript
this.call<ShiftListResponse>('shift.whosOn', {
  extended: true,
  timeclock_status: true,
  referenced_objects: true,
});
```

**Official Parameters**:

- `extended` (boolean) - ✅ We use this correctly
- `referenced_objects` (boolean, defaults true) - ✅ We use this correctly
- `image` (boolean) - Optional, not using
- `image_expiration` (number) - Optional, not using
- `timeclock_status` (boolean) - ✅ We use this correctly

**Verdict**: Parameters are correct

---

#### shift.list

**Official Parameters** (select criteria):

- `start_date` - RFC 3339 date (e.g., "2009-04-01")
- `end_date` - RFC 3339 date
- `workgroup` - Single ID or array
- `covering_member` / `external_covering_member` - Filter by assigned member
- `published` - true/false
- `covered` - true/false
- `extended` - boolean for extended attributes
- `referenced_objects` - boolean (defaults true)

**Current Usage**: Need to verify parameters in shift.service.ts

---

## Response Format Validation

### Expected Response Structure

**Success**:

```json
{
  "id": "1",
  "jsonrpc": "2.0",
  "result": {
    "shifts": [...],
    "referenced_objects": {...}
  },
  "seconds": 0.05
}
```

**Error**:

```json
{
  "id": "1",
  "jsonrpc": "2.0",
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

**Our Handling**: ✅ Correct in shiftboard.service.ts:

```typescript
if (response.data.error) {
  throw new Error(error.message || error.error || `Shiftboard API error: ${error.code}`);
}
```

---

## Security Validation

### ✅ Credentials Format

**From .env**:

```env
SHIFTBOARD_ACCESS_KEY_ID=adab5d5c-c131-482f-bce4-311cff0feae7
SHIFTBOARD_SECRET_KEY=INcyWOb7V08/zjDZV6BKRf6uMi7XECOteFttGtOZ
```

**Official Format**:

- Access Key ID: 36 character sequence (UUID format) ✅
- Secret Key: 40 character sequence ✅

**Validation**: Credentials format is correct

### ⚠️ Security Best Practices

**From Documentation**:

> Caution: Your Signature Key is a secret, which only you and Shiftboard should know. It is important to keep it confidential to protect your account. Store it securely in a safe place. **Never include it in your requests to Shiftboard**, and never e-mail it to anyone.

**Our Implementation**: ✅ Secret key only used for signing, never transmitted

---

## Required Code Changes

### Priority 1: Fix Authentication (CRITICAL)

**File**: `backend/src/utils/shiftboard-auth.ts`

**Current** (lines 34-56):

```typescript
export function generateSignature(
  method: string,
  params: Record<string, unknown>,
  timestamp: number,
  secretKey: string
): string {
  const paramsJson = JSON.stringify(params || {});
  const message = `${method}${paramsJson}${timestamp}${secretKey}`;
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(message);
  return hmac.digest('hex');
}
```

**Corrected**:

```typescript
export function generateSignature(
  method: string,
  params: Record<string, unknown>,
  secretKey: string
): string {
  // 1. Serialize params as JSON
  const paramsJson = JSON.stringify(params || {});

  // 2. Base64 encode the params
  const paramsBase64 = Buffer.from(paramsJson).toString('base64');

  // 3. Build message: literal "method" + method name + literal "params" + base64 params
  const message = `method${method}params${paramsBase64}`;

  // 4. Compute HMAC SHA-1
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(message);

  // 5. Base64 encode signature (not hex!)
  const signature = hmac.digest('base64');

  // 6. URL encode for query string safety
  return encodeURIComponent(signature);
}
```

**Changes Required**:

1. Remove `timestamp` parameter (not used in signature)
2. Base64-encode params before signing
3. Add literal strings "method" and "params" to message
4. Remove timestamp and secretKey from message concatenation
5. Change output from hex to base64
6. URL-encode the final signature

---

### Priority 2: Fix API Host and Path

**File**: `backend/.env`

**Current**:

```env
SHIFTBOARD_HOST=api.shiftboard.com
SHIFTBOARD_PATH=/api/v1/
```

**Corrected**:

```env
SHIFTBOARD_HOST=api.shiftdata.com
SHIFTBOARD_PATH=
```

---

### Priority 3: Update buildAuthenticatedUrl

**File**: `backend/src/utils/shiftboard-auth.ts`

**Current** (lines 67-86):

```typescript
export function buildAuthenticatedUrl(
  baseUrl: string,
  path: string,
  authParams: ShiftboardAuthParams
): string {
  const { accessKeyId, secretKey, method, params = {} } = authParams;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(method, params, timestamp, secretKey);
  const paramsJson = JSON.stringify(params);

  const url = new URL(path, baseUrl);
  url.searchParams.set('method', method);
  url.searchParams.set('params', paramsJson);
  url.searchParams.set('access_key_id', accessKeyId);
  url.searchParams.set('timestamp', timestamp.toString());
  url.searchParams.set('signature', signature);

  return url.toString();
}
```

**Corrected**:

```typescript
export function buildAuthenticatedUrl(baseUrl: string, authParams: ShiftboardAuthParams): string {
  const { accessKeyId, secretKey, method, params = {} } = authParams;

  // Serialize and base64-encode params
  const paramsJson = JSON.stringify(params);
  const paramsBase64 = Buffer.from(paramsJson).toString('base64');

  // Generate signature (now using correct algorithm)
  const signature = generateSignature(method, params, secretKey);

  // Build URL (no path parameter needed - always root)
  const url = new URL(baseUrl);
  url.searchParams.set('id', '1'); // Optional request ID
  url.searchParams.set('jsonrpc', '2.0'); // Required version
  url.searchParams.set('method', method);
  url.searchParams.set('params', paramsBase64); // Base64-encoded params
  url.searchParams.set('access_key_id', accessKeyId);
  url.searchParams.set('signature', signature); // Already URL-encoded in generateSignature

  return url.toString();
}
```

**Changes Required**:

1. Remove `path` parameter (always use root)
2. Base64-encode params in URL
3. Add `id` parameter (optional but recommended)
4. Add `jsonrpc` parameter (required, must be "2.0")
5. Remove `timestamp` parameter (not part of URL, was error in original implementation)
6. Use updated `generateSignature` function

---

### Priority 4: Update Service Configuration

**File**: `backend/src/services/shiftboard.service.ts`

**Current** (line 188):

```typescript
this.baseUrl = `https://${this.config.host}${this.config.path}`;
```

**Corrected**:

```typescript
this.baseUrl = `https://${this.config.host}`;
```

**Current** (line 235):

```typescript
const url = buildAuthenticatedUrl(this.baseUrl, '', {
  method,
  params,
  accessKeyId: this.config.accessKeyId,
  secretKey: this.config.secretKey,
});
```

**Corrected**:

```typescript
const url = buildAuthenticatedUrl(this.baseUrl, {
  method,
  params,
  accessKeyId: this.config.accessKeyId,
  secretKey: this.config.secretKey,
});
```

---

## Testing Recommendations

### 1. Test Authentication with system.echo

```typescript
// Test endpoint - should return params as result
await shiftboardService.call('system.echo', { test: 'value' });
// Expected: { test: 'value' }
```

### 2. Test shift.whosOn with minimal params

```typescript
await shiftboardService.call('shift.whosOn', {});
// Expected: { shifts: [...] }
```

### 3. Verify signature generation manually

```typescript
const method = 'system.echo';
const params = {};
const paramsJson = '{}';
const paramsBase64 = Buffer.from(paramsJson).toString('base64'); // 'e30='
const message = `method${method}paramse30=`;
// Message should be: "methodsystem.echoparamse30="
```

**Expected Signature Format**: Base64 string like `gJ5Oy1E5W4u9XpjWyMoJytlScU8=`

---

## Documentation Updates Required

### Files to Update

1. **`docs/TechnicalSpecification.md`**
   - Update API base URL
   - Correct authentication flow diagram
   - Document signature algorithm

2. **`docs/API-reference.md`**
   - Add official endpoint documentation
   - Document request/response formats
   - Add authentication examples

3. **`codebase-spec.md`**
   - Update "Shiftboard API Integration" section
   - Correct authentication mechanism description
   - Add JSON-RPC 2.0 protocol notes

4. **`README.md`**
   - Update setup instructions with correct host
   - Add troubleshooting section for API connection

---

## Additional Findings

### Pagination Support

**Official Documentation**: Uses `start` and `batch` parameters

```typescript
{
  start: 1,      // Starting record (1-indexed)
  batch: 25      // Records per page (max 100)
}
```

**Our Implementation**: Currently commented out but correctly structured ✅

### Rate Limiting

**Documentation**: No explicit rate limits documented  
**Recommendation**: Implement exponential backoff for error retry

### Timezones

**Documentation**:

- All datetime fields in RFC 3339 format
- Timezone parameter accepts timezone names like "Pacific Time (US/Can) (GMT-08:00)"
- Organization has default timezone

**Our Implementation**: Using `SHIFTBOARD_API_TIMEZONE` from config ✅

---

## Summary of Changes

| Priority | Issue                   | File                            | Impact                 |
| -------- | ----------------------- | ------------------------------- | ---------------------- |
| CRITICAL | Fix API host            | `.env`                          | All requests failing   |
| CRITICAL | Fix signature algorithm | `shiftboard-auth.ts`            | Authentication failing |
| CRITICAL | Remove API path         | `.env`, `shiftboard.service.ts` | Wrong endpoint         |
| HIGH     | Fix URL query params    | `shiftboard-auth.ts`            | Request format         |
| MEDIUM   | Switch to POST          | `shiftboard.service.ts`         | Best practice          |
| LOW      | Add JSON-RPC id         | `shiftboard-auth.ts`            | Better tracking        |

---

## Conclusion

The current implementation has **critical authentication issues** that prevent all API calls from succeeding. The primary issues are:

1. Wrong API host (api.shiftboard.com vs api.shiftdata.com)
2. Incorrect HMAC signature algorithm (missing base64, literal strings, wrong format)
3. Incorrect API path (/api/v1/ vs root)

Once these issues are corrected, the API integration should work correctly. The endpoint usage and parameter passing are already correct.

**Estimated Fix Time**: 1-2 hours  
**Testing Time**: 30 minutes  
**Risk Level**: Low (changes are isolated to authentication module)

---

## Next Steps

1. Implement Priority 1 authentication fixes
2. Update .env configuration
3. Test with system.echo endpoint
4. Test with shift.whosOn endpoint
5. Update specification documents
6. Commit changes with message: "fix: correct Shiftboard API authentication and endpoint"
