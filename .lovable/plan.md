

## Booking Pipeline Visualization Drill-Down

### What We're Adding

An expandable visualization section above the location cards in `BookingPipelineContent` that gives enterprise operators an instant visual read on pipeline health across all locations -- without needing to scan each card individually.

### Visualization: Horizontal Bar Chart

A horizontal bar chart (matching the `StaffRevenueLeaderboard` pattern) where each bar represents a location's pipeline ratio. This is the most effective choice because:

- Locations are labeled on the Y-axis (readable even at 20+ locations)
- Bar length = ratio percentage (capped at 100% visually, label shows actual)
- Bar color = status color (red/amber/green/gray) per location
- A vertical reference line at 90% marks the "healthy" threshold
- A second subtle reference line at 70% marks the "slowing" threshold
- Sorted to match the current sort setting (severity default = worst at top)

```text
BOOKING PIPELINE
[2 Critical]  [0 Slowing]  [0 Healthy]       Sort: [Severity v]

  ┌─ Pipeline Health by Location ──────────────────────────────────┐
  │                         70%   90%                              │
  │  North Mesa      ██░░░░░│░░░░░│░░░░░░░░░░░░░░  0%            │
  │  Val Vista Lakes ██░░░░░│░░░░░│░░░░░░░░░░░░░░  0%            │
  │  Scottsdale      ███████│█████│██████░░░░░░░░  85%            │
  │  Frisco          ███████│█████│█████████████░  110%           │
  └────────────────────────────────────────────────────────────────┘

  [Location cards below...]
```

### Design Details

- Uses Recharts `BarChart` with `layout="vertical"` (same as StaffRevenueLeaderboard)
- Bar fills use the status color with luxury glass gradient opacity (0.85 to 0.5)
- Two `ReferenceLine` components at x=70 and x=90 with dashed strokes (matching forecasting chart conventions: 1px dashed, 0.5 opacity)
- Reference line labels: "Slowing" at 70, "Healthy" at 90 as small text annotations
- Custom tooltip showing location name, forward count, trailing count, ratio
- Chart height scales dynamically: `Math.max(180, locations.length * 36)` px
- Wrapped in a `Collapsible` (matching `CapacityBreakdown` pattern) so users can collapse it when they want to focus on the cards
- Default state: expanded
- Uses `framer-motion` for entrance animation

### Implementation

**File: `src/components/dashboard/analytics/BookingPipelineContent.tsx`**

1. Add Recharts imports (`BarChart`, `Bar`, `XAxis`, `YAxis`, `ReferenceLine`, `Tooltip`, `ResponsiveContainer`, `Cell`)
2. Add `Collapsible` imports
3. Add a `PipelineChart` section between the scoreboard/sort controls and the location cards
4. Chart data is derived from the same `sorted` array (already filtered and sorted)
5. Each bar's fill color is determined by status: `hsl(var(--destructive))` for critical, amber for slowing, emerald for healthy, muted for no_data
6. Custom tooltip with `bg-popover border border-border rounded-lg` styling

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/analytics/BookingPipelineContent.tsx` | Add horizontal bar chart visualization in a collapsible section above the location cards |

Single file change. No new hooks or data sources needed -- the visualization uses the same `useBookingPipelineByLocation` data already being fetched.

