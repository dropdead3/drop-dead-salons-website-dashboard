

# Show "Tomorrow" Label on Forecasting Chart

## Overview

Update the Forecasting card's X-axis tick component to display "Tomorrow" for the day following "Today" when viewing multi-day forecast periods (like "EOM", "7 Days", etc.).

---

## Problem

Currently, the chart shows:
- **Today** → Correctly labeled "Today"
- **Next day** → Shows weekday abbreviation like "Thu" instead of "Tomorrow"

## Solution

Modify the `DailyXAxisTick` component in `ForecastingCard.tsx` to detect when a day is tomorrow (index === 1 when starting from today) and display "Tomorrow" instead of the weekday abbreviation.

---

## File to Modify

**`src/components/dashboard/sales/ForecastingCard.tsx`**

### Change in `DailyXAxisTick` component (around line 75-121)

Update the rendering logic to:
1. Add a new prop `isTomorrow` or compute it inside the tick
2. Check if the current day is tomorrow (second day when `isEomPeriod`)
3. Display "Tomorrow" instead of the weekday name

**Current logic (line 101):**
```tsx
{isTodayHighlight ? 'Today' : day.dayName}
```

**Updated logic:**
```tsx
{isTodayHighlight ? 'Today' : isTomorrow ? 'Tomorrow' : day.dayName}
```

### Update in chart data creation (around line 303-311)

Add `isTomorrow` flag to the chart data:
```tsx
const dailyChartData = days.map((day, index) => ({
  name: day.dayName,
  confirmedRevenue: day.confirmedRevenue,
  unconfirmedRevenue: day.unconfirmedRevenue,
  totalRevenue: day.revenue,
  appointments: day.appointmentCount,
  isPeak: peakDay?.date === day.date,
  isToday: isEomPeriod && index === 0,
  isTomorrow: isEomPeriod && index === 1, // NEW
}));
```

### Update `DailyXAxisTick` to receive and use the `isTomorrow` prop

Pass the additional prop from the XAxis tick and update the label rendering accordingly.

---

## Result

After implementation:
- **Today to EOM view**: Shows "Today", "Tomorrow", "Fri", "Sat", etc.
- **7 Days view**: Shows "Tomorrow", "Thu", "Fri", etc. (since 7 Days starts from tomorrow)
- Consistent, user-friendly labels that make the timeline more intuitive

