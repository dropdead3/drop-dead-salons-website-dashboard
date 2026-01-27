

# Set Default Time Range Filter to "Today"

## Overview

Change the default date range filter from "Last 30 days" to "Today" when the Analytics Hub loads.

---

## Current Behavior

```typescript
const [dateRange, setDateRange] = useState<DateRangeType>('30d');
```

The page defaults to showing the last 30 days of data.

---

## New Behavior

```typescript
const [dateRange, setDateRange] = useState<DateRangeType>('today');
```

The page will default to showing today's data.

---

## File to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/dashboard/admin/AnalyticsHub.tsx` | 56 | Change `'30d'` to `'today'` |

---

## Result

When users open the Analytics Hub, the date range filter will be pre-set to "Today", showing current day metrics immediately.

