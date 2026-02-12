

# Sales Overview Goal Widget -- Drill-Down Enhancement

## Current State
The Aggregate Sales Card (Sales Overview) has an inline `SalesGoalProgress` widget showing:
- Linear progress bar with percentage
- Pace status (Ahead / On Track / Behind)
- "Get back on track" recovery button (Behind only)

The new standalone `GoalTrackerCard` in the Goals tab provides the full experience: progress ring, location scoreboard, pace trend chart, and location deep dives.

## What Changes

### Keep the compact widget, add a drill-down gateway
The inline `SalesGoalProgress` stays as-is for quick-glance value, but gains a clickable affordance that expands a **location breakdown panel** directly beneath it -- matching the existing drill-down pattern used by Transactions, Avg Ticket, and Rev/Hour panels on the same card.

### Drill-Down Content (When Expanded)
- **Per-location mini rows**: Each active location with a slim progress bar, percentage, and pace badge (Ahead/On Track/Behind)
- **Sorted "most behind first"** -- consistent with the Goal Tracker card
- **"View full breakdown" link** at the bottom that navigates to Analytics Hub > Sales > Goals tab
- Reuses `useGoalTrackerData` hook for location scaffold data and `useGoalPeriodRevenue` per location

### Interaction Pattern
- Add the goal section to the existing mutually exclusive drill-down toggle state (`drilldownMode`) on the Aggregate Sales Card
- Clicking the goal progress area toggles open the location breakdown
- Opening it closes any other active drill-down (Transactions, Avg Ticket, Rev/Hour)
- Uses `framer-motion` AnimatePresence for expansion, matching existing panels

## Technical Details

### Modified Files

**`src/components/dashboard/AggregateSalesCard.tsx`**
- Extend `drilldownMode` state to include `'goals'` as a valid value
- Wrap the `GoalProgressWithOwnRevenue` section in a clickable container that toggles `drilldownMode` to `'goals'`
- Render a new `GoalLocationsDrilldown` panel when `drilldownMode === 'goals'`

**`src/components/dashboard/sales/GoalLocationsDrilldown.tsx`** (New File)
- Receives `period` ('weekly' | 'monthly') and `target` from parent
- Uses `useGoalTrackerData` to get `locationScaffold`
- For each location, renders a `GoalLocationMiniRow` with its own `useGoalPeriodRevenue` call
- Includes a "View full breakdown" link that navigates to the Goals tab
- Sorted by percentage ascending (most behind first)
- Wrapped in `framer-motion` for smooth expand/collapse

**`src/components/dashboard/sales/SalesGoalProgress.tsx`**
- Add an optional `onClick` prop so the parent card can wire up the drill-down toggle
- Add a subtle visual cue (chevron or "by location" label) indicating it's expandable

### No Database Changes Required
All data comes from existing hooks and tables.

