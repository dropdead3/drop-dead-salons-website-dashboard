

# Add Daily Average Reference Line to Forecasting Chart

## Overview

Add a horizontal dashed reference line across the bar chart indicating the daily average revenue. This line will be labeled on the left side with "Daily Avg" and the dollar amount, creating a visual benchmark that helps users quickly compare each day's performance against the average.

## Visual Design

```text
                                                    
         $1.9k           $1.6k    $2.0k    $1.6k    $1.0k
           ▓▓▓▓           ▓▓▓▓     ████     ▓▓▓▓     ▓▓▓▓
           ▓▓▓▓           ▓▓▓▓     ████     ▓▓▓▓     ▓▓▓▓
  ─ ─ ─ ─ ─▓▓▓▓─ ─ ─ ─ ─ ─▓▓▓▓─ ─ ─████─ ─ ─▓▓▓▓─ ─ ─ ─ ─ ─   ← Daily Avg: $1,146
           ▓▓▓▓           ▓▓▓▓     ████     ▓▓▓▓     ▓▓▓▓
           ▓▓▓▓           ▓▓▓▓     ████     ▓▓▓▓     
           Tue            Wed      Thu      Fri      Sat
```

**Key features:**
- Dashed horizontal line at the average value
- Positioned behind bars but clearly visible
- Subtle muted color that doesn't distract from bar data
- Left-side label showing "Daily Avg" with the dollar amount

## Technical Changes

### File: `src/components/dashboard/sales/ForecastingCard.tsx`

**1. Update Recharts import (Line 22-31)**

Add `ReferenceLine` to the existing import:

```typescript
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList,
  ReferenceLine  // Add this
} from 'recharts';
```

**2. Add ReferenceLine to the BarChart (Lines 549-610)**

Insert the ReferenceLine component right after the YAxis element and before the Bars, only showing for daily view periods (7 Days, EOM):

```typescript
<BarChart data={chartData} margin={{ top: 25, right: 5, bottom: showWeeklyChart ? 40 : 35, left: 5 }}>
  <XAxis ... />
  <YAxis hide domain={[0, 'auto']} />
  
  {/* Daily average reference line - only for daily views */}
  {!showWeeklyChart && averageDaily > 0 && (
    <ReferenceLine 
      y={averageDaily} 
      stroke="hsl(var(--muted-foreground))" 
      strokeDasharray="4 4"
      strokeWidth={1.5}
      label={{
        value: `Daily Avg: $${Math.round(averageDaily).toLocaleString()}`,
        position: 'insideBottomLeft',
        fill: 'hsl(var(--muted-foreground))',
        fontSize: 11,
        fontWeight: 500,
        offset: 4,
      }}
    />
  )}

  <Tooltip ... />
  <Bar dataKey="unconfirmedRevenue" ... />
  <Bar dataKey="confirmedRevenue" ... />
</BarChart>
```

**3. Weekly average line for 30/60 day views**

For weekly chart views, add a similar line showing "Weekly Avg":

```typescript
{showWeeklyChart && averageWeekly > 0 && (
  <ReferenceLine 
    y={averageWeekly} 
    stroke="hsl(var(--muted-foreground))" 
    strokeDasharray="4 4"
    strokeWidth={1.5}
    label={{
      value: `Weekly Avg: $${Math.round(averageWeekly).toLocaleString()}`,
      position: 'insideBottomLeft',
      fill: 'hsl(var(--muted-foreground))',
      fontSize: 11,
      fontWeight: 500,
      offset: 4,
    }}
  />
)}
```

## Design Details

| Property | Value | Reason |
|----------|-------|--------|
| Line style | Dashed (`4 4`) | Distinguishes from bar edges, looks elegant |
| Color | `muted-foreground` | Subtle, doesn't compete with bars |
| Stroke width | `1.5px` | Visible but not heavy |
| Label position | `insideBottomLeft` | Positioned on chart area, left-aligned |
| Font size | `11px` | Readable but compact |

## Result

The horizontal reference line will provide immediate visual context for comparing daily/weekly performance against the average. Users can instantly see which days exceed or fall below average, reinforcing the data already shown in the "Daily Avg" stat card while adding spatial context within the chart itself.

