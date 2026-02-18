# API Contracts Specification

**Version**: 1.0.0  
**Date**: 2026-02-17  
**Source**: Extracted from live codebase

## Overview

This document provides detailed API contract specifications for all endpoints in the Shifts Dashboard API. These contracts are **implementation-agnostic** and can be satisfied by any backend technology stack.

## Base Configuration

### URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://{app-name}.azurewebsites.net/api`

### Headers

- `Content-Type: application/json` (required for POST requests)
- `Accept: application/json` (recommended)

### Authentication

- Client → Server: No authentication (single-tenant assumption)
- Server → Shiftboard: HMAC SHA-1 signature in query string
  - Parameters: `access_key_id`, `signature`, `timestamp`
  - Signature computed from: `method + params + timestamp + secret_key`

### Error Format

All error responses use this format:

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes:

- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (Shiftboard authentication failed)
- `403`: Forbidden (permission denied)
- `404`: Not found (resource doesn't exist)
- `500`: Internal server error (unexpected failure)

## Endpoints

### Shifts

#### GET /api/shifts/whos-on

Returns grouped shifts with assigned people and clock-in status. This is the primary endpoint used by the UI.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `workgroup` | string | No | null | Filter shifts by workgroup ID. If omitted, returns all shifts. |
| `batch` | number | No | 100 | Page size for initial Shiftboard request. Max: 100. |
| `start` | number | No | 0 | Starting index for pagination (used internally for multi-page fetching). |

**Example Request**:

```http
GET /api/shifts/whos-on?workgroup=abc123&batch=100
```

**Success Response** (200 OK):

```json
{
  "result": {
    "shifts": [
      {
        "id": "shift-12345",
        "name": "Security Patrol",
        "subject": "Arena Patrol",
        "location": "Main Arena",
        "workgroup": "abc123",
        "local_start_date": "2026-02-17T08:00:00",
        "local_end_date": "2026-02-17T12:00:00",
        "covering_member": "member-001",
        "clocked_in": true,
        "can_clock_in_out": true,
        "assignedPeople": ["member-001", "member-002"],
        "assignedPersonNames": ["John Doe", "Jane Smith"],
        "clockStatuses": [true, false],
        "display_date": "2026-02-17",
        "display_start_time": "08:00 AM",
        "display_time": "08:00 AM - 12:00 PM",
        "timezone": "America/Chicago",
        "covered": true,
        "published": true,
        "details": "Patrol main arena perimeter",
        "kind": "regular",
        "role": {
          "id": "role-001",
          "name": "Security Officer"
        },
        "count": "2",
        "qty": "2"
      }
    ],
    "referenced_objects": {
      "account": [
        {
          "id": "member-001",
          "external_id": "EXT-001",
          "first_name": "John",
          "last_name": "Doe",
          "screen_name": "jdoe",
          "mobile_phone": "(555) 123-4567",
          "seniority_order": "100",
          "clocked_in": true
        }
      ],
      "workgroup": [
        {
          "id": "abc123",
          "name": "Security Team"
        }
      ]
    },
    "metrics": {
      "original_shift_count": 150,
      "grouped_shift_count": 75,
      "clocked_in_count": 45,
      "fetch_duration_ms": 850,
      "grouping_duration_ms": 12
    },
    "page": {
      "start": 0,
      "batch": 100,
      "total": 150,
      "next": null
    }
  },
  "timing": {
    "start": "2026-02-17T14:30:00.000Z",
    "end": "2026-02-17T14:30:01.250Z",
    "duration_ms": 1250
  }
}
```

**Field Descriptions**:

**Shift Object** (added fields beyond Shiftboard):

- `assignedPeople`: Array of member IDs assigned to this grouped shift
- `assignedPersonNames`: Array of readable names corresponding to `assignedPeople`
- `clockStatuses`: Array of booleans indicating clock-in status for each person (parallel to `assignedPeople`)

**Metrics Object**:

- `original_shift_count`: Total shifts returned by Shiftboard before grouping
- `grouped_shift_count`: Number of shifts after grouping
- `clocked_in_count`: Number of people currently clocked in across all shifts
- `fetch_duration_ms`: Time spent fetching from Shiftboard API
- `grouping_duration_ms`: Time spent running grouping algorithm

**Timing Object**:

- `start`: ISO timestamp when request processing began
- `end`: ISO timestamp when response was ready
- `duration_ms`: Total request duration

**Backend Requirements**:

1. Call Shiftboard `shift.whosOn` with parameters:
   - `timeclock_status: true` (REQUIRED for clock-in data)
   - `extended: true` (REQUIRED for full shift details)
   - `select.workgroup: {workgroupId}` (if workgroup filter provided)
2. Handle pagination (fetch all pages up to 100 page limit)
3. Apply shift grouping algorithm (see Grouping Algorithm section)
4. Collect metrics during processing
5. Return normalized response with timing data

**Error Response** (500):

```json
{
  "error": "Shiftboard API error: Authentication failed"
}
```

---

#### GET /api/shifts/list

Pass-through to Shiftboard `shift.list` endpoint without grouping.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `batch` | number | No | 100 | Page size |
| `start` | number | No | 0 | Starting index |

**Success Response** (200 OK):

```json
{
  "result": {
    "shifts": [
      /* Raw Shiftboard shift objects */
    ],
    "page": {
      "start": 0,
      "batch": 100,
      "total": 500,
      "next": 100
    }
  }
}
```

**Use Case**: Diagnostic endpoint to compare grouped vs raw shift data.

---

### Accounts

#### GET /api/accounts/list

Paginated list of all accounts (volunteers/members).

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `batch` | number | No | 100 | Page size |
| `start` | number | No | 0 | Starting index |

**Success Response** (200 OK):

```json
{
  "result": {
    "accounts": [
      {
        "id": "member-001",
        "external_id": "EXT-001",
        "first_name": "John",
        "last_name": "Doe",
        "screen_name": "jdoe",
        "mobile_phone": "(555) 123-4567",
        "seniority_order": "100",
        "clocked_in": false
      }
    ],
    "page": {
      "start": 0,
      "batch": 100,
      "total": 250,
      "next": 100
    }
  }
}
```

---

#### GET /api/accounts/self

Returns account information for the service identity (Shiftboard API credentials).

**Parameters**: None

**Success Response** (200 OK):

```json
{
  "result": {
    "account": {
      "id": "service-account-001",
      "first_name": "API",
      "last_name": "Service",
      "screen_name": "api_service"
    }
  }
}
```

**Use Case**: Diagnostic endpoint to verify Shiftboard authentication.

---

#### GET /api/accounts/workgroup/:workgroupId

Returns accounts filtered by workgroup membership.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workgroupId` | string | Yes | Workgroup ID to filter by |

**Success Response** (200 OK):

```json
{
  "result": {
    "accounts": [
      /* Array of Account objects */
    ]
  }
}
```

---

#### GET /api/accounts/:accountId

Returns single account by ID.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | Yes | Account ID |

**Success Response** (200 OK):

```json
{
  "result": {
    "account": {
      /* Account object */
    }
  }
}
```

**Error Response** (404):

```json
{
  "error": "Account not found"
}
```

---

### Workgroups

#### GET /api/workgroups/list

Returns all workgroups with optional extended fields.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `extended` | boolean | No | false | Include additional fields like description, settings |

**Success Response** (200 OK):

```json
{
  "result": {
    "workgroups": [
      {
        "id": "abc123",
        "name": "Security Team"
      }
    ]
  }
}
```

---

#### GET /api/workgroups/:workgroupId/roles

Returns roles within a specific workgroup.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workgroupId` | string | Yes | Workgroup ID |

**Success Response** (200 OK):

```json
{
  "result": {
    "roles": [
      {
        "id": "role-001",
        "name": "Security Officer",
        "workgroup": "abc123"
      }
    ]
  }
}
```

---

### Roles

#### GET /api/roles/:roleId

Returns single role by ID.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roleId` | string | Yes | Role ID |

**Success Response** (200 OK):

```json
{
  "result": {
    "role": {
      "id": "role-001",
      "name": "Security Officer"
    }
  }
}
```

---

#### GET /api/roles/list

Returns all roles.

**Query Parameters**: None (returns all roles unpaginated)

**Success Response** (200 OK):

```json
{
  "result": {
    "roles": [
      /* Array of Role objects */
    ]
  }
}
```

---

### Calendar

#### GET /api/calendar/summary

Aggregated statistics endpoint (stub implementation in current version).

**Query Parameters**: None

**Success Response** (200 OK):

```json
{
  "result": {
    "summary": "Not yet implemented"
  }
}
```

**Future Enhancement**: Return metrics like total shifts, coverage %, shifts by workgroup, etc.

---

### System

#### GET /api/system/health

Health check endpoint for infrastructure monitoring (load balancers, Azure App Service).

**Query Parameters**: None

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2026-02-17T14:30:00.000Z",
  "uptime": 3600.5
}
```

**Field Descriptions**:

- `status`: Always "healthy" (no dependency checks currently)
- `timestamp`: Current server time (ISO 8601)
- `uptime`: Process uptime in seconds

**Notes**:

- Should always return 200 OK unless server is completely down
- Does NOT check Shiftboard API connectivity
- Used by load balancers for availability decisions

---

#### POST /api/system/echo

Diagnostic endpoint that proxies to Shiftboard `system.echo` for connectivity testing.

**Request Body**: Any valid JSON

**Example Request**:

```http
POST /api/system/echo
Content-Type: application/json

{
  "message": "test",
  "timestamp": "2026-02-17T14:30:00.000Z"
}
```

**Success Response** (200 OK):

```json
{
  "result": {
    "echo": {
      "message": "test",
      "timestamp": "2026-02-17T14:30:00.000Z"
    },
    "shiftboard_round_trip_ms": 125
  }
}
```

**Use Cases**:

- Verify Shiftboard API credentials
- Test network connectivity to Shiftboard
- Measure Shiftboard API latency
- Debug authentication issues

---

## Data Schemas

### Shift Object (Extended)

Complete Shift object as returned by `/api/shifts/whos-on` with backend-added fields.

```typescript
interface Shift {
  // Shiftboard native fields
  id: string;
  name: string;
  subject: string;
  location: string | null;
  workgroup: string;
  local_start_date: string; // ISO 8601 datetime
  local_end_date: string; // ISO 8601 datetime
  display_date: string; // "YYYY-MM-DD"
  display_start_time: string; // "HH:MM AM/PM"
  display_time: string; // "HH:MM AM/PM - HH:MM AM/PM"
  covering_member: string; // Member ID
  clocked_in: boolean;
  can_clock_in_out: boolean;
  covered: boolean;
  published: boolean;
  timezone: string; // "America/Chicago"
  details: string;
  kind: string; // "regular", "overtime", etc.
  role: {
    id: string;
    name: string;
  } | null;
  count: string; // Number of positions (as string)
  qty: string; // Same as count

  // Backend-added grouping fields
  assignedPeople?: string[]; // Array of member IDs
  assignedPersonNames?: string[]; // Array of readable names
  clockStatuses?: boolean[]; // Clock-in status per person

  // Additional Shiftboard fields (not exhaustive)
  absent_operation_utc: string | null;
  absent_reason: string | null;
  created: string;
  updated: string;
  start_date: string; // UTC datetime
  end_date: string; // UTC datetime
  urgent: boolean;
  no_trade: boolean;
  no_pick_up: boolean;
  // ... many more fields available
}
```

### Account Object

```typescript
interface Account {
  id: string;
  external_id: string;
  first_name: string;
  last_name: string;
  screen_name: string;
  mobile_phone: string; // Format: "(555) 123-4567"
  seniority_order: string; // Numeric rank as string
  clocked_in: boolean;
}
```

### Workgroup Object

```typescript
interface Workgroup {
  id: string;
  name: string;
  // Additional fields when extended=true:
  description?: string;
  // ... other Shiftboard metadata
}
```

### Role Object

```typescript
interface Role {
  id: string;
  name: string;
  workgroup?: string; // Present when fetched via workgroup/:id/roles
}
```

---

## Grouping Algorithm Specification

The shift grouping algorithm is the core business logic that distinguishes this API from raw Shiftboard data.

### Purpose

Combine multiple shift records with identical attributes (same shift, different assigned people) into a single grouped record.

### Inputs

- `shifts`: Array of raw Shift objects from Shiftboard
- `accounts`: Array of Account objects for name resolution

### Outputs

Array of grouped Shift objects with these added fields:

- `assignedPeople`: Array of member IDs
- `assignedPersonNames`: Array of readable names
- `clockStatuses`: Array of clock-in booleans (parallel to assignedPeople)

### Grouping Key

Shifts are considered "the same shift" if all these fields match:

- `name`
- `local_start_date`
- `local_end_date`
- `workgroup`
- `subject`
- `location`

### Algorithm Pseudocode

```
function groupShiftsByAttributes(shifts, accounts):
  shiftGroups = {}

  for each shift in shifts:
    if shift is invalid:
      log warning and skip

    key = compositeKey(
      shift.name,
      shift.local_start_date,
      shift.local_end_date,
      shift.workgroup,
      shift.subject,
      shift.location
    )

    personName = resolvePersonName(shift.covering_member, accounts)

    if key not in shiftGroups:
      shiftGroups[key] = {
        ...shift,
        assignedPeople: [shift.covering_member],
        assignedPersonNames: [personName],
        clockStatuses: [coerceBoolean(shift.clocked_in)]
      }
    else:
      if shift.covering_member not in shiftGroups[key].assignedPeople:
        shiftGroups[key].assignedPeople.push(shift.covering_member)
        shiftGroups[key].assignedPersonNames.push(personName)
        shiftGroups[key].clockStatuses.push(coerceBoolean(shift.clocked_in))

  return Object.values(shiftGroups)

function resolvePersonName(memberId, accounts):
  account = accounts.find(a => a.id == memberId)
  if account:
    return account.screen_name || account.first_name + " " + account.last_name
  return "Unassigned"

function coerceBoolean(value):
  return value === true  // Ensures explicit false for undefined/null
```

### Edge Cases

1. **Missing Fields**: Use safe defaults
   - `name`: "Unnamed Shift"
   - `subject`: ""
   - `location`: ""
   - `clocked_in`: `false`

2. **Duplicate Members**: If same member appears twice in grouped shift, only add once (deduplicate)

3. **Unknown Covering Member**: If `covering_member` not in accounts array, use "Unassigned" as name

4. **Invalid Shift Objects**: Skip with console warning, don't crash

5. **Empty Inputs**: Return empty array

### Example

**Input** (3 shifts):

```json
[
  {
    "id": "shift-1",
    "name": "Security",
    "local_start_date": "2026-02-17T08:00:00",
    "local_end_date": "2026-02-17T12:00:00",
    "workgroup": "abc",
    "subject": "Patrol",
    "location": "Arena",
    "covering_member": "member-001",
    "clocked_in": true
  },
  {
    "id": "shift-2",
    "name": "Security",
    "local_start_date": "2026-02-17T08:00:00",
    "local_end_date": "2026-02-17T12:00:00",
    "workgroup": "abc",
    "subject": "Patrol",
    "location": "Arena",
    "covering_member": "member-002",
    "clocked_in": false
  },
  {
    "id": "shift-3",
    "name": "Ticket Check",
    "local_start_date": "2026-02-17T08:00:00",
    "local_end_date": "2026-02-17T12:00:00",
    "workgroup": "abc",
    "subject": "Gates",
    "location": "Entry",
    "covering_member": "member-003",
    "clocked_in": true
  }
]
```

**Output** (2 grouped shifts):

```json
[
  {
    "id": "shift-1",
    "name": "Security",
    "local_start_date": "2026-02-17T08:00:00",
    "local_end_date": "2026-02-17T12:00:00",
    "workgroup": "abc",
    "subject": "Patrol",
    "location": "Arena",
    "covering_member": "member-001",
    "clocked_in": true,
    "assignedPeople": ["member-001", "member-002"],
    "assignedPersonNames": ["John Doe", "Jane Smith"],
    "clockStatuses": [true, false]
  },
  {
    "id": "shift-3",
    "name": "Ticket Check",
    "local_start_date": "2026-02-17T08:00:00",
    "local_end_date": "2026-02-17T12:00:00",
    "workgroup": "abc",
    "subject": "Gates",
    "location": "Entry",
    "covering_member": "member-003",
    "clocked_in": true,
    "assignedPeople": ["member-003"],
    "assignedPersonNames": ["Bob Wilson"],
    "clockStatuses": [true]
  }
]
```

---

## Shiftboard API Integration

### Authentication Method

**HMAC SHA-1 Signature** appended to query string.

**Steps**:

1. Construct method call: e.g., `shift.whosOn`
2. Serialize parameters as JSON: `{"timeclock_status": true, "extended": true}`
3. Get current Unix timestamp (seconds since epoch)
4. Compute signature:
   ```
   message = method + params_json + timestamp + secret_key
   signature = SHA1_HMAC(message, secret_key)
   ```
5. Append to URL:
   ```
   https://api.shiftboard.com/path?method=shift.whosOn
     &params={encoded_params}
     &access_key_id={access_key}
     &timestamp={timestamp}
     &signature={signature}
   ```

**Required Environment Variables**:

- `SHIFTBOARD_ACCESS_KEY_ID`: Provided by Shiftboard
- `SHIFTBOARD_SECRET_KEY`: Secret key for HMAC
- `SHIFTBOARD_HOST`: e.g., `api.shiftboard.com`
- `SHIFTBOARD_PATH`: e.g., `/api/v1/`

### Pagination Handling

Shiftboard returns paginated responses:

```json
{
  "result": {
    "shifts": [
      /* batch of results */
    ],
    "page": {
      "start": 0,
      "batch": 100,
      "total": 500,
      "next": 100 // null if last page
    }
  }
}
```

**Backend Behavior**:

- Fetch first page with `start=0, batch=100`
- Check `page.next`
- While `next` is not null AND page count < 100:
  - Fetch next page with `start={next}`
  - Append results to accumulated array
- If 100 pages reached, log warning and stop

**Safety**: Hard limit prevents infinite loops from API bugs.

---

## Performance Considerations

### Response Times (Target)

- `/api/shifts/whos-on` with 150 shifts: <2s (p95)
- `/api/shifts/whos-on` with workgroup filter: <1s (p95)
- `/api/system/health`: <50ms (p99)
- All other endpoints: <1s (p95)

### Optimization Strategies

1. **Pagination**: Use `batch=100` to minimize round trips
2. **Grouping**: O(n) algorithm, <20ms for 1000 shifts
3. **Caching**: Client-side IndexedDB reduces API load
4. **Connection Pooling**: Reuse HTTP connections to Shiftboard

### Load Handling

- Expected: 10-50 concurrent users during events
- Peak: 100 users (manual refresh storm)
- Shiftboard rate limits: Unknown, implement exponential backoff if 429 received

---

## Versioning Strategy

### Current Version: v1 (implicit)

No version prefix in URL path.

### Future Versioning

If breaking changes required:

- Add `/api/v2/shifts/whos-on` endpoint
- Deprecate `/api/shifts/whos-on` with 6-month sunset period
- Update client to use v2 endpoints

### Backward Compatibility

Additions (new fields) are non-breaking:

- ✅ Adding fields to response objects
- ✅ Adding optional query parameters
- ❌ Removing fields (breaking)
- ❌ Changing field types (breaking)
- ❌ Changing field semantics (breaking)

---

## Testing Contracts

### Contract Test Checklist

For each endpoint:

- [ ] Verify response schema matches spec
- [ ] Test with valid parameters
- [ ] Test with invalid parameters (expect 400)
- [ ] Test with missing required parameters (expect 400)
- [ ] Test error responses have `{error: string}` format
- [ ] Verify status codes match spec
- [ ] Test pagination (if applicable)
- [ ] Verify timing metadata present

### Integration Test Scenarios

1. **Happy Path**: Request whos-on → Get grouped shifts
2. **Workgroup Filter**: Request with workgroup → Only filtered shifts returned
3. **Empty Result**: Request non-existent workgroup → Empty array
4. **Pagination**: Request when >100 shifts → All pages fetched
5. **Authentication Failure**: Invalid credentials → 401 error
6. **Network Timeout**: Shiftboard down → 500 error after timeout

---

## Migration Notes

### From Current Implementation

The current Node.js/Express implementation fully satisfies these contracts.

### To Alternative Stack

Any backend can implement these contracts. Requirements:

- HTTP server supporting GET and POST
- JSON serialization/deserialization
- HMAC SHA-1 computation
- HTTP client for Shiftboard API calls
- Grouping algorithm implementation

Example stacks:

- ✅ Python + FastAPI
- ✅ Go + Gin
- ✅ .NET + ASP.NET Core
- ✅ Java + Spring Boot
- ✅ Rust + Actix

Key: Maintain exact response schemas and grouping logic.

---

**Document Status**: Complete  
**Maintained By**: API specification owner  
**Related Documents**: `codebase-spec.md`, `enhancements.md`
