
# Sync Sales Overview Date Filter with Dashboard Filter Bar

## The Problem

Currently there are two independent date filters visible when Sales Overview is on the dashboard:
1. **Top Filter Bar** - Controls all pinned analytics cards
2. **Card's Internal Filter** - Only controls this specific card

This creates confusion when they show different values (e.g., "This Month" at top vs "Today" on card).

## The Solution

Make the Sales Overview card accept the shared filter from the dashboard, while keeping its internal filter as a fallback for standalone use in the Analytics Hub.

## Visual Before/After

```text
BEFORE (Conflicting filters):
┌─────────────────────────────────────────────────────────────┐
│  📍 All Locations  📅 This Month                            │  ← Top filter
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  $ SALES OVERVIEW               📅 Today ▼                  │  ← Card has its own filter
│                                                             │
│            $1,424                                           │  ← Which date does this use?
│         Total Revenue                                       │
└─────────────────────────────────────────────────────────────┘

AFTER (Synced):
┌─────────────────────────────────────────────────────────────┐
│  📍 All Locations  📅 This Month                            │  ← Single source of truth
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  $ SALES OVERVIEW                                           │  ← No conflicting filter
│                                                             │
│            $1,424                                           │  ← Uses "This Month"
│         Total Revenue                                       │
└─────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### 1. Update AggregateSalesCard to Accept Optional Filters

**File: `src/components/dashboard/AggregateSalesCard.tsx`**

Add optional props for external filter control:

```typescript
interface AggregateSalesCardProps {
  // When provided, use these instead of internal state
  externalDateRange?: DateRange;
  externalDateFilters?: { dateFrom: string; dateTo: string };
  // Hide the internal date selector when using external filters
  hideInternalFilter?: boolean;
}

export function AggregateSalesCard({ 
  externalDateRange,
  externalDateFilters,
  hideInternalFilter = false,
}: AggregateSalesCardProps = {}) {
  // Internal state as fallback
  const [internalDateRange, setInternalDateRange] = useState<DateRange>('today');
  
  // Use external if provided, otherwise internal
  const dateRange = externalDateRange ?? internalDateRange;
  const setDateRange = externalDateRange ? undefined : setInternalDateRange;
  
  // Use external filters if provided
  const dateFilters = externalDateFilters ?? calculateDateFilters(dateRange);
  
  // ... rest of component
}
```

### 2. Update Date Selector Visibility

In the header section, conditionally show the date picker:

```typescript
{!hideInternalFilter && (
  <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange?.(v)}>
    {/* ... options ... */}
  </Select>
)}
```

### 3. Pass Filters from PinnedAnalyticsCard

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

Update the `sales_overview` case to pass the shared filters:

```typescript
case 'sales_overview':
  return (
    <VisibilityGate elementKey="sales_overview">
      <AggregateSalesCard 
        externalDateRange={mapDateRangeType(filters.dateRange)}
        externalDateFilters={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
        hideInternalFilter={true}
      />
    </VisibilityGate>
  );
```

### 4. Add Date Range Type Mapping

The dashboard uses `DateRangeType` while the card uses `DateRange`. Add a mapping function:

```typescript
// In PinnedAnalyticsCard.tsx
function mapDateRangeType(dashboardRange: DateRangeType): DateRange {
  const mapping: Record<DateRangeType, DateRange> = {
    'today': 'today',
    '7d': '7d',
    '30d': '30d',
    'thisWeek': 'thisWeek',
    'thisMonth': 'mtd',  // Dashboard "This Month" → Card "MTD"
    'lastMonth': '30d',  // Approximate mapping
  };
  return mapping[dashboardRange] || 'today';
}
```

### 5. Ensure Analytics Hub Still Works Independently

When the card is rendered in the Analytics Hub (not as a pinned card), it should still have its internal filter. No changes needed there since we're only passing props when rendered via `PinnedAnalyticsCard`.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Add props for external filter control, conditionally hide internal selector |
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Pass shared filters to AggregateSalesCard |

## UX Benefits

1. Single point of control when on dashboard
2. Changing top filter updates all pinned cards including Sales Overview
3. No conflicting visual indicators
4. Card still works independently in Analytics Hub with its full filter options
