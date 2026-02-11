

# Make New Bookings Card Date-Range Aware

## Problem

The `useNewBookings` hook ignores the date range filter entirely. It always queries for "today" regardless of whether the filter says "Last 7 days," "Yesterday," etc. The card labels also remain hardcoded to "Booked Today."

Additionally, queries use `created_at` (when the record was synced from Phorest) instead of `appointment_date` (when the service is actually scheduled), leading to inaccurate counts.

---

## Changes

### 1. Update `useNewBookings.ts` to accept and use `dateRange`

- Add a `dateRange` parameter alongside `locationId`
- Compute the correct start/end boundaries based on the selected range (today, yesterday, 7d, 30d, thisWeek, thisMonth, lastMonth, todayToEom, todayToPayday)
- Switch all primary queries from `created_at` to `appointment_date` for accuracy
- The "hero" metric becomes the count for the selected range (not always "today")
- New/Returning client breakdown applies to the selected range
- Rebook rate applies to the selected range
- Location breakdown applies to the selected range
- The 30-day comparison footer remains as-is for long-term context

### 2. Update `NewBookingsCard.tsx` to pass `dateRange` and adapt labels

- Pass `filterContext?.dateRange` to `useNewBookings`
- Change "Booked Today" label dynamically based on date range (e.g., "Booked Last 7 Days," "Booked Yesterday")
- Tooltip descriptions update accordingly
- Rebook section label adapts ("...serviced in this period" vs "...serviced today")

---

## Technical Details

### `useNewBookings.ts`

```text
function getDateRange(dateRange: string):
  -> { rangeStart: string, rangeEnd: string, todayDate: string }

Examples:
  'today'     -> start of today, end of today
  'yesterday' -> start of yesterday, end of yesterday  
  '7d'        -> 7 days ago start, end of today
  '30d'       -> 30 days ago start, end of today
  'thisWeek'  -> Monday of this week, end of today
  'thisMonth' -> 1st of this month, end of today
  'lastMonth' -> 1st of last month, last day of last month
  'todayToEom' -> start of today, end of this month
  'todayToPayday' -> start of today, next pay day
```

All primary queries switch from:
```
.gte('created_at', start).lte('created_at', end)
```
To:
```
.gte('appointment_date', startDate).lte('appointment_date', endDate)
```

Where startDate/endDate are `yyyy-MM-dd` format strings (matching `appointment_date` column type).

The rebook logic extends to the full range: fetch all returning clients within the range, then check which have a future appointment beyond the range end.

### `NewBookingsCard.tsx`

- Pass dateRange: `useNewBookings(filterContext?.locationId, filterContext?.dateRange)`
- Dynamic label map for the hero section:
  - `today` -> "Booked Today"
  - `yesterday` -> "Booked Yesterday"  
  - `7d` -> "Last 7 Days"
  - `30d` -> "Last 30 Days"
  - `thisWeek` -> "This Week"
  - `thisMonth` -> "This Month"
  - `lastMonth` -> "Last Month"
  - etc.

