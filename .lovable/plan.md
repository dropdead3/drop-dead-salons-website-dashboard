
# Add Green Dot Legend to Busiest Day Callout

## Overview

Add a small green dot next to the "Busiest day:" label to create a visual legend that clearly connects the label to the green-highlighted bar in the chart.

## Visual Change

| Before | After |
|--------|-------|
| `Busiest day: Thursday` | `● Busiest day: Thursday` |

The dot will use the same green color (`chart-2`) as the highlighted bar, making the connection intuitive.

## Files to Modify

### 1. `src/components/dashboard/sales/WeekAheadForecast.tsx`

**Lines 276-278** - Add green dot before the label:

```typescript
<span className="text-muted-foreground flex items-center gap-2">
  <span className="w-2 h-2 rounded-full bg-chart-2" />
  Busiest day: <span className="font-medium text-foreground">{format(parseISO(peakDay.date), 'EEEE')}</span>
</span>
```

### 2. `src/components/dashboard/sales/ForecastingCard.tsx`

**Lines 666-667** - Add the same green dot:

```typescript
<span className="text-muted-foreground flex items-center gap-2">
  <span className="w-2 h-2 rounded-full bg-chart-2" />
  Busiest day: <span className="font-medium text-foreground">{format(parseISO(peakDay.date), 'EEEE')}</span>
</span>
```

## Result

The small green dot next to the "Busiest day:" text creates an immediate visual connection to the green bar in the chart, serving as an intuitive legend that explains the color coding without needing additional text.
