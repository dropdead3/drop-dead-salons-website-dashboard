
# Combine Top Performers & Revenue Mix into One Pinnable Card

## Overview

Merge the "Top Performers" and "Revenue Mix" sections in the Analytics Hub sidebar into a single unified card. This creates one pinnable element that can be added to the Command Center as a cohesive "Sales Snapshot" widget.

---

## Current State

The sidebar currently has two separate cards:
1. **Top Performers** (`top_performers` element key) - Shows top 3 stylists by revenue
2. **Revenue Mix** (`revenue_breakdown` element key) - Shows service vs product donut chart

Each has its own:
- Card wrapper with header
- `CommandCenterVisibilityToggle` gear icon
- Separate element key for pinning

---

## Solution

Create a new combined card component that:
1. Has a single `PinnableCard` wrapper with one element key (`sales_snapshot`)
2. Contains both Top Performers and Revenue Mix sections inside
3. Uses a clean visual separation between the two sections
4. Removes the redundant individual Card wrappers from child components

---

## Implementation

### File 1: Create `SalesSnapshotCard.tsx`

New component that combines both sections into one card:

```typescript
// src/components/dashboard/sales/SalesSnapshotCard.tsx

interface SalesSnapshotCardProps {
  performers: Performer[];
  isLoading?: boolean;
  serviceRevenue: number;
  productRevenue: number;
}

export function SalesSnapshotCard({
  performers,
  isLoading,
  serviceRevenue,
  productRevenue
}: SalesSnapshotCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="font-display text-base">Sales Snapshot</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Performers Section */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-4 h-4 text-chart-4" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top Performers
            </h4>
          </div>
          {/* Performer list content (inline, no card wrapper) */}
        </div>
        
        <Separator />
        
        {/* Revenue Mix Section */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <PieChartIcon className="w-4 h-4 text-chart-2" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Revenue Mix
            </h4>
          </div>
          {/* Donut chart content (inline, no card wrapper) */}
        </div>
      </CardContent>
    </Card>
  );
}
```

### File 2: Update `SalesTabContent.tsx`

Replace the two separate `PinnableCard` components with one:

```typescript
// Before (lines 294-314):
<div className="space-y-4">
  <PinnableCard elementKey="top_performers" ...>
    ...
  </PinnableCard>
  <PinnableCard elementKey="revenue_breakdown" ...>
    ...
  </PinnableCard>
</div>

// After:
<PinnableCard 
  elementKey="sales_snapshot" 
  elementName="Sales Snapshot" 
  category="Analytics Hub - Sales"
>
  <SalesSnapshotCard
    performers={stylistData || []}
    isLoading={stylistLoading}
    serviceRevenue={metrics?.serviceRevenue || 0}
    productRevenue={metrics?.productRevenue || 0}
  />
</PinnableCard>
```

### File 3: Update existing components (optional cleanup)

The `TopPerformersCard` and `RevenueDonutChart` components can either:
- **Option A**: Be refactored into "inline" variants without Card wrappers for use in the combined card
- **Option B**: Keep as-is for backward compatibility if used elsewhere, and duplicate the content inline in `SalesSnapshotCard`

I'll use **Option B** to avoid breaking other usages - the new `SalesSnapshotCard` will contain its own inline content.

---

## Visual Layout

```text
┌─────────────────────────────────┐
│ ⚙ Sales Snapshot               │ ← Single gear icon for pinning
├─────────────────────────────────┤
│ 🏆 TOP PERFORMERS               │
│ ┌─────────────────────────────┐ │
│ │ 1. [Avatar] Name    $3,550  │ │
│ │ 2. [Avatar] Name    $2,100  │ │
│ │ 3. [Avatar] Name    $1,800  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📊 REVENUE MIX                  │
│ [Donut Chart]  Services 100%    │
│                Products 0%      │
│                Retail % 0%      │
└─────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/SalesSnapshotCard.tsx` | **New** - Combined card component |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Replace two PinnableCards with one using SalesSnapshotCard |

---

## Element Key Consolidation

| Before | After |
|--------|-------|
| `top_performers` | Merged into `sales_snapshot` |
| `revenue_breakdown` | Merged into `sales_snapshot` |

The old element keys can remain in the database but will no longer be actively used. The new `sales_snapshot` key becomes the single pinnable element.

---

## Result

- **One card** in the Analytics Hub sidebar containing both sections
- **One gear icon** to pin the entire card to Command Center
- **Cleaner UI** with visual separation via separator
- **Single element key** (`sales_snapshot`) for visibility management
