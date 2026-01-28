
# Fix Revenue Trend Chart Field Mismatch

## Problem

The Revenue Trend chart appears empty because there's a **field name mismatch** between the data source and the chart:

| Component | Field Name Used |
|-----------|-----------------|
| `useSalesTrend` hook (data source) | `revenue` |
| AreaChart in SalesTabContent | `totalRevenue` |

The data exists (19 appointments worth $1,922 for today), but the chart can't find `totalRevenue` because the hook returns `revenue`.

---

## Solution

Update the chart's `dataKey` to match the hook's output. Change:

```tsx
// Current (broken)
<Area 
  type="monotone" 
  dataKey="totalRevenue"  // ← Looking for wrong field
  ...
/>
```

To:

```tsx
// Fixed
<Area 
  type="monotone" 
  dataKey="revenue"  // ← Match the hook's output
  ...
/>
```

---

## File to Modify

**File:** `src/components/dashboard/analytics/SalesTabContent.tsx`

**Line 270:** Change `dataKey="totalRevenue"` to `dataKey="revenue"`

---

## Visual Result

After the fix, the Revenue Trend chart will properly display the revenue data:

```text
┌────────────────────────────────────────────────────────────────┐
│  REVENUE TREND                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │     $2k ─────────────────────────■───────────────────    │  │
│  │                                                          │  │
│  │     $1k ─────────────────────────────────────────────    │  │
│  │                                                          │  │
│  │      $0 ─────────────────────────────────────────────    │  │
│  │                                    Jan 28                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Note: When viewing a single day ("Today"), the chart will show just one data point. For better visualization, a longer date range (7d, 30d, etc.) will show a trend line across multiple days.
