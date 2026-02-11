

## Add Top Padding to Expanded Location Detail Grid

### The Issue
The expanded detail area (Services, Products, Transactions cards) sits too close to the location header row ("North Mesa / $1,146"). The current top padding is `pt-1` (4px), which looks cramped compared to the `gap-3` (12px) spacing between the analytic cards themselves.

### The Fix
In `src/components/dashboard/AggregateSalesCard.tsx`, line 709, change the inner container padding from `pt-1` to `pt-3` so the spacing above the cards visually matches the gap between them and the rest of the bento grid.

### What Changes
**File:** `src/components/dashboard/AggregateSalesCard.tsx` (line 709)
- Change: `className="px-4 pb-4 pt-1"` to `className="px-4 pb-4 pt-3"`

This is a single class change -- no logic or layout changes needed.

