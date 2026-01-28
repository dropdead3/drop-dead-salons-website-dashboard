

# Add "Today to EOM" Date Range Filter

## Overview

Add a new date range option "Today to EOM" (End of Month) to the analytics filter dropdown. This option will span from today's date through the last day of the current month, providing a forward-looking view of expected revenue based on scheduled appointments.

---

## Files to Modify

### 1. Update DateRangeType Definition

**Files affected:**
- `src/pages/dashboard/admin/AnalyticsHub.tsx` (primary definition)
- `src/components/dashboard/AnalyticsFilterBadge.tsx` (badge labels)
- `src/components/dashboard/AnalyticsFilterBar.tsx` (filter bar labels)
- `src/components/dashboard/PinnedAnalyticsCard.tsx` (pinned card mapping)
- `src/pages/dashboard/admin/SalesDashboard.tsx` (sales dashboard)
- `src/components/dashboard/AggregateSalesCard.tsx` (sales card)

**Change:** Add `'todayToEom'` to the union type in each file.

---

### 2. Add Date Calculation Logic

**File: `src/pages/dashboard/admin/AnalyticsHub.tsx`**

Add new case in the `dateFilters` useMemo switch statement:

```text
case 'todayToEom':
  return { 
    dateFrom: format(now, 'yyyy-MM-dd'), 
    dateTo: format(endOfMonth(now), 'yyyy-MM-dd') 
  };
```

---

### 3. Add Dropdown Option

**File: `src/pages/dashboard/admin/AnalyticsHub.tsx` (line ~184)**

Insert between "This Month" and "Last Month":

```text
<SelectItem value="todayToEom">Today to EOM</SelectItem>
```

**File: `src/pages/dashboard/admin/SalesDashboard.tsx` (line ~309)**

Add the same option to the sales dashboard filter.

---

### 4. Update Label Mappings

**File: `src/components/dashboard/AnalyticsFilterBadge.tsx`**

```text
const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  // existing...
  todayToEom: 'Today to EOM',
};
```

**File: `src/components/dashboard/AnalyticsFilterBar.tsx`**

```text
const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  // existing...
  todayToEom: 'Today to EOM',
};
```

---

### 5. Update Pinned Card Mapping

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

Add mapping for the new range:

```text
function mapToSalesDateRange(dashboardRange: DateRangeType): SalesDateRange {
  const mapping: Record<DateRangeType, SalesDateRange> = {
    // existing...
    'todayToEom': 'todayToEom',
  };
  return mapping[dashboardRange] || 'today';
}
```

---

### 6. Update AggregateSalesCard

**File: `src/components/dashboard/AggregateSalesCard.tsx`**

- Add `'todayToEom'` to the DateRange type
- Handle the date calculation in the `useMemo` that computes date filters
- Show "Expected Revenue" badge for this range (like 'today')

---

## Summary of Changes

| File | Change |
|------|--------|
| `AnalyticsHub.tsx` | Add type, date logic, and dropdown option |
| `AnalyticsFilterBadge.tsx` | Add type and label mapping |
| `AnalyticsFilterBar.tsx` | Add type and label mapping |
| `PinnedAnalyticsCard.tsx` | Add type and date range mapping |
| `SalesDashboard.tsx` | Add type and dropdown option |
| `AggregateSalesCard.tsx` | Add type, date calculation, and Expected Revenue badge logic |

---

## Result

After implementation:
- Users can select "Today to EOM" from any date range dropdown
- Shows revenue from today through end of current month
- Displays "Expected Revenue" indicator (since it includes future appointments)
- Works consistently across Analytics Hub, Sales Dashboard, and pinned cards

