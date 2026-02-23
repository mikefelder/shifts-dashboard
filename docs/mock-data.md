# Mock Data Service

## Overview

The Mock Data Service provides realistic test data for UI development and debugging when there are no active shifts in the Shiftboard system.

## Features

- **Time-aware shift generation**: Generates shifts based on current time (morning, afternoon, evening)
- **Realistic scenarios**: Mix of clocked in/out statuses, multiple workgroups, and locations
- **Consistent data**: Same mock accounts and workgroups across all requests
- **Grouping support**: Includes overlapping shifts to test the grouping algorithm

## Usage

### Enable Mock Mode

Set the environment variable in `backend/.env`:

```env
ENABLE_MOCK_DATA=true
```

Restart the backend server:

```bash
cd backend
npm run dev
```

### Verify Mock Mode

Check the backend logs on startup. You should see:

```
[shift.service] Fetching whos-on shifts (workgroup=all) [MOCK MODE]
[shift.service] 🎭 Mock data mode enabled - returning generated mock shifts
```

### Disable Mock Mode

Set the environment variable to `false` or remove it:

```env
ENABLE_MOCK_DATA=false
```

## Mock Data Structure

### Accounts (8 people)

- Alice Anderson (clocked in)
- Bob Baker (clocked in)
- Carol Chen (not clocked in)
- David Davis (clocked in)
- Emma Evans (not clocked in)
- Frank Foster (clocked in)
- Grace Garcia (not clocked in)
- Henry Harris (clocked in)

### Workgroups (4 teams)

- Security Team (`wg-001`)
- Medical Staff (`wg-002`)
- Operations (`wg-003`)
- Guest Services (`wg-004`)

### Shifts (Time-based)

#### Morning (6am - 12pm)

- Security - Main Entrance (2 people, both clocked in)
- Medical - First Aid Station (1 person, not clocked in)

#### Afternoon (12pm - 6pm)

- Security - Parking Lot (2 people, mixed status)
- Operations - Equipment Check (1 person, clocked in)
- Guest Services - Information Desk (2 people, mixed status)

#### Evening (6pm - 10pm)

- Security - Night Patrol (3 people, all clocked in)
- Medical - Evening Coverage (1 person, not clocked in)

#### Fallback (No active shifts)

When the current time is outside the active hours (10pm - 6am), the service provides:

- 1 past shift (completed)
- 1 future shift (not started)

This ensures the UI can display "no active shifts" state with context.

## Testing Scenarios

### Test All Clock-In Statuses

Mock data includes:

- ✅ Fully clocked in shifts (all assigned people clocked in)
- ⚠️ Partially clocked in shifts (some clocked in, some not)
- ❌ Not clocked in shifts (no one clocked in)

### Test Workgroup Filtering

Shifts are distributed across 4 workgroups. Test filtering by:

```bash
# Frontend: Select "Security Team" in workgroup dropdown
# Backend will return only wg-001 shifts
```

### Test Shift Grouping

Mock data includes overlapping shifts (same name, time, location) to test the grouping algorithm:

- "Security - Main Entrance" has 2 people assigned
- "Security - Parking Lot" has 2 people assigned
- "Security - Night Patrol" has 3 people assigned

### Test Empty State

Change your system time to 2am or 3am, then restart the backend. The UI should show:

- "No active shifts" message
- Past/future shifts in the background

## API Response Example

With mock mode enabled, `GET /api/shifts/whos-on` returns:

```json
{
  "result": {
    "shifts": [
      {
        "id": "shift-001",
        "name": "Security - Main Entrance",
        "location": "Main Entrance",
        "workgroup": "wg-001",
        "local_start_date": "2026-02-23T06:00:00.000Z",
        "local_end_date": "2026-02-23T12:00:00.000Z",
        "assignedPeople": ["acc-001", "acc-002"],
        "assignedPersonNames": ["Alice A.", "Bob B."],
        "clockStatuses": [true, true]
      }
    ],
    "referenced_objects": {
      "account": [...],
      "workgroup": [...]
    },
    "metrics": {
      "original_shift_count": 6,
      "grouped_shift_count": 4,
      "clocked_in_count": 3,
      "fetch_duration_ms": 1,
      "grouping_duration_ms": 0
    }
  }
}
```

## Development Tips

### Testing Different Times

To test different time windows without waiting:

1. Enable mock mode: `ENABLE_MOCK_DATA=true`
2. Modify `generateMockShifts()` in `mock-data.service.ts`
3. Change time conditions: `if (currentHour >= 6 && currentHour < 12)`
4. Restart backend server

### Adding Custom Scenarios

To add your own test scenarios:

1. Edit `/Users/mike/shifts-dashboard/backend/src/services/mock-data.service.ts`
2. Add shifts to the appropriate time block in `generateMockShifts()`
3. Follow the existing pattern for shift structure
4. Restart backend to see changes

### Committee Mode Testing

Mock data works with committee configuration:

```env
ENABLE_MOCK_DATA=true
COMMITTEE_WORKGROUP=wg-001
```

This will return only Security Team shifts in the mock data.

## Limitations

- Mock data does not persist across server restarts
- Clock-in statuses are static (don't update in real-time)
- No pagination (all mock shifts returned at once)
- Workgroup filtering is basic (exact match only)

## Production Safety

Mock mode is **disabled by default** and requires explicit opt-in via environment variable. The production deployment should never have `ENABLE_MOCK_DATA=true`.

To verify mock mode is disabled:

```bash
# Should return empty or "false"
echo $ENABLE_MOCK_DATA
```

## Related Files

- `/backend/src/services/mock-data.service.ts` - Mock data generator
- `/backend/src/services/shift.service.ts` - Integration point
- `/backend/.env.example` - Configuration template
- `/README.md` - User-facing documentation
