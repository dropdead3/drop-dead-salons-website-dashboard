

# Smart Stylist Recommendations for Walk-In Dialog

## Overview

This plan enhances the "Assign to Stylist" dropdown in the Walk-In Dialog to:
1. **Only show stylists working today** at the selected location
2. **Calculate and display available time** next to each stylist's name (e.g., "Eric Day - 2h 30m available")
3. **Filter out unavailable stylists** who have no time for the requested service duration

## Current State

The `WalkInDialog` component currently:
- Fetches **all active employee profiles** from `employee_profiles`
- Filters by `location_ids` array if a location is selected
- Does **NOT** check if the stylist is working today
- Does **NOT** calculate availability based on existing appointments

## Data Sources for Availability

| Source | Purpose |
|--------|---------|
| `employee_location_schedules` | Work days per location (e.g., `['Mon', 'Tue', 'Wed']`) |
| `phorest_appointments` | Existing appointments for today (start_time, end_time, stylist_user_id) |
| `phorest_services` | Service duration for the selected service |
| `phorest_staff_mapping` | Ensures stylist is bookable (`show_on_calendar = true`) |

## Availability Calculation Logic

```text
1. Get all stylists at the selected location
2. Filter to those with today's day-of-week in their work_days
3. For each remaining stylist:
   a. Get their appointments for today at this location
   b. Calculate busy time blocks
   c. Find gaps between appointments (from now until end of day, e.g., 8 PM)
   d. Sum total available minutes
4. Only show stylists with available time >= service duration
5. Display available time next to name
```

## Technical Implementation

### New Hook: `useStylistAvailability`

Create a new hook at `src/hooks/useStylistAvailability.ts` that:

```typescript
interface StylistWithAvailability {
  user_id: string;
  full_name: string;
  display_name: string | null;
  availableMinutes: number;
  isWorkingToday: boolean;
}

export function useStylistAvailability(
  locationId: string | undefined,
  serviceDurationMinutes: number
)
```

**Hook Logic:**

1. Fetch stylists from `employee_profiles` where `is_active = true`
2. Join with `employee_location_schedules` to get `work_days` per location
3. Optionally join with `phorest_staff_mapping` to filter by `show_on_calendar`
4. Filter to stylists where today's day-of-week is in their `work_days` for this location
5. Fetch today's appointments from `phorest_appointments` for these stylists
6. Calculate available time by finding gaps between appointments
7. Return sorted list (most available first) with availability info

### Availability Calculation Details

Working hours assumption: 8:00 AM - 8:00 PM (configurable)

```typescript
function calculateAvailableMinutes(
  appointments: { start_time: string; end_time: string }[],
  dayStart: string = '08:00',
  dayEnd: string = '20:00'
): number {
  // Sort appointments by start time
  // Find gaps between: dayStart -> first appointment, between appointments, last appointment -> dayEnd
  // Sum all gap durations
  // Only count gaps >= 15 minutes as "available"
}
```

### WalkInDialog.tsx Updates

**Current stylist fetch (lines 55-76):**
```typescript
const { data: stylists } = useQuery({
  queryKey: ['available-stylists', locationId],
  queryFn: async () => {
    // Basic fetch - no availability check
  }
});
```

**Updated to use new hook:**
```typescript
// Get selected service duration
const selectedService = services?.find(s => s.id === serviceId);
const serviceDuration = selectedService?.duration_minutes || 60;

// Use smart availability hook
const { data: availableStylists, isLoading: stylistsLoading } = useStylistAvailability(
  locationId,
  serviceDuration
);
```

**Updated dropdown display (lines 205-212):**
```typescript
<SelectContent>
  {availableStylists?.length === 0 && (
    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
      No stylists available for this service today
    </div>
  )}
  {availableStylists?.map((stylist) => (
    <SelectItem key={stylist.user_id} value={stylist.user_id}>
      <div className="flex items-center justify-between w-full">
        <span>{stylist.display_name || stylist.full_name}</span>
        <span className="text-xs text-muted-foreground ml-2">
          {formatAvailability(stylist.availableMinutes)}
        </span>
      </div>
    </SelectItem>
  ))}
</SelectContent>
```

### Format Availability Helper

```typescript
function formatAvailability(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m free` : `${hours}h free`;
  }
  return `${minutes}m free`;
}
```

## UI Display Example

```text
┌─────────────────────────────────────────┐
│ Assign to Stylist                       │
│ ┌─────────────────────────────────────┐ │
│ │ Select a stylist                  ▼ │ │
│ └─────────────────────────────────────┘ │
│   ┌─────────────────────────────────┐   │
│   │ Eric Day          4h 30m free   │   │
│   │ Sarah M.          2h 15m free   │   │
│   │ Jordan T.         1h 30m free   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Visual details:**
- Stylist name in normal weight on the left
- Available time in muted, smaller text on the right
- Stylists sorted by most available first
- If no stylists available, show helpful message

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No location selected | Show all active stylists (no availability filtering) |
| No service selected | Assume 60-minute default duration |
| Stylist has no appointments | Full day available (up to 12 hours) |
| Stylist fully booked | Not shown in list |
| Today is a day off | Not shown in list |

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useStylistAvailability.ts` | Create | New hook for availability calculation |
| `src/components/dashboard/operations/WalkInDialog.tsx` | Modify | Use new hook, update dropdown display |

## Future Enhancements

The hook architecture supports future additions:
- **Time slot suggestions**: "Best slot: 2:00 PM - 3:30 PM"
- **Conflict warnings**: Alert if walk-in would create a tight schedule
- **Qualification filtering**: Only show stylists qualified for the selected service

