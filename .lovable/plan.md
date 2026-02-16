

## Anchor "View" Links to Bottom-Right of KPI Cards

### Problem
The "View Sales >", "View Team >", etc. links sit at different vertical positions across the KPI tiles because each card has varying amounts of content (some have change badges, some have subtitles, some have neither). This creates an uneven, messy layout.

### Solution
Make each KPI tile a full-height flex column and push the drill-down link to the bottom-right corner using `mt-auto` and `ml-auto`. This ensures all "View X >" links align consistently at the bottom-right of every card, regardless of content height.

### Changes

**File: `src/components/dashboard/analytics/ExecutiveSummaryCard.tsx`**

Update the `KpiTile` component (around line 69-120):

1. Add `h-full flex flex-col` to the outer `<Link>` so it stretches to fill the grid cell height
2. Wrap the metric content (icon row, value, badges, subtitle) in a `flex-1` div so it takes up available space
3. Add `mt-auto self-end` to the drill-down link div so it anchors to the bottom-right corner

**Before:**
```text
[Icon LABEL (i)]
$315
-84.0%
View Sales >        <-- floats wherever content ends
```

**After:**
```text
[Icon LABEL (i)]
$315
-84.0%

                View Sales >   <-- always bottom-right
```

### Technical details
- Single component change in `KpiTile` function
- Link element: add `h-full flex flex-col`
- Content wrapper: wrap lines 75-113 in a `<div className="flex-1">`
- Drill-down link (line 115): change to `mt-auto self-end` to anchor bottom-right
