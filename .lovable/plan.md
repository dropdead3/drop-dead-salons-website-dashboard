

## Add Date Labels to Capacity Utilization X-Axis Ticks

### What's Changing

The Forecasting chart shows three lines in its x-axis: day name, date (e.g. "Feb 17"), and appointment count. The Capacity Utilization chart is missing the date line. This adds it to match.

### Approach

In both `DayXAxisTick` functions, insert a date line (`formatDate(day.date, 'MMM d')`) between the day name and the utilization/closed info. Shift the third line's `dy` down to accommodate.

Since `DayXAxisTick` is a standalone function component (not inside the main component), it needs to call `useFormatDate()` directly (same pattern as the Forecasting card's `DailyXAxisTick`).

### Changes

**Both files: `CapacityUtilizationCard.tsx` and `CapacityUtilizationSection.tsx`**

Import `useFormatDate` in the tick component, then update both branches (closed and open):

Before (closed branch):
```
Line 1: Day name     (dy=12, bold)
Line 2: "Closed"     (dy=24, bold)
```

After (closed branch):
```
Line 1: Day name     (dy=12, bold)
Line 2: "Feb 17"     (dy=25, muted, 10px)
Line 3: "Closed"     (dy=38, bold)
```

Before (open branch):
```
Line 1: Day name     (dy=12, bold)
Line 2: "Xh open"   (dy=24, muted)
```

After (open branch):
```
Line 1: Day name     (dy=12, bold)
Line 2: "Feb 17"     (dy=25, muted, 10px)
Line 3: "Xh open"   (dy=38, muted)
```

### Files Modified
- `src/components/dashboard/sales/CapacityUtilizationCard.tsx`
- `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`
