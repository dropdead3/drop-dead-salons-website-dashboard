
# Add Left Margin for Daily Average Labels

## Problem
The bar charts span the full width with `YAxis hide` and only 5px left margin, so the "Daily Avg: $X,XXX" label on the orange reference line gets cramped/clipped against the left edge.

## Solution
Increase the left margin of the `BarChart` components and show a minimal YAxis with currency formatting. This creates natural space on the left for the reference line label to display clearly.

## Changes

### 1. `src/components/dashboard/sales/ForecastingCard.tsx`
- Change `BarChart` margin from `left: 5` to `left: 45`
- Un-hide the `YAxis`: replace `<YAxis hide domain={[0, 'auto']} />` with a visible YAxis showing abbreviated dollar amounts (e.g. "$1k", "$2k") in small font, no axis line or tick lines

### 2. `src/components/dashboard/sales/WeekAheadForecast.tsx`
- Same changes: increase left margin to 45 and show a minimal YAxis with dollar formatting

### YAxis Style
```tsx
<YAxis 
  domain={[0, 'auto']}
  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
  tickLine={false}
  axisLine={false}
  width={40}
/>
```

This gives the chart breathing room on the left so the orange daily average label and amount are clearly visible without overlapping bars.
