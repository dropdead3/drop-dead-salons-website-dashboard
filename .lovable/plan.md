
# Fix: Booked in Last 7 Days Showing 0

## Problem
The "Booked in Last 7 Days" shows 0 even though database has many appointments (3 today + many more from previous days). This is a **React Query caching issue** - the old cached data is being returned because the `queryKey` hasn't changed.

## Root Cause
The current `queryKey` is:
```typescript
queryKey: ['new-bookings', format(today, 'yyyy-MM-dd')]
```

This key doesn't change when we modified the date range logic, so React Query returns stale cached data from the old week-based query.

## Solution
Update the `queryKey` to include the `sevenDaysAgo` date, ensuring a fresh fetch:

**File: `src/hooks/useNewBookings.ts`**

Change line 12 from:
```typescript
queryKey: ['new-bookings', format(today, 'yyyy-MM-dd')],
```

To:
```typescript
queryKey: ['new-bookings', format(today, 'yyyy-MM-dd'), sevenDaysAgo],
```

This ensures React Query fetches fresh data whenever the date range changes.

## Technical Details

| Aspect | Details |
|--------|---------|
| File | `src/hooks/useNewBookings.ts` |
| Change | Line 12 - add `sevenDaysAgo` to queryKey |
| Impact | Forces cache invalidation, fetches correct data |

## Expected Result
After this fix, "Booked in Last 7 Days" will correctly show the count of all appointments created in the rolling 7-day window (should be much higher than 3).
