
## Fix Zura Insights Expanded Card to Use Full Width

### Problem
The "Zura Insights" and "Announcements" buttons sit side by side in a `flex` row. When the Insights card expands, it tries to be `w-full` but the Announcements button remains next to it, stealing horizontal space and preventing the card from being truly full width.

### Solution
Wrap the row in a `flex-wrap` container so that when the Insights card expands (becoming `w-full`), the Announcements button wraps to the next line (or hides). Alternatively -- and more cleanly -- switch the container layout so that when Insights is expanded, the flex direction changes to `flex-col`, placing Announcements below the full-width insights card.

### Technical detail

**File: `src/pages/dashboard/DashboardHome.tsx` (line 258)**

Change the button row from:
```
<div className="flex items-center gap-3">
```
to:
```
<div className="flex flex-wrap items-start gap-3">
```

This single change allows the expanded Insights card (which has `w-full`) to claim 100% of the row width, naturally wrapping the Announcements button to a new line underneath. The `items-start` alignment ensures both elements align to the top when side by side in collapsed state.
