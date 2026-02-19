

## Live Session Drill-Down Dialog

Add a clickable drill-down to the Live Session Indicator that opens a dialog showing each active stylist, their current appointment, and their estimated wrap-up time (based on their last appointment of the day).

### What it Shows
- Dialog opens when clicking the Live Session pill
- Each stylist row shows: avatar, name, current service, and estimated day-end time
- "Estimated wrap-up" is derived from the latest `end_time` across all of that stylist's appointments today
- Sorted by wrap-up time (earliest finishers first)
- Uses the same drill-down dialog animation and styling as existing panels (e.g., DayProviderBreakdownPanel)

### Technical Changes

**1. Update hook: `src/hooks/useLiveSessionSnapshot.ts`**
- Expand the returned data to include per-stylist detail: current service name, current appointment end time, and last appointment end time (wrap-up estimate)
- Fetch all of today's appointments (not just in-session) per active stylist to find their last appointment's `end_time`
- Return a new `stylistDetails` array alongside the existing summary fields

**2. New component: `src/components/dashboard/LiveSessionDrilldown.tsx`**
- Dialog using `DRILLDOWN_DIALOG_CONTENT_CLASS` and `DRILLDOWN_OVERLAY_CLASS` for consistent animation
- Header: "Live Session" with subtitle showing count (e.g., "18 appointments in progress - 13 stylists working")
- ScrollArea with stylist rows, each showing:
  - Avatar (photo or initials fallback)
  - Stylist name
  - Current service name (muted text)
  - "Wraps up ~5:30 PM" (last appointment end time, formatted)
- Sorted by wrap-up time ascending
- Demo mode support matching the indicator's demo data

**3. Update component: `src/components/dashboard/LiveSessionIndicator.tsx`**
- Add `useState` for dialog open/close
- Change the pill from `cursor-default` to `cursor-pointer` with hover effect
- Add `onClick` to open the drill-down dialog
- Import and render `LiveSessionDrilldown`

### Files Created
- `src/components/dashboard/LiveSessionDrilldown.tsx`

### Files Modified
- `src/hooks/useLiveSessionSnapshot.ts` (add per-stylist schedule detail)
- `src/components/dashboard/LiveSessionIndicator.tsx` (add click-to-open + render dialog)
