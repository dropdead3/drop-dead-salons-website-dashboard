

# Staff-Level Retail Goal Setting — Bottom-Up Goal Architecture

## Problem

Organizational retail goals are set top-down with no connection to what individual stylists and front desk staff are actually committing to. This creates disconnect, lack of ownership, and goals that feel arbitrary. Staff have a personal goals card on their Stats page, but it only covers general service revenue — retail is missing entirely.

## Solution

Add retail-specific goal fields to the existing personal goals system, then aggregate staff commitments upward to form the organizational retail target automatically. The org goal becomes the sum of what each staff member commits to, creating alignment and accountability.

---

## How It Works

**For staff (stylists and front desk):**
- The existing "My Personal Goals" card on the Stats page gets two new fields: **Monthly Retail Target** and **Weekly Retail Target**
- Staff set their own retail sales commitment alongside their existing service goals
- A brief note field is already available for motivation or context

**For managers and owners:**
- The Retail Goal Tracker card in the analytics hub shows the **aggregated total** of all staff retail goals as the org target
- A drill-down shows each staff member's individual retail commitment and progress
- If a manager wants to override and set a top-down target, they still can — but the card will show how that compares to what staff have actually committed

**The roll-up logic:**
- Org retail goal = sum of all staff monthly retail targets (for the current period)
- If a top-down `retail_sales_goals` record also exists, the card shows both: "Staff committed: $X" vs "Org target: $Y" so the gap is visible
- If no top-down goal exists, the staff aggregate becomes the de facto target

---

## Changes Required

### 1. Database: Add retail columns to `stylist_personal_goals`

Add two new columns to the existing table:
- `retail_monthly_target` (numeric, default 0)
- `retail_weekly_target` (numeric, default 0)

No new tables needed. This keeps the data model clean — one row per staff member with all their goal dimensions.

### 2. Update the Personal Goals Card

Expand the edit form in `PersonalGoalsCard` to include:
- **Retail Monthly Target** (dollar input)
- **Retail Weekly Target** (dollar input)

Displayed alongside existing service goals in a clear two-section layout:
- Section 1: Service Revenue (existing monthly/weekly)
- Section 2: Retail Revenue (new monthly/weekly)

Each section shows its own progress bar when not editing.

### 3. New Hook: `useAggregatedRetailGoals`

A new hook that:
- Queries all `stylist_personal_goals` rows for the current organization
- Sums `retail_monthly_target` and `retail_weekly_target` across all staff
- Returns per-staff breakdown with their current retail revenue progress
- Compares against any existing `retail_sales_goals` org-level record

### 4. Update the Retail Goal Tracker Card

Replace the current top-down-only display with a dual view:
- **Primary ring**: Progress against the staff-aggregated total
- **Secondary comparison**: If a top-down target exists, show "Org target: $X vs Staff committed: $Y"
- **Staff breakdown table**: Each staff member's retail goal and current progress, sorted by furthest behind
- A banner if the aggregate is significantly below any top-down target: "Staff commitments are $Z below the organizational target — consider reviewing with your team"

### 5. Update `useStylistPersonalGoals` Hook

Add the two new fields to the existing upsert mutation and query return type.

---

## Technical Details

### Migration SQL
```sql
ALTER TABLE public.stylist_personal_goals
  ADD COLUMN retail_monthly_target NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN retail_weekly_target NUMERIC DEFAULT 0 NOT NULL;
```

### Updated `PersonalGoalsCard` Layout (edit mode)
```
Service Revenue
  [Monthly Target $___]  [Weekly Target $___]

Retail Revenue
  [Monthly Target $___]  [Weekly Target $___]

Notes / Motivation
  [_________________________________]
```

### Updated `PersonalGoalsCard` Layout (view mode)
```
SERVICE                          RETAIL
Monthly: $2,400 / $5,000         Monthly: $180 / $500
[==========------]               [=====----------]
Weekly: $600 / $1,250             Weekly: $45 / $125
[==========------]               [=====----------]
```

### `useAggregatedRetailGoals` Hook
```typescript
// Fetches all stylist_personal_goals for the org
// Joins with employee_profiles to get names
// Returns:
// - totalMonthlyCommitment: sum of all retail_monthly_target
// - totalWeeklyCommitment: sum of all retail_weekly_target  
// - staffBreakdown: [{ userId, name, retailMonthlyTarget, currentRetailRevenue, progressPct }]
// - orgTopDownTarget: from retail_sales_goals if exists
// - gap: orgTopDownTarget - totalMonthlyCommitment (if top-down exists)
```

### Retail Goal Tracker Card Updates
- Use `useAggregatedRetailGoals` as primary data source
- Progress ring targets the aggregated staff total (not top-down)
- Staff breakdown rows with individual progress bars
- Gap alert banner when staff commitments trail org target by more than 10%
- Lever recommendation updates: "3 team members haven't set retail goals yet" or "Sarah's retail goal is 40% below her historical average"

### Files Modified
- `supabase/migrations/` — new migration for columns
- `src/hooks/useStylistPersonalGoals.ts` — add retail fields
- `src/components/dashboard/sales/PersonalGoalsCard.tsx` — add retail section
- `src/hooks/useAggregatedRetailGoals.ts` — new hook (aggregation logic)
- `src/components/dashboard/analytics/RetailAnalyticsContent.tsx` — update Retail Goal Tracker card

### Files Created
- `src/hooks/useAggregatedRetailGoals.ts`

