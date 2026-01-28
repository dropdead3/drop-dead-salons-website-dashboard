

# Redesign Sales Overview with Revenue Breakdown Layout

## Overview

Based on the reference screenshot, we'll restructure the KPI grid to show a clear visual hierarchy:
- **Total Revenue** as the prominent hero metric at the top
- **Services & Products** as nested sub-cards directly beneath, showing the breakdown with percentages
- **Transactions, Avg Ticket, Rev/Hour** as a secondary row below

---

## Current Layout (7 equal KPI cells)

```text
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Total    │ │ Services │ │ Products │
│ Revenue  │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Trans.   │ │ Avg Tick │ │ Rev Tom. │ │ Rev/Hour │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## New Layout (Matching Reference)

```text
┌─────────────────────────────────────────────────┐
│                    $3,550                       │
│               Total Revenue                     │
│  ┌─────────────────────┐ ┌─────────────────────┐│
│  │ ✂ Services          │ │ 🛍 Products         ││
│  │   $3,550            │ │   $0                ││
│  │   100%              │ │   0%                ││
│  └─────────────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Transactions  │ │    Avg Ticket   │ │    Rev/Hour     │
│       36        │ │      $99        │ │      $85        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Technical Implementation

### File: `src/components/dashboard/AggregateSalesCard.tsx`

#### 1. Calculate percentages for breakdown

Add percentage calculations after the `revenuePerHour` calculation (around line 121):

```typescript
// Calculate revenue breakdown percentages
const totalRevenueSum = displayMetrics.serviceRevenue + displayMetrics.productRevenue;
const servicePercent = totalRevenueSum > 0 
  ? Math.round((displayMetrics.serviceRevenue / totalRevenueSum) * 100) 
  : 0;
const productPercent = totalRevenueSum > 0 
  ? Math.round((displayMetrics.productRevenue / totalRevenueSum) * 100) 
  : 0;
```

#### 2. Replace KPI Grid (lines 294-425) with new layout

**New Hero Revenue Section:**

```typescript
{/* Hero: Total Revenue with Breakdown */}
<div className="bg-muted/30 rounded-lg p-4 sm:p-6">
  {/* Total Revenue - Hero */}
  <div className="text-center mb-4 sm:mb-6">
    <div className="flex justify-center mb-2">
      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
    </div>
    <AnimatedBlurredAmount 
      value={displayMetrics.totalRevenue}
      prefix="$"
      className="text-3xl sm:text-4xl md:text-5xl font-display tabular-nums"
    />
    <div className="flex items-center gap-1 justify-center mt-2">
      <p className="text-sm text-muted-foreground">Total Revenue</p>
      <MetricInfoTooltip description="Sum of all service and product sales..." />
    </div>
    {showTrendIndicators && (
      <div className="mt-2">
        <SalesTrendIndicator 
          current={comparison.current.totalRevenue}
          previous={comparison.previous.totalRevenue} 
        />
      </div>
    )}
  </div>
  
  {/* Services & Products Sub-cards */}
  <div className="grid grid-cols-2 gap-3 sm:gap-4">
    {/* Services */}
    <div className="text-center p-3 sm:p-4 bg-background/50 rounded-lg border border-border/30">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Scissors className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">Services</span>
      </div>
      <AnimatedBlurredAmount 
        value={displayMetrics.serviceRevenue}
        prefix="$"
        className="text-xl sm:text-2xl font-display tabular-nums"
      />
      <p className="text-xs text-muted-foreground/70 mt-1">{servicePercent}%</p>
    </div>
    
    {/* Products */}
    <div className="text-center p-3 sm:p-4 bg-background/50 rounded-lg border border-border/30">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <ShoppingBag className="w-3.5 h-3.5 text-chart-2" />
        <span className="text-xs text-muted-foreground">Products</span>
      </div>
      <AnimatedBlurredAmount 
        value={displayMetrics.productRevenue}
        prefix="$"
        className="text-xl sm:text-2xl font-display tabular-nums"
      />
      <p className="text-xs text-muted-foreground/70 mt-1">{productPercent}%</p>
    </div>
  </div>
</div>
```

**Secondary KPI Row (3 cells):**

```typescript
{/* Secondary KPIs Row */}
<div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
  {/* Transactions */}
  <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
    <div className="flex justify-center mb-2">
      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3" />
    </div>
    <AnimatedBlurredAmount 
      value={displayMetrics.totalTransactions}
      className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
    />
    <div className="flex items-center gap-1 justify-center mt-1">
      <p className="text-xs text-muted-foreground">Transactions</p>
      <MetricInfoTooltip description="Total number of completed sales transactions." />
    </div>
  </div>
  
  {/* Avg Ticket */}
  <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
    <div className="flex justify-center mb-2">
      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-chart-4" />
    </div>
    <AnimatedBlurredAmount 
      value={Math.round(displayMetrics.averageTicket)}
      prefix="$"
      className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
    />
    <div className="flex items-center gap-1 justify-center mt-1">
      <p className="text-xs text-muted-foreground">Avg Ticket</p>
      <MetricInfoTooltip description="Total Revenue ÷ Transactions." />
    </div>
  </div>
  
  {/* Rev/Hour */}
  <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
    <div className="flex justify-center mb-2">
      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-chart-1" />
    </div>
    <AnimatedBlurredAmount 
      value={Math.round(revenuePerHour)}
      prefix="$"
      className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
    />
    <div className="flex items-center gap-1 justify-center mt-1">
      <p className="text-xs text-muted-foreground">Rev/Hour</p>
      <MetricInfoTooltip description="Total Revenue ÷ Service Hours." />
    </div>
  </div>
</div>
```

#### 3. Remove "Rev. Tomorrow" KPI

The "Rev. Tomorrow" metric will be removed from this card since it's not in the reference design. It remains available in the Operations/Tomorrow projections area.

#### 4. Keep Goal Progress after KPIs

The `<SalesGoalProgress>` component remains in place below the secondary KPIs.

---

## Removed Elements

| Element | Reason |
|---------|--------|
| Rev. Tomorrow | Not in reference design; available elsewhere |
| Trend indicators on Services/Products | Cleaner breakdown layout |

---

## Visual Result

The new layout matches the reference screenshot with:
- Large, centered Total Revenue as the hero
- Services & Products as clearly connected sub-metrics with percentages
- Clean 3-column row for operational metrics (Transactions, Avg Ticket, Rev/Hour)

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Restructure KPI grid to hero + breakdown + secondary row layout |

