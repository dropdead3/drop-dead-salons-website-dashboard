

# Drill-Down Panels for Aggregate Sales Card + Command Center Polish

## Overview

Adding three interactive drill-down panels to the **Transactions**, **Avg Ticket**, and **Rev/Hour** stat cards in the AggregateSalesCard, plus a few usability enhancements to elevate the overall analytical experience.

## Three Drill-Downs

### 1. Transactions: Volume by Hour of Day
**What it shows:** A horizontal bar chart of transaction counts grouped by hour (8 AM - 8 PM), revealing peak checkout windows.
- Highlights the **peak hour** with a badge
- Shows **average transactions/hour** as a reference line
- Helps identify staffing gaps and scheduling opportunities

### 2. Avg Ticket: Distribution Histogram
**What it shows:** Ticket values bucketed into ranges ($0-50, $50-100, $100-150, $150-200, $200+), with a visual bar for each bucket.
- Displays **median vs. average** comparison (the gap reveals skew from high-value tickets)
- Flags the **most common bucket** as the "sweet spot"
- Surfaces the percentage of tickets above vs. below average to identify upsell headroom

### 3. Rev/Hour: Efficiency by Stylist
**What it shows:** Each stylist's revenue-per-hour compared against the salon average.
- Horizontal comparison bars (stylist value vs. salon average line)
- Sorted highest to lowest
- Highlights stylists above/below average with subtle color coding
- Identifies coaching opportunities (below avg) and top performers (above avg)

## Interaction Pattern

All three follow the **exact same pattern** already established by the Tips and Forecasting drill-downs:
- Click the stat card to toggle the panel open/close
- Card gets a `border-primary/50 ring-1 ring-primary/20` active state
- ChevronDown icon rotates on expand
- Panel uses `framer-motion` AnimatePresence for smooth expand/collapse
- Only one drill-down open at a time (clicking one closes the others)

## Additional Usability Enhancements

1. **Mutual exclusivity**: Clicking Transactions closes Avg Ticket and Rev/Hour (and vice versa) to keep the interface clean
2. **Consistent empty states**: Each panel gracefully handles zero-data scenarios with a minimal message
3. **BlurredAmount integration**: All revenue figures respect the hide-numbers privacy toggle already in use

## Technical Details

### New Components
- `src/components/dashboard/sales/TransactionsByHourPanel.tsx` -- horizontal bars by hour
- `src/components/dashboard/sales/TicketDistributionPanel.tsx` -- histogram buckets + median/avg comparison
- `src/components/dashboard/sales/RevPerHourByStylistPanel.tsx` -- stylist efficiency comparison

### Data Sources
- **Transactions by Hour**: Query `phorest_transaction_items` grouped by `extract(hour from transaction_date)`, filtered by existing date range and location. Reuses the same pattern as `usePeakHoursAnalysis`.
- **Ticket Distribution**: Derive from existing `useSalesMetrics` transaction data or query `phorest_daily_sales_summary` for per-transaction totals. Bucket client-side.
- **Rev/Hour by Stylist**: Combine `useSalesByStylist` revenue data with service hours from appointments to calculate per-stylist rev/hour.

### Modified Files
- `src/components/dashboard/AggregateSalesCard.tsx` -- Add click handlers to Transactions/Avg Ticket/Rev/Hour stat cards (same pattern as Tips), add state management, render the three new panels below the secondary KPI row
- New hooks as needed for hourly transaction data

### Hooks
- `useTransactionsByHour(dateFrom, dateTo, locationId)` -- new hook querying hourly transaction counts
- `useTicketDistribution(dateFrom, dateTo, locationId)` -- new hook for ticket value bucketing
- Stylist rev/hour reuses existing `useSalesByStylist` + service hours data

All panels follow existing design patterns: `framer-motion` animations, `bg-muted/30` row backgrounds, `text-xs tracking-wide uppercase` section headers with the decorative dot, and `BlurredAmount` for financial values.

