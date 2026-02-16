

# Show "All Closed" Empty State on Sales Overview

## What Changes

When viewing a single-day period (Today or Yesterday) and **every** location is closed, replace the entire card body with a calm, centered empty state instead of showing rows of $0 metrics. The header (title, badge, filters, export) remains unchanged.

## Layout

The current main content grid (hero revenue block, services/products sub-cards, KPI tiles row, sidebar) will be conditionally replaced with:

```text
+--------------------------------------------------+
|  [Moon icon, large]                               |
|                                                   |
|  All locations closed today                       |
|  No sales activity — all 2 locations are          |
|  closed today.                                    |
+--------------------------------------------------+
```

- Moon icon: `w-10 h-10`, muted foreground
- Title: `font-display text-lg`, e.g. "All locations closed today"
- Subtitle: `text-sm text-muted-foreground`, e.g. "No sales activity -- all X locations are closed today."
- Centered vertically with generous padding (`py-16`)
- Contained within the same `bg-muted/30 dark:bg-card rounded-xl border` wrapper used by the hero section, so it feels native

## Logic

Compute an `allLocationsClosed` boolean once (near the existing `hasNoData` logic, around line 466):

```
const isSingleDay = dateRange === 'today' || dateRange === 'yesterday';
const allLocationsClosed = isSingleDay && hasNoData 
  && (locations?.length ?? 0) > 0 
  && locations!.every(loc => 
    isClosedOnDate(loc.hours_json, loc.holiday_closures, 
      dateRange === 'yesterday' ? subDays(new Date(), 1) : new Date()
    ).isClosed
  );
```

Then wrap the main content grid (lines ~538-900+) in a conditional:
- If `allLocationsClosed`: render the empty state
- Otherwise: render the existing content (unchanged)

## File Changed

**`src/components/dashboard/AggregateSalesCard.tsx`** only.

1. Compute `allLocationsClosed` as a `useMemo` near the top of the render logic
2. After the header `</div>` (line ~536), add: `{allLocationsClosed ? (<AllClosedEmptyState />) : (<existing main content grid>)}`
3. The empty state is a simple inline JSX block (no separate component file needed -- it's ~15 lines)

The "Closed" badge in the header (line 466-477) already handles this case, so it will still show "Closed" next to the title. The two work together: badge signals status at a glance, empty state replaces the noise of $0 metrics.
