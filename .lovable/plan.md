

# Smart Pace Tracker: Open Days Only

## What Changes

The pace tracker's "$/day needed to hit goal" will calculate using only **open business days** remaining in the period, instead of all calendar days. This means the daily target is realistic and actionable.

Example: If there are 4 calendar days left in the week but the salon is closed Sunday and Monday, the pace tracker divides by 2 open days instead of 4 -- giving you the real number you need to hit each working day.

---

## How It Works

The system already stores each location's operating schedule (`hours_json`) and holiday closures (`holiday_closures`). The pace tracker will now use this data to count only open days.

---

## Technical Details

### 1. New Utility: `getOpenDaysRemaining`
**File:** `src/components/dashboard/sales/SalesGoalProgress.tsx`

Replace the simple `getRemainingDays()` function with a smarter version that:
- Accepts an optional `hoursJson` and `holidayClosures` from the location
- Iterates through each remaining day in the period
- Checks if that day is closed (via `hours_json` day-of-week flags) or a holiday (via `holiday_closures` date list)
- Counts only open days
- Falls back to calendar days if no location hours data is provided (e.g., "All Locations" filter)

### 2. Update `SalesGoalProgress` Props
**File:** `src/components/dashboard/sales/SalesGoalProgress.tsx`

Add optional props:
- `hoursJson` -- the selected location's operating hours
- `holidayClosures` -- the selected location's holiday closure dates

These are already available wherever `SalesGoalProgress` is rendered because the location data is fetched by parent components.

### 3. Pass Location Data from Parent
**Files:** Parent components that render `SalesGoalProgress` (e.g., Sales Overview card, Weekly Goal card)

- When a specific location is selected, pass that location's `hours_json` and `holiday_closures` to `SalesGoalProgress`
- When "All Locations" is selected, omit these props (falls back to calendar days, since different locations have different schedules)

### 4. Updated Pace Display

The displayed "$/day needed" message will also clarify the basis:
- With location data: "$2,050/day needed (2 open days left)"
- Without location data (all locations): "$1,025/day needed" (unchanged, calendar-based)

This keeps the UX informative without adding clutter.
