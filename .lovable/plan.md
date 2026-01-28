

# Replace Location Comparison Bars with Donut Chart

## Overview

Remove the redundant horizontal bar comparison and replace it with a compact donut chart that visually represents each location's share of total revenue.

---

## Current Problem

| Element | Issue |
|---------|-------|
| Side-by-side cards | Already show share % with progress bars |
| Bottom horizontal bars | Repeat the same data, scaled to max revenue instead of total |
| User confusion | "What do these bars mean?" - not immediately clear |

---

## Proposed Solution

Replace the bottom bars (lines 145-166) with a centered donut chart showing revenue share per location.

### Visual Layout

```text
┌─────────────────────────────────────────────────────────┐
│  LOCATION COMPARISON                      $1,896 TOTAL  │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────────────┐ │
│  │ North Mesa         │  │ Val Vista Lakes            │ │
│  │ $1,176    [Leader] │  │ $720             [-63%]    │ │
│  │ ████████████░░ 62% │  │ █████████░░░░░░░ 38%       │ │
│  │ 8 Svcs │ 0 Prod    │  │ 11 Svcs │ 0 Prod           │ │
│  └────────────────────┘  └────────────────────────────┘ │
│                                                         │
│              ┌─────────────────────┐                    │
│              │     DONUT CHART     │                    │
│              │   ● North Mesa 62%  │                    │
│              │   ● Val Vista  38%  │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Add Recharts PieChart Import

```typescript
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
```

### 2. Define Color Palette

Use existing chart color tokens from the design system:

```typescript
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];
```

### 3. Prepare Chart Data

```typescript
const chartData = useMemo(() => {
  return sortedLocations.map((location, idx) => ({
    name: location.name,
    value: location.totalRevenue,
    percentage: totalRevenue > 0 
      ? ((location.totalRevenue / totalRevenue) * 100).toFixed(0)
      : 0,
    color: COLORS[idx % COLORS.length],
  }));
}, [sortedLocations, totalRevenue]);
```

### 4. Replace Bottom Bars with Donut Chart

Remove lines 145-166 and replace with:

```tsx
{/* Revenue Share Donut Chart */}
<div className="flex items-center justify-center gap-6">
  <div className="w-32 h-32">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={50}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
  
  {/* Legend */}
  <div className="space-y-2">
    {chartData.map((entry) => (
      <div key={entry.name} className="flex items-center gap-2 text-sm">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: entry.color }} 
        />
        <span className="text-muted-foreground">{entry.name}</span>
        <span className="font-display">{entry.percentage}%</span>
      </div>
    ))}
  </div>
</div>
```

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/LocationComparison.tsx` | Add Recharts imports, add chart data memo, replace bar section with donut chart |

---

## User Experience

| Before | After |
|--------|-------|
| Confusing horizontal bars | Clear donut showing proportions |
| Redundant data display | Single unified visualization |
| "What does this mean?" | Instantly recognizable pie/donut format |

---

## Why Donut Over Pie

- **Donut** is more modern and less visually heavy
- Center can potentially show total revenue in the future
- Works better in compact spaces
- Matches the aesthetic of other charts in the dashboard

