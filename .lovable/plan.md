

## Improve Live Session Drill-Down Clarity

Two changes to make each stylist row more informative:

### 1. Add "Appointment X of Y" indicator
Show which appointment in the stylist's day they are currently on (e.g., "Appointment 2 of 6"). This requires adding two new fields to the data model: `currentApptIndex` and `totalAppts`.

### 2. Label the wrap-up time clearly
Replace the bare "~5:00 PM" with a labeled format: "Last wrap-up ~5:00 PM" so users immediately understand what the time represents.

---

### Technical Details

**`src/hooks/useLiveSessionSnapshot.ts`**
- Add `currentApptIndex` (1-based) and `totalAppts` to the `StylistDetail` interface
- In the per-stylist detail builder, count total appointments for the day and determine which one (chronologically) is the current in-session appointment

**`src/components/dashboard/LiveSessionDrilldown.tsx`**
- Update `StylistDetail` demo data to include `currentApptIndex` and `totalAppts` for each entry
- Below the stylist name and current service, add a third line: "Appointment 2 of 6" in muted text
- Change the time display from `~5:00 PM` to a two-line right-aligned block:
  - Line 1: "Last wrap-up" (label, smaller muted text)
  - Line 2: "~5:00 PM" (the time value)

### Files Modified
- `src/hooks/useLiveSessionSnapshot.ts`
- `src/components/dashboard/LiveSessionDrilldown.tsx`
