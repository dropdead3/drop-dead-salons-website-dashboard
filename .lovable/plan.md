

## Badge Time-Independent Cards When Filter Doesn't Apply

### Problem
Cards like **Week Ahead Forecast**, **Hiring Capacity**, **Staffing Trends**, **Stylist Workload**, and **Client Health** show data that is not affected by the date range filter. When a user changes the filter (e.g., "Last 7 days"), these cards silently ignore it, which can be confusing.

### Solution
Add a small informational badge reading **"Time filter n/a"** to compact cards whose data is independent of the selected date range. The badge only appears when the filter is set to something other than the default ("today"), so it does not clutter the view unnecessarily.

### Time-Independent Cards (will receive badge)
- `week_ahead_forecast` -- always next 7 days
- `hiring_capacity` -- structural headcount
- `staffing_trends` -- current active staff
- `stylist_workload` -- current utilization snapshot
- `client_health` -- segment counts, not period-scoped

### Implementation Detail

**Single file changed:** `src/components/dashboard/PinnedAnalyticsCard.tsx`

1. **Define the set of time-independent card IDs** as a constant:
   ```tsx
   const TIME_INDEPENDENT_CARDS = new Set([
     'week_ahead_forecast',
     'hiring_capacity',
     'staffing_trends',
     'stylist_workload',
     'client_health',
   ]);
   ```

2. **Compute a flag** in the compact rendering block:
   ```tsx
   const isTimeIndependent = TIME_INDEPENDENT_CARDS.has(cardId);
   ```

3. **Render a subtle badge** inside the card when the flag is true. It will sit next to the card title area, styled as a small muted pill:
   ```tsx
   {isTimeIndependent && (
     <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-full border border-border/30">
       Time filter n/a
     </span>
   )}
   ```
   This badge will be placed in the header row, after the card label text, keeping it visible but non-intrusive.

### Visual Result
- When filter is active, time-independent cards will show a small **"Time filter n/a"** pill badge beside their title
- The badge uses existing muted/border color tokens so it blends with the current design language
- Time-dependent cards (Sales, Bookings, etc.) remain unchanged
