

## Smart Bento Pairing for Dashboard Pinned Cards

### Problem
In detailed view, every pinned analytics card takes the full width of the dashboard, even when cards like "New Bookings" and "Goal Tracker" don't need that space. They end up stretched with excessive whitespace inside.

### Solution
Add a **size hint** (`'half' | 'full'`) to each pinnable card definition, then group consecutive `half`-sized cards into side-by-side pairs when rendering in detailed mode. Cards marked `full` always get their own row.

### Size Classification

| Card | Size | Reason |
|------|------|--------|
| Sales Overview | full | Wide chart + breakdowns |
| Revenue Breakdown | half | Donut chart, compact |
| Top Performers | half | Ranked list, narrow |
| Revenue Forecast | full | Trend chart, needs width |
| Team Goals | half | Progress bars, compact |
| Goal Tracker | half | Radial gauge, compact |
| New Bookings | half | Metric + pipeline, compact |
| Client Funnel | half | Vertical funnel, narrow |
| Operations Stats | full | Multi-KPI row |
| Capacity Utilization | full | Bar chart, needs width |
| Stylist Workload | half | Compact grid |
| Staffing Trends | full | Line chart, needs width |
| Hiring Capacity | half | Metric card, compact |
| Executive Summary | full | Wide summary |
| Client Health | half | Segments, compact |
| Daily Brief | full | Text-heavy, needs width |
| Operational Health | half | Score card, compact |
| Locations Rollup | full | Table with drilldown |
| Service Mix | half | Donut/list, compact |
| Retail Effectiveness | half | Metric card, compact |
| Rebooking | half | Rate + bar, compact |
| Client Experience Staff | full | Table view |

### How Pairing Works

When rendering in detailed mode, the engine scans the ordered list of visible pinned cards and groups them:

```text
Input order:  [new_bookings(half), goal_tracker(half), sales_overview(full), top_performers(half), revenue_breakdown(half)]

Output rows:
  Row 1: [new_bookings] [goal_tracker]     <- two halves paired
  Row 2: [sales_overview]                  <- full, own row
  Row 3: [top_performers] [revenue_breakdown] <- two halves paired
```

If a `half` card has no adjacent `half` partner, it renders full-width on its own (no awkward half-empty rows).

### Drag-and-Drop Compatibility

Reordering still works because the user reorders by card ID in the customize drawer. The pairing logic runs at render time based on the final ordered list -- it doesn't change the stored order, just how cards are visually grouped.

### Technical Changes

**1. `src/components/dashboard/DashboardCustomizeMenu.tsx`**
- Add a `size: 'half' | 'full'` field to each entry in `PINNABLE_CARDS`
- Export a helper: `getCardSize(cardId: string): 'half' | 'full'`

**2. `src/pages/dashboard/DashboardHome.tsx`**
- In the detailed-mode rendering block (around lines 767-803), instead of rendering each pinned card individually, collect visible pinned cards into a list, then group them using a pairing algorithm:
  - Walk the list; when two consecutive `half` cards appear, wrap them in a `flex` row
  - `full` cards get their own row
  - A lone trailing `half` card gets its own row
- The filter bar still renders once before the first pinned card group

**3. `src/components/dashboard/PinnedAnalyticsCard.tsx`**
- No changes needed to the card component itself -- sizing is handled by the parent container (`flex-1` in a flex row for halves, or full-width div for fulls)

This approach is purely a rendering-time grouping. It respects the user's drag-and-drop order, works with the existing visibility system, and doesn't require any database changes.
