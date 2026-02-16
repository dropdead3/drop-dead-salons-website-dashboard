
# Add "Today" and "Tomorrow" Labels to Week View Day Headers

## Change
In the WeekView column headers, add "Today" or "Tomorrow" next to the day abbreviation, separated by a dot.

**Examples:**
- `MON · Today`
- `TUE · Tomorrow`
- `WED` (no label for other days)

## Technical Detail
**File:** `src/components/dashboard/schedule/WeekView.tsx`

1. Import `isTomorrow` from `date-fns` (line 7-8)
2. Add `const dayIsTomorrow = isTomorrow(day)` alongside the existing `dayIsToday` check (line 327-328)
3. Update the day abbreviation rendering (line 347) from:
   ```
   {format(day, 'EEE')}
   ```
   to:
   ```
   {format(day, 'EEE')}{dayIsToday ? ' · Today' : dayIsTomorrow ? ' · Tomorrow' : ''}
   ```

Three lines changed in one file.
