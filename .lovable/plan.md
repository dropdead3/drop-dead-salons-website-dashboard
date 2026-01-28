

# Fix Forecasting Bar Chart Appearance Consistency

## Problem

In the Forecasting chart, bars have inconsistent appearances in dark mode. The Tuesday bar appears darker than others because it has **only unconfirmed revenue** (no confirmed revenue stacked on top). 

The current implementation uses:
- Unconfirmed revenue bar: `fillOpacity={0.3}` (very light/faded)
- Confirmed revenue bar: `fillOpacity={0.85}` (solid)

When a day has no confirmed appointments, only the faded 30% opacity bar shows, creating visual inconsistency.

## Solution

Adjust the bar opacity logic so all bars appear consistent regardless of their confirmed/unconfirmed mix:

1. **Increase unconfirmed bar opacity** from 0.3 to 0.5 so it's more visible when standalone
2. **Adjust confirmed bar opacity** to 0.9 for better layering
3. **For peak bars**, keep full opacity (1.0)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/ForecastingCard.tsx` | Adjust `fillOpacity` values for both Bar components |

## Code Changes

### Update ForecastingCard.tsx (lines 389-420)

**Current:**
```tsx
{/* Unconfirmed revenue - bottom of stack, lighter opacity */}
<Bar 
  dataKey="unconfirmedRevenue" 
  stackId="revenue"
  radius={[0, 0, 0, 0]}
>
  {chartData.map((entry, index) => (
    <Cell 
      key={`unconfirmed-${index}`}
      fill={entry.isPeak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
      fillOpacity={0.3}
    />
  ))}
</Bar>
{/* Confirmed revenue - top of stack, solid */}
<Bar 
  dataKey="confirmedRevenue" 
  stackId="revenue"
  radius={[4, 4, 0, 0]}
>
  ...
  {chartData.map((entry, index) => (
    <Cell 
      key={`confirmed-${index}`}
      fill={entry.isPeak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
      fillOpacity={entry.isPeak ? 1 : 0.85}
    />
  ))}
</Bar>
```

**Updated:**
```tsx
{/* Unconfirmed revenue - bottom of stack */}
<Bar 
  dataKey="unconfirmedRevenue" 
  stackId="revenue"
  radius={[0, 0, 0, 0]}
>
  {chartData.map((entry, index) => (
    <Cell 
      key={`unconfirmed-${index}`}
      fill={entry.isPeak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
      fillOpacity={entry.isPeak ? 0.6 : 0.5}
    />
  ))}
</Bar>
{/* Confirmed revenue - top of stack, solid */}
<Bar 
  dataKey="confirmedRevenue" 
  stackId="revenue"
  radius={[4, 4, 0, 0]}
>
  ...
  {chartData.map((entry, index) => (
    <Cell 
      key={`confirmed-${index}`}
      fill={entry.isPeak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
      fillOpacity={entry.isPeak ? 1 : 0.9}
    />
  ))}
</Bar>
```

## Visual Result

All bars will now appear with consistent opacity whether they contain:
- Only confirmed revenue
- Only unconfirmed revenue  
- A mix of both

The unconfirmed portion will be slightly lighter than confirmed (50% vs 90% opacity), but still visible and consistent across all bars.

