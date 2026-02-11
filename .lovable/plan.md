

# Pre-select Location Filter and Add Context Label

## What Changes

Two small updates to `ServiceProductDrilldown.tsx`:

### 1. Initialize location filter from parent dashboard filter

Currently `filterLocationId` always starts as `'all'`, ignoring the dashboard's active location filter. Fix: initialize the state from `parentLocationId` so when a user has "Downtown Salon" selected on the dashboard and opens the drill-down, it opens pre-filtered to that location.

- Change `useState('all')` to `useState(parentLocationId || 'all')`
- Also reset to the parent value (not just `'all'`) when the dialog closes

### 2. Add contextual label next to the filter

When the drill-down opens with a pre-selected location (inherited from the dashboard), show a small muted text label:

```
[Downtown Salon v]  Filtered from Command Center
```

- Only visible when `parentLocationId` exists and is not `'all'`
- Uses `text-[10px] text-muted-foreground` styling for subtlety
- Disappears if the user manually changes the filter to something else

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/ServiceProductDrilldown.tsx` | Initialize `filterLocationId` from `parentLocationId`, add context label text next to the location Select |

Single file, roughly 5 lines changed.

