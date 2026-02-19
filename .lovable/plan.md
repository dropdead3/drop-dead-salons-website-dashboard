

## Fix Border Consistency on Pinned Analytics Cards

### Problem
The top 4 simplified analytics cards (Sales Overview, Week Ahead Forecast, New Bookings, Goal Tracker) have a lighter border than the rest of the dashboard cards. This is because:

- **Top 4 cards**: Use `tokens.kpi.tile` which applies `border-border/50` (50% opacity)
- **Other cards** (My Tasks, Widgets, etc.): Use the standard `Card` component which applies `border` at full opacity via `hsl(var(--border))`

The reduced opacity makes the top cards look like they belong to a different visual system.

### Fix

**File: `src/lib/design-tokens.ts` (line 56)**

Update the `kpi.tile` token from:
```
rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-1
```
to:
```
rounded-xl border border-border bg-card p-4 flex flex-col gap-1
```

This single change removes the `/50` opacity modifier from the border color, making the top 4 cards match the standard `Card` component's full-opacity `border` class. One token changed, all pinned cards inherit the fix automatically.

