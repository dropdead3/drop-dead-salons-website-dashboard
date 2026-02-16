

# Fix: Provider Revenue Bar to Show Share of Total

## Problem
The progress bar currently divides each provider's revenue by `maxRevenue` (the top provider), so the top provider always shows a full-width bar. This is misleading — it doesn't convey how much of the day's total revenue each provider represents.

## Solution
Change the bar width calculation from `group.revenue / maxRevenue` to `group.revenue / totalRevenue`, where `totalRevenue` is the sum of all filtered appointments for the day.

## File Changed
**`src/components/dashboard/sales/DayProviderBreakdownPanel.tsx`**
- Replace `const maxRevenue = groups[0]?.revenue || 1;` with `const totalRevenue = groups.reduce((sum, g) => sum + g.revenue, 0) || 1;`
- Update the bar width from `(group.revenue / maxRevenue) * 100%` to `(group.revenue / totalRevenue) * 100%`

This means a provider earning half the day's revenue will show a 50% bar, which is immediately intuitive.

