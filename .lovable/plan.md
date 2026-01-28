
# Add Filter Context Badge to All Analytics Cards

## Overview

Display a filter context badge (showing the current location and date range) in the top-right corner of every analytics card affected by the location and time range filters. This provides visual clarity about what data scope is being shown.

---

## Current State

| Component | Has `filterContext` prop | Shows Badge |
|-----------|-------------------------|-------------|
| `AggregateSalesCard` | ✅ Yes | ❌ No (has logic but doesn't render) |
| `LocationComparison` | ❌ No | ❌ No |
| `ProductCategoryChart` | ❌ No | ❌ No |
| `ServicePopularityChart` | ❌ No | ❌ No |
| `HistoricalComparison` | ❌ No | ❌ No |
| `TeamGoalsCard` | ✅ Yes | ✅ Yes |
| `ClientFunnelCard` | ✅ Yes | ✅ Yes |
| `PeakHoursHeatmap` | ❌ No | ❌ No |
| `YearOverYearComparison` | ❌ No | ❌ No |
| `RevenueForecast` | ❌ No | ❌ No |

---

## Proposed Changes

### 1. Update LocationComparison Component

Add `filterContext` prop and render the `AnalyticsFilterBadge` in the card header.

**File:** `src/components/dashboard/sales/LocationComparison.tsx`

```tsx
// Add import
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

// Update interface
interface LocationComparisonProps {
  locations: LocationData[];
  isLoading?: boolean;
  filterContext?: FilterContext;  // Add this
}

// Update component signature
export function LocationComparison({ locations, isLoading, filterContext }: LocationComparisonProps) {

// In CardHeader, update CardTitle to include badge
<CardTitle className="font-display text-sm flex items-center justify-between">
  <span>LOCATION COMPARISON</span>
  <div className="flex items-center gap-2">
    {filterContext && (
      <AnalyticsFilterBadge 
        locationId={filterContext.locationId} 
        dateRange={filterContext.dateRange} 
      />
    )}
    <Badge variant="outline" className="font-normal">
      ${totalRevenue.toLocaleString()} total
    </Badge>
  </div>
</CardTitle>
```

### 2. Update ProductCategoryChart Component

**File:** `src/components/dashboard/sales/ProductCategoryChart.tsx`

```tsx
// Add import
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

// Update interface
interface ProductCategoryChartProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;  // Add this
}

// In header, add badge next to existing Badge
<div className="flex items-center gap-2">
  {filterContext && (
    <AnalyticsFilterBadge 
      locationId={filterContext.locationId} 
      dateRange={filterContext.dateRange} 
    />
  )}
  <Badge variant="outline">${totalRevenue.toLocaleString()}</Badge>
</div>
```

### 3. Update ServicePopularityChart Component

**File:** `src/components/dashboard/sales/ServicePopularityChart.tsx`

Same pattern - add `filterContext` prop and render badge in header.

### 4. Update HistoricalComparison Component

**File:** `src/components/dashboard/sales/HistoricalComparison.tsx`

Add `filterContext` prop and render badge in the card header.

### 5. Update PeakHoursHeatmap Component

**File:** `src/components/dashboard/sales/PeakHoursHeatmap.tsx`

Add `filterContext` prop and render badge in header.

### 6. Update YearOverYearComparison Component

**File:** `src/components/dashboard/sales/YearOverYearComparison.tsx`

Add `filterContext` prop and render badge in header.

### 7. Update RevenueForecast Component

**File:** `src/components/dashboard/sales/RevenueForecast.tsx`

Add `filterContext` prop and render badge in header.

### 8. Update SalesTabContent to Pass filterContext

**File:** `src/components/dashboard/analytics/SalesTabContent.tsx`

Pass the `filterContext` prop to all child components:

```tsx
// Create filterContext once at the top
const filterContext = {
  locationId: filters.locationId,
  dateRange: filters.dateRange,
};

// Pass to all components
<LocationComparison 
  locations={locationData || []} 
  isLoading={locationLoading}
  filterContext={filterContext}  // Add this
/>

<ProductCategoryChart 
  dateFrom={filters.dateFrom} 
  dateTo={filters.dateTo}
  filterContext={filterContext}  // Add this
/>

<ServicePopularityChart 
  dateFrom={filters.dateFrom} 
  dateTo={filters.dateTo}
  filterContext={filterContext}  // Add this
/>

// ... same for all other cards
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/LocationComparison.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/sales/ProductCategoryChart.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/sales/ServicePopularityChart.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/sales/HistoricalComparison.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/sales/PeakHoursHeatmap.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/sales/YearOverYearComparison.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/sales/RevenueForecast.tsx` | Add filterContext prop and render badge |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Pass filterContext to all child components |

---

## Visual Result

Each card will show the applied filters in the top-right corner:

```text
┌────────────────────────────────────────────────────────────────┐
│  LOCATION COMPARISON     📍 All Locations · 📅 Today  $5,446  │
├────────────────────────────────────────────────────────────────┤
│  [Card content...]                                             │
└────────────────────────────────────────────────────────────────┘
```

The badge displays:
- **MapPin icon** + Location name (or "All Locations")
- **Separator** (·)
- **Calendar icon** + Date range label (e.g., "Today", "Last 7 days")

---

## Technical Details

### Badge Positioning Pattern

All cards follow the same header pattern:

```tsx
<CardHeader>
  <CardTitle className="... flex items-center justify-between">
    <span>[Card Title]</span>
    <div className="flex items-center gap-2">
      {filterContext && (
        <AnalyticsFilterBadge 
          locationId={filterContext.locationId} 
          dateRange={filterContext.dateRange} 
        />
      )}
      {/* Other badges/buttons */}
    </div>
  </CardTitle>
</CardHeader>
```

### FilterContext Type

Already defined in `AnalyticsFilterBadge.tsx`:

```typescript
export interface FilterContext {
  locationId: string;
  dateRange: DateRangeType;
}
```

---

## User Experience

| Benefit | Description |
|---------|-------------|
| **Clarity** | Users instantly know which filters are applied to each card |
| **Consistency** | Same badge pattern across all analytics cards |
| **Context** | When cards are pinned to dashboard, the badge shows what data scope is displayed |
| **Non-intrusive** | Small, muted badge doesn't distract from the data |
