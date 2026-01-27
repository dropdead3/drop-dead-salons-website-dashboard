

# Create Unified Sales Bento Box Card

## Overview

Combine all elements visible in the screenshot into a single, cohesive bento-box styled card that becomes one pinnable element for the Command Center. This includes:
- Monthly Goal progress bar
- 6 KPI metrics (Total Revenue, Services, Products, Transactions, Avg Ticket, Rev Tomorrow)
- Sales Snapshot sidebar (Top Performers + Revenue Mix donut chart)

---

## Current Layout (Separate Components)

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Monthly Goal Progress Bar (SalesGoalProgress component)             │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐ ┌───────────────────┐
│ 6 KPI Cards (PinnableCard: sales_kpi_grid)    │ │ SalesSnapshotCard │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │ (PinnableCard:    │
│ │Total Rev│ │Services │ │Products │           │ │  sales_snapshot)  │
│ └─────────┘ └─────────┘ └─────────┘           │ │                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │ - Top Performers  │
│ │  Trans  │ │Avg Tick │ │Tomorrow │           │ │ - Revenue Mix     │
│ └─────────┘ └─────────┘ └─────────┘           │ └───────────────────┘
└───────────────────────────────────────────────┘
```

---

## Target Layout (Single Bento Card)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙                                        SALES DASHBOARD                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ○ Monthly Goal  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  4%  │
│   $3,550 earned                                            $79,785 to go    │
├─────────────────────────────────────────────────────────┬───────────────────┤
│                                                         │                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │ 🏆 TOP PERFORMERS │
│  │      $           │ │      ✂          │ │    📦      │ │ ┌───────────────┐ │
│  │   $3,550        │ │   $3,550        │ │    $0      │ │ │ 1. Name $3550 │ │
│  │  Total Revenue  │ │    Services     │ │  Products  │ │ │ 2. Name $2100 │ │
│  └─────────────────┘ └─────────────────┘ └────────────┘ │ │ 3. Name $1800 │ │
│                                                         │ └───────────────┘ │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │ ──────────────── │
│  │      💳         │ │      🧾         │ │    📅      │ │ 📊 REVENUE MIX  │
│  │      36         │ │     $99         │ │  $1,821    │ │                   │
│  │  Transactions   │ │   Avg Ticket    │ │Rev Tomorrow│ │ [Donut] Services  │
│  │                 │ │                 │ │ 19 bookings│ │         Products  │
│  └─────────────────┘ └─────────────────┘ └────────────┘ │         Retail %  │
│                                                         │                   │
└─────────────────────────────────────────────────────────┴───────────────────┘
```

---

## Implementation

### Step 1: Create `SalesBentoCard.tsx`

A new unified component that combines all elements with a bento-box aesthetic:

**File: `src/components/dashboard/sales/SalesBentoCard.tsx`**

```typescript
interface SalesBentoCardProps {
  // Goal Progress
  currentRevenue: number;
  goalTarget: number;
  goalLabel?: string;
  
  // KPI Metrics
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  averageTicket: number;
  tomorrowRevenue: number;
  tomorrowBookings: number;
  
  // Top Performers
  performers: Performer[];
  isLoading?: boolean;
}

export function SalesBentoCard({ ... }: SalesBentoCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Sales Dashboard</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goal Progress Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-medium">{goalLabel}</span>
            </div>
            <span className="text-xs font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <BlurredAmount>${currentRevenue.toLocaleString()} earned</BlurredAmount>
            <BlurredAmount>${remaining.toLocaleString()} to go</BlurredAmount>
          </div>
        </div>
        
        <Separator />
        
        {/* Bento Grid: KPIs + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left: 3x2 KPI Grid */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-3">
            {/* 6 KPI cells */}
            <KPICell icon={DollarSign} value={totalRevenue} label="Total Revenue" />
            <KPICell icon={Scissors} value={serviceRevenue} label="Services" />
            <KPICell icon={ShoppingBag} value={productRevenue} label="Products" />
            <KPICell icon={CreditCard} value={totalTransactions} label="Transactions" />
            <KPICell icon={Receipt} value={averageTicket} label="Avg Ticket" />
            <KPICell icon={CalendarClock} value={tomorrowRevenue} label="Rev Tomorrow" 
                     subtitle={`${tomorrowBookings} bookings`} />
          </div>
          
          {/* Right: Sidebar (Top Performers + Revenue Mix) */}
          <div className="space-y-4 lg:border-l lg:pl-4 lg:border-border/50">
            {/* Top Performers */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-4 h-4 text-chart-4" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                  Top Performers
                </h4>
              </div>
              {/* Performer list (compact) */}
            </div>
            
            <Separator />
            
            {/* Revenue Mix Donut */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <PieChartIcon className="w-4 h-4 text-chart-2" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                  Revenue Mix
                </h4>
              </div>
              {/* Donut chart + legend */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Update `SalesTabContent.tsx`

Replace the separate components with a single `PinnableCard` wrapper:

**Current structure (lines 182-306):**
```typescript
<SalesGoalProgress ... />

<div className="grid lg:grid-cols-4 gap-6">
  <PinnableCard elementKey="sales_kpi_grid" ...>
    {/* KPI Grid */}
  </PinnableCard>
  
  <PinnableCard elementKey="sales_snapshot" ...>
    <SalesSnapshotCard ... />
  </PinnableCard>
</div>
```

**New structure:**
```typescript
<PinnableCard 
  elementKey="sales_dashboard_bento" 
  elementName="Sales Dashboard" 
  category="Analytics Hub - Sales"
>
  <SalesBentoCard
    currentRevenue={metrics?.totalRevenue || 0}
    goalTarget={currentGoal}
    goalLabel={...}
    totalRevenue={metrics?.totalRevenue || 0}
    serviceRevenue={metrics?.serviceRevenue || 0}
    productRevenue={metrics?.productRevenue || 0}
    totalTransactions={metrics?.totalTransactions || 0}
    averageTicket={metrics?.averageTicket || 0}
    tomorrowRevenue={tomorrowData?.revenue || 0}
    tomorrowBookings={tomorrowData?.appointmentCount || 0}
    performers={stylistData || []}
    isLoading={metricsLoading || stylistLoading}
  />
</PinnableCard>
```

---

## Visual Design: Bento Box Styling

| Element | Style |
|---------|-------|
| Card Container | `rounded-xl border bg-card shadow-sm` |
| Goal Progress | Full-width row at top with progress bar |
| KPI Grid | 3x2 grid with subtle `bg-muted/30` backgrounds, `rounded-lg` corners |
| Sidebar | Vertical border separator (`lg:border-l`) containing Top Performers + Revenue Mix |
| Icons | Centered above each KPI value with color coding |
| Typography | `font-display` for title, `tabular-nums` for values |

---

## Element Key Consolidation

| Before | After |
|--------|-------|
| `sales_kpi_grid` | Merged into `sales_dashboard_bento` |
| `sales_snapshot` | Merged into `sales_dashboard_bento` |
| `SalesGoalProgress` (not pinnable) | Now included in `sales_dashboard_bento` |

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | **New** - Unified bento card component |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Replace multiple components with single SalesBentoCard |

---

## Result

- **One unified bento-box card** containing:
  - Monthly Goal progress bar
  - 6 KPI metrics in a clean grid
  - Top Performers leaderboard
  - Revenue Mix donut chart
- **Single gear icon** (⚙) for pinning the entire dashboard to Command Center
- **One element key** (`sales_dashboard_bento`) for visibility management
- Clean, professional bento-box aesthetic with visual separation between sections

