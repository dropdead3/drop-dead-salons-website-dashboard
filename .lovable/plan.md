

# Sales Goal Tracker Card -- Implementation Plan

## What Gets Built
A standalone **Goal Tracker** analytics card that shows whether your organization and each location are on pace to hit weekly/monthly revenue targets. It lives in the Analytics Hub (Sales > Goals tab) and can be pinned to your Super Admin Command Center via the existing `PinnableCard` system.

## Card Surface (At a Glance)

- **Period toggle**: Switch between Weekly and Monthly goal views
- **Organization progress ring**: Visual arc showing total revenue vs. target with percentage
- **Pace status badge**: "Ahead", "On Track", or "Behind" with color coding
- **Projected end-of-period revenue**: Based on current daily run rate across open business days
- **Location scoreboard**: Each active location as a compact row with mini progress bar, percentage, and pace indicator -- sorted "most behind first" so problem areas are immediately visible

## Drill-Down Panels (Click to Expand)

### 1. Location Deep Dive
Click any location row to expand:
- Revenue earned vs. target for that location
- Daily run rate vs. required daily rate
- Open days remaining (holiday/closure-aware)
- "Get back on track" button invoking Zura AI recovery plan (reuses existing `SalesGoalProgress` recovery flow)

### 2. Pace Trend (Organization Level)
Click the main progress visual to expand:
- Recharts line chart: cumulative revenue day-by-day through the period
- "Ideal pace" reference line (diagonal from $0 to target)
- Visual shading for ahead/behind zones

### 3. Period Comparison
When Monthly is selected, show a week-by-week breakdown within the month indicating which weeks carried or underperformed

## Technical Approach

### New Files

**`src/hooks/useGoalTrackerData.ts`**
- Calls `useGoalPeriodRevenue` for org-wide and per-location revenue
- Calls `useSalesGoals` for targets (falls back to proportional split per location)
- Computes pace status, daily run rate, projected revenue, and days remaining per location
- Returns a structured object: `{ orgMetrics, locationMetrics[], period }`

**`src/components/dashboard/sales/GoalTrackerCard.tsx`**
- Main card wrapped in `PinnableCard` with `elementKey="goal_tracker"`
- Period toggle (Weekly/Monthly)
- Organization summary with progress ring and pace badge
- Location scoreboard rows
- Drill-down panels using `framer-motion` AnimatePresence
- All revenue figures wrapped in `BlurredAmount`

**`src/components/dashboard/sales/GoalPaceTrendPanel.tsx`**
- Recharts `AreaChart` showing cumulative daily revenue vs. ideal pace line
- Queries daily appointment revenue for the current goal period
- Uses the luxury glass aesthetic with translucent fills

### Modified Files

**`src/components/dashboard/analytics/SalesTabContent.tsx`**
- Import `GoalTrackerCard`
- Add it to the "Goals" sub-tab (currently only has `TeamGoalsCard`)
- Wrap in `PinnableCard` so it appears in Command Center when pinned

### Reused Patterns
- `useGoalPeriodRevenue` hook for fetching period-specific revenue from `phorest_appointments`
- `useSalesGoals` for targets and location-specific overrides
- `getOpenDaysRemaining()` logic from `SalesGoalProgress` for location-aware day counting
- `PinnableCard` + `CommandCenterVisibilityToggle` for pinning
- `BlurredAmount` / `AnimatedBlurredAmount` for privacy
- `ZuraCardInsight` for AI hover analysis
- Recovery plan flow (existing "Get back on track" button pattern)
- `framer-motion` for drill-down expansion animations

### No Database Changes Required
All data comes from existing tables (`phorest_appointments`, `locations`) and localStorage goals. No migrations needed.

