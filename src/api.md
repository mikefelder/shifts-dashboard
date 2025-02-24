# API Documentation

## Endpoints

### GET /api/shifts/whos-on

Returns currently active shifts and upcoming shifts.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| timeclock_status | boolean | Include clock-in status (default: true) |

#### Response

```typescript
{
  result: {
    shifts: Array<{
      id: string;
      name: string;
      subject: string;
      local_start_date: string;
      local_end_date: string;
      display_time: string;
      location: string | null;
      clocked_in: boolean;
      can_clock_in_out: boolean;
      covering_member: string;
      // ...additional fields
    }>;
    referenced_objects: {
      account: Array<{
        id: string;
        screen_name: string;
        first_name: string;
        last_name: string;
        // ...additional fields
      }>;
      workgroup: Array<{
        id: string;
        name: string;
      }>;
    }
  }
}
```
