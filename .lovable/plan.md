

# Add "Closed" Context Across All Location-Showing Surfaces

## Problem
When a location shows $0 revenue, there's no explanation. The "Closed Today" context should appear everywhere locations are listed with revenue data, not just the Aggregate Sales Card.

## Shared Utility (Foundation)

### `src/hooks/useLocations.ts`
Add a new `isClosedOnDate(hoursJson, holidayClosures, date)` helper that generalizes the existing `isClosedToday` and `isClosedForHoliday` into a single function accepting any Date. This avoids duplicating logic across consumers.

```
isClosedOnDate(hoursJson, holidayClosures, date) => { isClosed: boolean, reason?: string }
```

Returns the reason ("Holiday: Memorial Day" or "Regular hours") so the UI can display context.

## Surfaces to Update

### 1. AggregateSalesCard (Hero + By Location rows)
- **Hero area**: Below "All locations combined", show "X of Y locations closed today" when at least 1 location is closed (single-day views only: Today, Yesterday).
- **Location rows**: Add a subtle "Closed" badge next to the location name when that location is closed on the viewed date.

### 2. LocationsRollupCard (Command Center)
- Add a "Closed" badge next to location names showing $0 that are closed on the current date.
- This card always shows current-period data, so it uses the same date-aware check.

### 3. LocationComparisonCard (Sales Hub - Compare tab)
- Add a "Closed" badge next to the location name in the card header when the location is closed.
- For multi-day ranges, skip the badge (closure on one day of a range is ambiguous).

### 4. GoalTrackerCard / GoalLocationRow
- Show a "Closed" indicator on location rows where the location is closed today, explaining why pace may appear behind.

### 5. LocationBreakdownSection (reusable "By Location" rows in KPI cards)
- Add a "Closed" badge on rows where the location is closed on the viewed date. This component is used across multiple analytics cards, so updating it once covers many surfaces.

## Display Rules (Consistent Across All Surfaces)
- Only show for single-day views (Today, Yesterday) -- multi-day ranges omit the badge.
- Use a muted, non-alarming style: small text badge with a subtle icon (Moon or Pause).
- Holiday closures show the holiday name (e.g., "Closed -- Memorial Day").
- Regular closures show "Closed".
- If zero locations are closed, show nothing (silence is meaningful per Zura UX principles).

## Technical Details

### New helper in `useLocations.ts`
```typescript
export function isClosedOnDate(
  hoursJson: HoursJson | null,
  holidayClosures: HolidayClosure[] | null,
  date: Date
): { isClosed: boolean; reason?: string } {
  // Check holiday first
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = holidayClosures?.find(h => h.date === dateStr);
  if (holiday) return { isClosed: true, reason: holiday.name };
  
  // Check regular hours
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayKey = dayNames[date.getDay()];
  if (hoursJson?.[dayKey]?.closed) return { isClosed: true, reason: 'Regular hours' };
  
  return { isClosed: false };
}
```

### Accessing location hours data
Each surface already has access to location objects (via `useActiveLocations` or `useLocations`) which contain `hours_json` and `holiday_closures`. No new data fetching required -- just cross-referencing existing data with the viewed date.

### Badge component
A small inline badge, reused across all surfaces:
```
<span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
  Closed
</span>
```
For holidays: "Closed -- Memorial Day"

## What Stays Unchanged
- Footer location cards (already show closed status)
- Team Directory location cards (already show open/closed status)
- Settings pages (not revenue-facing)
- Charts and visualizations (badges don't belong on chart elements)

