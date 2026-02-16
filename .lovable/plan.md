

## Add Booking Pipeline Health Indicator to New Bookings Card

### Placement

Insert a compact, single-row health strip between the hero number ("9 Booked Today") and the New/Returning breakdown grid. This is the natural position: the hero tells you what happened, the pipeline tells you what's coming, and the breakdown below gives detail.

```text
  NEW BOOKINGS
  ─────────────────────────────
       9
    Booked Today

  [●] Pipeline: Healthy         18 next 14d vs 20 trailing
  ─────────────────────────────
  [ New Clients ]  [ Returning ]
       ...
```

### Design

A single horizontal bar inside a `bg-muted/30 rounded-lg border` container (matching the existing card sub-sections):

- **Left side:** A small colored dot (8px circle) + status label ("Healthy" / "Slowing" / "Critical") in `text-sm font-medium`
- **Right side:** Compact ratio text: "18 next 14d vs 20 trailing" in `text-xs text-muted-foreground tabular-nums`
- **Dot colors:** Green (`bg-emerald-500`), amber (`bg-amber-500`), red (`bg-red-500`) matching the existing threshold logic
- **Tooltip:** Explains the metric on the info icon
- **Loading state:** Skeleton matching the row height
- The entire strip is a subtle, calm signal -- no shouting, just a status light

### Why This Works

- Doesn't compete with the hero number or the New/Returning breakdown
- Forward-looking signal sits naturally between "what happened" (hero) and "who booked" (breakdown)
- Automatically appears in both the Command Center card and pinned analytics card since both render `NewBookingsCard`
- Respects the location filter already passed via `filterContext`

### Changes

**File: `src/components/dashboard/NewBookingsCard.tsx`**

1. Import `useBookingPipeline` from `@/hooks/useBookingPipeline`
2. Call `useBookingPipeline(filterContext?.locationId === 'all' ? undefined : filterContext?.locationId)` inside the component
3. Add a new section between the hero (line 78) and the New/Returning grid (line 80):
   - A `div` with `p-3 bg-muted/30 rounded-lg border border-border/50 mb-4`
   - Inside: flex row with status dot + label on left, ratio text on right
   - MetricInfoTooltip with pipeline explanation
   - Loading skeleton when `isLoading`

### Files
- **Modify**: `src/components/dashboard/NewBookingsCard.tsx` (single file change)

No new files needed -- the hook already exists and the card is already shared between Command Center and pinned contexts.

