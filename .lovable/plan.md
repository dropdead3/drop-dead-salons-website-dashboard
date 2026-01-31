
# Add "Yesterday" to Command Center Date Range Filter

## Overview
Add the "Yesterday" option to the Command Center's date range filter dropdown. This option already exists in other parts of the application (Analytics Hub, Sales Dashboard) but is missing from the Command Center filter.

## Current State
- The "Yesterday" date range is already supported in:
  - `AnalyticsHub.tsx`
  - `AggregateSalesCard.tsx`
  - `SalesDashboard.tsx`
  - `AnalyticsFilterBadge.tsx`
- It is **missing** from the Command Center filter in:
  - `CommandCenterAnalytics.tsx`
  - `PinnedAnalyticsCard.tsx` (which exports the shared `DateRangeType`)
  - `AnalyticsFilterBar.tsx`

## Changes Required

### 1. PinnedAnalyticsCard.tsx (Primary Type Definition)
This file exports `DateRangeType` used by `AnalyticsFilterBar.tsx`.

**Line 20**: Add 'yesterday' to type definition
```typescript
// Before
export type DateRangeType = 'today' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'todayToEom' | 'lastMonth';

// After
export type DateRangeType = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'todayToEom' | 'lastMonth';
```

**Lines 24-32**: Add 'yesterday' mapping in `mapToSalesDateRange`
```typescript
const mapping: Record<DateRangeType, SalesDateRange> = {
  'today': 'today',
  'yesterday': 'yesterday',  // Add this line
  '7d': '7d',
  // ... rest unchanged
};
```

**Lines 39-68**: Add 'yesterday' case to `getDateRange` function
```typescript
case 'yesterday': {
  const yesterday = subDays(now, 1);
  return { 
    dateFrom: format(yesterday, 'yyyy-MM-dd'), 
    dateTo: format(yesterday, 'yyyy-MM-dd') 
  };
}
```

### 2. AnalyticsFilterBar.tsx (Dropdown Labels)
**Lines 12-20**: Add 'yesterday' to `DATE_RANGE_LABELS`
```typescript
const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  yesterday: 'Yesterday',  // Add this line after 'today'
  '7d': 'Last 7 days',
  // ... rest unchanged
};
```

### 3. CommandCenterAnalytics.tsx (Local Definitions)
This file has its own local type definitions that need updating.

**Line 32**: Add 'yesterday' to local type
```typescript
// Before
type DateRangeType = 'today' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';

// After
type DateRangeType = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';
```

**Lines 34-41**: Add 'yesterday' to `DATE_RANGE_LABELS`
```typescript
const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  yesterday: 'Yesterday',  // Add this line
  '7d': 'Last 7 days',
  // ... rest unchanged
};
```

**Lines 44-74**: Add 'yesterday' case to `getDateRange` function
```typescript
case 'yesterday': {
  const yesterday = subDays(now, 1);
  return { 
    dateFrom: format(yesterday, 'yyyy-MM-dd'), 
    dateTo: format(yesterday, 'yyyy-MM-dd') 
  };
}
```

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Add 'yesterday' to type, mapping, and date calculation |
| `src/components/dashboard/AnalyticsFilterBar.tsx` | Add 'yesterday' to label mapping |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Add 'yesterday' to local type, labels, and date calculation |

## Dropdown Order After Change
The date range dropdown will show options in this order:
1. Today
2. Yesterday (new)
3. Last 7 days
4. Last 30 days
5. This Week
6. This Month
7. Today to EOM
8. Last Month

## Technical Notes
- No database changes required
- No new dependencies needed
- `subDays` from `date-fns` is already imported in all affected files
- The "Yesterday" option will show finalized (actual) revenue data, not expected revenue
