

# Rename "Week Ahead Forecast" to "Revenue Forecast"

## Overview

Update all instances of "Week Ahead Forecast" and "Week Ahead" labels to "Revenue Forecast" for consistency across the dashboard customization menu and component headers.

---

## Changes Required

### 1. Dashboard Customize Menu Label

**File:** `src/components/dashboard/DashboardCustomizeMenu.tsx`

Update line 148:
```typescript
// FROM:
{ id: 'week_ahead_forecast', label: 'Week Ahead Forecast', category: 'Forecasting', icon: <TrendingUp className="w-4 h-4" /> },

// TO:
{ id: 'week_ahead_forecast', label: 'Revenue Forecast', category: 'Forecasting', icon: <TrendingUp className="w-4 h-4" /> },
```

### 2. Component Card Title

**File:** `src/components/dashboard/sales/WeekAheadForecast.tsx`

Update line 148:
```typescript
// FROM:
<CardTitle className="font-display text-base">Week Ahead</CardTitle>

// TO:
<CardTitle className="font-display text-base">Revenue Forecast</CardTitle>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Change label from "Week Ahead Forecast" to "Revenue Forecast" |
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Change CardTitle from "Week Ahead" to "Revenue Forecast" |

---

## Notes

- The internal `id` key (`week_ahead_forecast`) remains unchanged to avoid breaking existing user layouts stored in the database
- Other references use "Forecasting" as the element name which is appropriate for visibility toggles
- The filename `WeekAheadForecast.tsx` can remain as-is since it's internal and not user-facing

