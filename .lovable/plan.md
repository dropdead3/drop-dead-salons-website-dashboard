

## Location Pipeline Timeline Drill-Down

### What We're Adding

When you click a location card in the Booking Pipeline view, it expands to reveal a **day-by-day area chart** spanning the full 28-day measurement window: 14 trailing days (actual) on the left, a "Today" divider in the center, and 14 forward days (pipeline) on the right. This lets you visually see where bookings are dropping off and which specific days are thin.

### Visualization Design

```text
  [Click "Downtown Dallas" card]
  ┌──────────────────────────────────────────────────────────────┐
  │  TRAILING (14d)          │ TODAY │        FORWARD (14d)       │
  │                          │      │                            │
  │  ████                    │      │                            │
  │  ██████████              │      │    ████                    │
  │  ████████████████        │      │    ██████                  │
  │  ██████████████████████  │      │    ████████                │
  │  ────────────────────────│──────│────────────────────────    │
  │  Feb 2   Feb 5   Feb 9  │Feb 16│  Feb 17  Feb 21  Feb 28   │
  │                          │      │                            │
  │  Trailing avg: 4.2/day       Forward avg: 2.1/day           │
  └──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Recharts AreaChart** with a vertical `ReferenceLine` at today's date, splitting the view into trailing (muted fill, dashed stroke) and forward (primary fill, solid stroke) -- matching the `DualPeriodOverlay` pattern already in the codebase
- The trailing area uses `hsl(var(--muted-foreground))` fill; the forward area uses the location's status color (red/amber/green) so you instantly see whether the pipeline is healthy
- **framer-motion** expand/collapse animation on the card (matching existing drill-down patterns)
- Summary stats below the chart: Trailing daily avg, Forward daily avg, and the specific days with zero bookings highlighted
- Uses the `appointments` table, querying `appointment_date` grouped by day for the selected `location_id`

### New Hook: `useLocationPipelineTimeline`

A small hook that fetches daily appointment counts for a single location across the 28-day window:
- Query: `appointments` table, select `appointment_date`, filter by `location_id`, date range -14d to +14d, exclude cancelled/no_show
- Groups by `appointment_date` client-side and fills in zero-count days
- Returns: `{ dailyCounts: Array<{ date: string; count: number; period: 'trailing' | 'forward' }>, isLoading }`
- Only fetches when the card is expanded (enabled by `isOpen` flag)

### Component: `PipelineTimelineChart`

An inline component rendered inside the expanded location card:
- Recharts `AreaChart` with two `Area` layers (trailing + forward) split by a `ReferenceLine` at today
- Custom tooltip showing date and count
- Below-chart stats: trailing avg, forward avg, empty days count
- Height: 160px (compact, inline with the card)

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useLocationPipelineTimeline.ts` | Fetches daily appointment counts for one location over 28-day window |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/analytics/BookingPipelineContent.tsx` | Add expand/collapse state to location cards; render `PipelineTimelineChart` inline when expanded; add the chart component within the file |

### Technical Details

**`useLocationPipelineTimeline` hook:**
- Parameters: `locationId: string`, `enabled: boolean`
- Queries `appointments` with `.select('appointment_date')`, filtered by location and date range (-14d to +14d), excluding cancelled/no_show
- Groups by date using a Map, fills missing dates with 0 using `eachDayOfInterval` from date-fns
- Tags each day as `'trailing'` or `'forward'` based on whether it's before or after today
- Returns sorted array of `{ date, count, period }`

**Card expansion in `BookingPipelineContent`:**
- New state: `expandedLocationId: string | null`
- Clicking a location card toggles expansion
- When expanded, renders the timeline chart with `framer-motion` `AnimatePresence` for smooth enter/exit
- The card gets a subtle border highlight when expanded

**`PipelineTimelineChart` (inline component):**
- Two `Area` components sharing the same dataKey `count` but split using custom rendering:
  - Option A: Single Area with gradient that changes color at the midpoint
  - Option B (simpler): Two data keys -- `trailingCount` and `forwardCount` where one is null when the other has a value
- `ReferenceLine` at today with label "Today"
- Tooltip: date formatted as "Mon, Feb 17" + count
- Summary row: `grid-cols-3` with Trailing Avg, Forward Avg, Empty Days

