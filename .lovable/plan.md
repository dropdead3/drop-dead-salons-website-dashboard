
# Move Sales Overview Card Inside Overview Tab

## Problem

Currently the Sales Overview card sits **above** the sub-tabs menu (Overview, Goals, Staff Performance, etc.), making it appear separate from the tab content. It should be the first item **inside** the Overview tab so it's clearly part of that section.

---

## Current Structure

```text
┌─────────────────────────────────────────────────┐
│  Header Controls (Sync, Goals, Export)          │
├─────────────────────────────────────────────────┤
│  📊 SALES OVERVIEW CARD  ← Currently here       │
├─────────────────────────────────────────────────┤
│  View                                           │
│  [Overview] [Goals] [Staff] [Forecasting] [...]│
├─────────────────────────────────────────────────┤
│  TabsContent: Revenue Trend, Location Compare...│
└─────────────────────────────────────────────────┘
```

---

## Proposed Structure

```text
┌─────────────────────────────────────────────────┐
│  Header Controls (Sync, Goals, Export)          │
├─────────────────────────────────────────────────┤
│  View                                           │
│  [Overview] [Goals] [Staff] [Forecasting] [...]│
├─────────────────────────────────────────────────┤
│  TabsContent (Overview):                        │
│    📊 SALES OVERVIEW CARD  ← Move here first   │
│    📈 Revenue Trend                             │
│    🏢 Location Comparison                       │
│    📦 Product/Service Charts                    │
└─────────────────────────────────────────────────┘
```

---

## Implementation

### File: `src/components/dashboard/analytics/SalesTabContent.tsx`

**Remove** the Sales Overview Card from lines 187-205 (currently before the sub-tabs).

**Add** the Sales Overview Card as the **first item** inside `TabsContent value="overview"` (after line 231).

### Before (Current Code)

```tsx
{/* Sales Overview Card */}
<PinnableCard 
  elementKey="sales_overview" 
  ...
>
  <AggregateSalesCard ... />
</PinnableCard>

{/* Sub-tabs for detailed views */}
<div className="space-y-2">
  <span className="text-xs ...">View</span>
  <Tabs value={subTab} ...>
    <SubTabsList>...</SubTabsList>
    
    <TabsContent value="overview" className="mt-6 space-y-6">
      {/* Revenue Trend */}
      <PinnableCard elementKey="revenue_trend_chart" ...>
```

### After (New Code)

```tsx
{/* Sub-tabs for detailed views */}
<div className="space-y-2">
  <span className="text-xs ...">View</span>
  <Tabs value={subTab} ...>
    <SubTabsList>...</SubTabsList>
    
    <TabsContent value="overview" className="mt-6 space-y-6">
      {/* Sales Overview Card - Now first in Overview tab */}
      <PinnableCard 
        elementKey="sales_overview" 
        elementName="Sales Overview" 
        category="Analytics Hub - Sales"
      >
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
      </PinnableCard>

      {/* Revenue Trend */}
      <PinnableCard elementKey="revenue_trend_chart" ...>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Move Sales Overview card from before sub-tabs to inside `TabsContent value="overview"` as the first child |

---

## Visual Result

The Sales Overview card will now appear **inside** the Overview tab content, making it clear that:
1. It's part of the Overview section
2. Switching to Goals/Staff/Forecasting tabs will hide it
3. The layout is consistent with how other tab content is structured
