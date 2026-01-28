
# Add "Single Data Point" Prompt to Revenue Trend Card

## Problem

When the date filter is set to "Today", the Revenue Trend chart only shows a single data point, which doesn't provide much trend insight. Users need guidance to expand the date range for better visualization.

---

## Solution

Add a contextual prompt overlay on the Revenue Trend card when `filters.dateRange` is `'today'` or `'yesterday'` (single-day ranges). The prompt will suggest changing the filter to see more data points.

---

## Visual Design

```text
┌────────────────────────────────────────────────────────────────┐
│  REVENUE TREND                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                            ●                             │  │
│  │     $2k ─────────────────────────────────────────────    │  │
│  │                                                          │  │
│  │   ┌────────────────────────────────────────────────┐     │  │
│  │   │  📈 Only one data point for today              │     │  │
│  │   │  Adjust the date range filter above            │     │  │
│  │   │  to see revenue trends over time               │     │  │
│  │   └────────────────────────────────────────────────┘     │  │
│  │                                                          │  │
│  │      $0 ─────────────────────────────────────────────    │  │
│  │                          Jan 28                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### File: `src/components/dashboard/analytics/SalesTabContent.tsx`

Add a helper variable to detect single-day ranges:

```tsx
const isSingleDayRange = filters.dateRange === 'today' || filters.dateRange === 'yesterday';
```

Then add a conditional overlay inside the Revenue Trend card, below the chart:

```tsx
<CardContent>
  <div className="h-[300px] relative">
    {trendLoading ? (
      // ...loading state
    ) : (
      <>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {/* ...existing chart content */}
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Single day prompt */}
        {isSingleDayRange && chartData.length <= 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card/95 backdrop-blur-sm border rounded-lg px-4 py-3 text-center max-w-xs shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Single data point</span>
                <br />
                Adjust the date range filter above to see revenue trends over time
              </p>
            </div>
          </div>
        )}
      </>
    )}
  </div>
</CardContent>
```

---

## Changes Summary

| File | Change |
|------|--------|
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Add `isSingleDayRange` check and overlay prompt when viewing single-day data |

---

## Behavior

| Date Range | Data Points | Shows Prompt? |
|------------|-------------|---------------|
| Today | 1 | Yes |
| Yesterday | 1 | Yes |
| Last 7 Days | 7 | No |
| This Month | ~28-31 | No |
| MTD | Variable | No (unless month just started) |

The prompt is non-blocking (uses `pointer-events-none`) so users can still hover over the chart data point if desired.
