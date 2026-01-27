
# Replace "Rev Tomorrow" with "Expected Rev" Metric

## Overview

Remove the "Rev Tomorrow" card and replace it with an "Expected Rev" card that shows revenue calculated from scheduled appointments for the selected date range.

---

## Current State

The 6th KPI cell shows:
- **Label**: "Rev Tomorrow"  
- **Value**: Tomorrow's projected revenue from appointments
- **Tooltip**: "Projected revenue from confirmed appointments scheduled for tomorrow"
- **Subtitle**: "X bookings"

---

## New Design

Replace with:
- **Label**: "Expected Rev"
- **Value**: Revenue calculated from scheduled appointments for the selected date range
- **Icon**: `CalendarCheck` (or similar scheduling icon)
- **Tooltip** (info icon): "Revenue calculated from booked appointments in the selected date range. This reflects scheduled services, not completed sales."
- **Subtitle**: "X appointments"

---

## Technical Changes

**File: `src/components/dashboard/sales/SalesBentoCard.tsx`**

1. **Remove import**: Remove `useTomorrowRevenue` hook
2. **Add import**: Add `CalendarCheck` icon from lucide-react
3. **Remove data fetch**: Remove `tomorrowData` from `useTomorrowRevenue()`
4. **Update KPI cell** (lines 274-282):

```typescript
// Before
<KPICell 
  icon={CalendarClock} 
  value={tomorrowRevenue} 
  label="Rev Tomorrow" 
  prefix="$"
  iconColor="text-chart-5"
  subtitle={`${tomorrowBookings} bookings`}
  tooltip="Projected revenue from confirmed appointments scheduled for tomorrow."
/>

// After
<KPICell 
  icon={CalendarCheck} 
  value={totalRevenue} 
  label="Expected Rev" 
  prefix="$"
  iconColor="text-chart-5"
  subtitle={`${totalTransactions} appointments`}
  tooltip="Revenue calculated from booked appointments in the selected date range. This reflects scheduled services, not completed sales."
/>
```

---

## Note on Data Source

The `useSalesMetrics` hook already calculates revenue from the `phorest_appointments` table:
- It queries appointments within the selected date range
- It sums `total_price` from those appointments
- This is exactly what "Expected Rev" needs to display

The current "Total Revenue" and this new "Expected Rev" will show the same value since both come from appointments. If you want them to be different (e.g., Total Revenue from completed sales vs Expected Rev from scheduled appointments), we would need a separate data source for actual sales.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Replace Rev Tomorrow KPI with Expected Rev |
