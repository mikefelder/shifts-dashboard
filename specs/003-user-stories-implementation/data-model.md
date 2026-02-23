# Data Model — User Stories Implementation

## Overview

This document describes the data model for the Shifts Dashboard application.

## Client-Side Data Stores (IndexedDB)

Database: `shifts-db` (v1)

### Stores

| Store        | Key Path | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `shifts`     | `id`     | Cached shift records from Shiftboard API |
| `accounts`   | `id`     | Cached account/person records            |
| `workgroups` | `id`     | Cached workgroup records                 |
| `metadata`   | `key`    | Sync timestamps and app state            |

## Shiftboard API Entities

### Shift

- `id` — Unique shift identifier
- `name` / `subject` — Shift title
- `start_date`, `end_date` — ISO datetime strings
- `location` — Location name
- `workgroup` — Associated workgroup object
- `members` — Array of assigned team members
- `clock_in` / `clock_out` — Attendance tracking fields

### Account (Person)

- `id` — Unique account identifier
- `first_name`, `last_name` — Name fields
- `email` — Contact email
- `screen_name` — Display name

### Workgroup

- `id` — Unique workgroup identifier
- `name` — Workgroup display name

## Notes

- All data is fetched from the Shiftboard JSON-RPC 2.0 API
- Client caches API responses in IndexedDB for offline/fallback use
- No server-side database; backend is a pass-through proxy
