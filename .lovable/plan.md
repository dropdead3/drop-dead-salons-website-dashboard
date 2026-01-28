

# Redesign Revenue KPI to Show Breakdown

## Overview

Redesign the "Total Revenue" metric to visually communicate that it is the sum of Services + Products revenue, making the relationship between these numbers clear at a glance.

---

## Current Layout

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  $1,424      │ │  $1,424      │ │  $0          │
│ Total Revenue│ │  Services    │ │  Products    │
└──────────────┘ └──────────────┘ └──────────────┘
```

All three metrics appear at the same level, making it unclear that Services + Products = Total.

---

## New Design

A single "Revenue" card that shows the total prominently with a breakdown underneath:

```
┌────────────────────────────────────────────────┐
│              $                                 │
│           $1,424                               │
│        Total Revenue                           │
│  ┌──────────────────┐ ┌──────────────────┐     │
│  │  ✂ $1,424        │ │  🛍 $0            │     │
│  │  Services  (100%)│ │  Products  (0%)   │     │
│  └──────────────────┘ └──────────────────┘     │
└────────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Create New "RevenueBreakdownCell" Component

Replace the three separate KPICells with a single composite component:

```typescript
function RevenueBreakdownCell({
  totalRevenue,
  serviceRevenue,
  productRevenue,
}: {
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
}) {
  const total = serviceRevenue + productRevenue;
  const servicePercent = total > 0 ? Math.round((serviceRevenue / total) * 100) : 0;
  const productPercent = total > 0 ? Math.round((productRevenue / total) * 100) : 0;
  
  return (
    <div className="col-span-2 sm:col-span-3 p-4 bg-muted/30 rounded-lg">
      {/* Main Total */}
      <div className="text-center mb-4">
        <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
        <AnimatedBlurredAmount 
          value={totalRevenue}
          prefix="$"
          className="text-2xl sm:text-3xl font-display tabular-nums"
        />
        <div className="flex items-center gap-1 justify-center mt-1">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <MetricInfoTooltip description="..." />
        </div>
      </div>
      
      {/* Breakdown Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Services */}
        <div className="text-center p-3 bg-background/50 rounded-md border border-border/30">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Scissors className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Services</span>
          </div>
          <AnimatedBlurredAmount 
            value={serviceRevenue}
            prefix="$"
            className="text-lg font-display tabular-nums"
          />
          <span className="text-xs text-muted-foreground/70">{servicePercent}%</span>
        </div>
        
        {/* Products */}
        <div className="text-center p-3 bg-background/50 rounded-md border border-border/30">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-chart-2" />
            <span className="text-xs text-muted-foreground">Products</span>
          </div>
          <AnimatedBlurredAmount 
            value={productRevenue}
            prefix="$"
            className="text-lg font-display tabular-nums"
          />
          <span className="text-xs text-muted-foreground/70">{productPercent}%</span>
        </div>
      </div>
    </div>
  );
}
```

### 2. Update KPI Grid Layout

Change from 6 equal cells to:
- 1 full-width Revenue Breakdown card (spans 2-3 columns)
- 3 remaining KPI cells (Transactions, Avg Ticket, Rev/Hour)

```typescript
{/* Left: KPI Grid */}
<div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
  {/* Revenue Breakdown - Full Width */}
  <RevenueBreakdownCell 
    totalRevenue={totalRevenue}
    serviceRevenue={serviceRevenue}
    productRevenue={productRevenue}
  />
  
  {/* Remaining KPIs */}
  <KPICell icon={CreditCard} value={totalTransactions} label="Transactions" />
  <KPICell icon={Receipt} value={averageTicket} label="Avg Ticket" prefix="$" />
  <KPICell icon={Clock} value={revenuePerHour} label="Rev/Hour" prefix="$" />
</div>
```

---

## Updated Layout Visual

```
┌─────────────────────────────────────────────────────────┐
│                    REVENUE BREAKDOWN                     │
│                       $1,424                             │
│                    Total Revenue                         │
│    ┌─────────────────┐    ┌─────────────────┐           │
│    │  ✂ $1,424       │    │  🛍 $0           │           │
│    │  Services 100%  │    │  Products 0%    │           │
│    └─────────────────┘    └─────────────────┘           │
├─────────────────┬─────────────────┬─────────────────────┤
│   Transactions  │   Avg Ticket    │    Rev/Hour         │
│       12        │     $119        │      $95            │
└─────────────────┴─────────────────┴─────────────────────┘
```

---

## Benefits

| Before | After |
|--------|-------|
| 3 separate equal cards | Clear parent-child relationship |
| Unclear relationship | Visual hierarchy shows breakdown |
| Redundant "Revenue Mix" in sidebar | Integrated percentage display |
| 6 KPI cells | 4 logical groupings (cleaner) |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Add `RevenueBreakdownCell` component; update grid layout |

