

# Remove Progress Bars from Service/Product Drill-Down

## What Changes

Remove the `<Progress>` bar from each stylist row in `ServiceProductDrilldown.tsx`. The percentage of total already appears in the text line ("6 services · 33% of total"), so the bar is redundant visual noise.

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/ServiceProductDrilldown.tsx` | Remove the `<Progress>` component rendering and its `getShareBarColor` helper function. Remove the `Progress` import. Keep the `mb-2` on the row content div reduced to `mb-0` since there's no bar below it. |

Single file, ~10 lines removed. The percentage text in the subtitle stays as-is.

