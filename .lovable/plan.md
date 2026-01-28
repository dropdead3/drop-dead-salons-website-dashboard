
# Unify Sales Overview Card Filters

## Problem

The Sales Overview card currently has **duplicate time range filters**:
1. Page-level filter bar (location + date range) in Analytics Hub
2. Card-level filter selector inside the AggregateSalesCard itself

This causes confusion and the filters could potentially show different data. Additionally, when the card is pinned to Command Center, it doesn't inherit the Command Center's filter bar - it uses its own internal filter.

---

## Solution

Make the AggregateSalesCard always use **external filters** when rendered in:
1. Analytics Hub (from the page-level filter bar)
2. Command Center (from the Command Center's filter bar)

The card will display the `AnalyticsFilterBadge` showing what filters are applied instead of having its own filter dropdown.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  ANALYTICS HUB                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Filter Bar: [Location ▼] [Date Range ▼]               │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↓ passes filterContext           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AggregateSalesCard (hideInternalFilter=true)          │  │
│  │ Shows: AnalyticsFilterBadge + data                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COMMAND CENTER                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Filter Bar: [Location ▼] [Date Range ▼]               │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↓ passes filterContext           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AggregateSalesCard (hideInternalFilter=true)          │  │
│  │ Shows: AnalyticsFilterBadge + data                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Changes Required

### 1. Update SalesTabContent (Analytics Hub)

Pass external date filters and `hideInternalFilter={true}` to the AggregateSalesCard.

**File:** `src/components/dashboard/analytics/SalesTabContent.tsx`

Current:
```tsx
<AggregateSalesCard 
  filterContext={{
    locationId: filters.locationId,
    dateRange: filters.dateRange,
  }}
/>
```

Updated:
```tsx
<AggregateSalesCard 
  externalDateRange={filters.dateRange as any}
  externalDateFilters={{
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }}
  hideInternalFilter={true}
  filterContext={{
    locationId: filters.locationId,
    dateRange: filters.dateRange,
  }}
/>
```

### 2. Update CommandCenterAnalytics

Pass the Command Center's filter context to AggregateSalesCard when it's rendered.

**File:** `src/components/dashboard/CommandCenterAnalytics.tsx`

Current:
```tsx
case 'sales_overview':
  return (
    <VisibilityGate key={cardId} elementKey="sales_overview">
      <AggregateSalesCard />
    </VisibilityGate>
  );
```

Updated:
```tsx
case 'sales_overview':
  return (
    <VisibilityGate key={cardId} elementKey="sales_overview">
      <AggregateSalesCard 
        externalDateRange={dateRange}
        externalDateFilters={dateFilters}
        hideInternalFilter={true}
        filterContext={{
          locationId: locationId,
          dateRange: dateRange,
        }}
      />
    </VisibilityGate>
  );
```

### 3. Update AggregateSalesCard

The component already supports `hideInternalFilter` and `filterContext` props - we just need to ensure it works correctly by:

1. Showing `AnalyticsFilterBadge` in the header when `filterContext` is provided
2. Hiding the internal date selector when `hideInternalFilter={true}`

Currently the badge only shows when BOTH `filterContext` AND `hideInternalFilter` are truthy (line 291-296). This is already correct, but we need to ensure it always shows when external filters are used.

**File:** `src/components/dashboard/AggregateSalesCard.tsx`

Move the AnalyticsFilterBadge to always show when filterContext is provided (simplify the condition):

```tsx
{filterContext && (
  <AnalyticsFilterBadge 
    locationId={filterContext.locationId} 
    dateRange={filterContext.dateRange as DateRangeType} 
  />
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Pass `externalDateRange`, `externalDateFilters`, and `hideInternalFilter={true}` to AggregateSalesCard |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Pass filter props to AggregateSalesCard in the `sales_overview` case |
| `src/components/dashboard/AggregateSalesCard.tsx` | Simplify badge display logic - always show when `filterContext` is provided |

---

## Visual Result

### Analytics Hub - Sales Tab
```text
┌────────────────────────────────────────────────────────────────────┐
│  [📍 All Locations ▼] [📅 Today ▼]    ← Page-level filters         │
├────────────────────────────────────────────────────────────────────┤
│  💵 SALES OVERVIEW                                                 │
│  All locations combined                                            │
│                                                                    │
│  [📍 All Locations · Today]  [Synced 31 min ago] [⟳] [📥] [ⓘ]     │
│                     ↑                                              │
│         Filter badge (no dropdown selector)                        │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              $1,896  Total Revenue                         │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Command Center - Pinned Card
```text
┌────────────────────────────────────────────────────────────────────┐
│  [📍 All Locations ▼] [📅 This Month ▼]  ← Command Center filters  │
├────────────────────────────────────────────────────────────────────┤
│  💵 SALES OVERVIEW                                                 │
│  All locations combined                                            │
│                                                                    │
│  [📍 All Locations · This Month]  [Synced ...] [⟳] [📥] [ⓘ]       │
│                     ↑                                              │
│         Same badge pattern, controlled by parent                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Type Compatibility

The `externalDateRange` prop accepts the `DateRange` type from AggregateSalesCard:
```typescript
type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'mtd' | 'ytd' | 'lastYear' | 'last365';
```

The Analytics Hub uses:
```typescript
type DateRangeType = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';
```

Some values overlap (today, yesterday, 7d, 30d, thisWeek). For non-overlapping values like 'thisMonth', the component will fallback to its internal logic for calculating date ranges.

The Command Center uses a subset that matches well.

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Single source of truth** | Filters are controlled at the page/section level, not duplicated on each card |
| **Consistent experience** | Same card behavior in Analytics Hub and Command Center |
| **Clear context** | AnalyticsFilterBadge shows exactly what data is being displayed |
| **Less confusion** | No more mismatched filters between page-level and card-level |
