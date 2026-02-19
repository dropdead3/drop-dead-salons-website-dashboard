

## Live Session Snapshot Indicator

A new component that shows a real-time snapshot of currently in-session appointments, placed to the right of the Announcements button in the dashboard header row.

### What it Shows
- A green pulsating dot indicating live status
- Count of appointments currently in session (e.g., "3 In Session")
- Stacked avatars of stylists currently working (up to 7, with "+N" overflow)
- If total stylists exceed 40 (enterprise), avatars are hidden and only the count is shown
- Clicking the indicator could show a tooltip or popover with details

### Data Logic
- Query `phorest_appointments` for today's date where `start_time <= now` AND `end_time > now` (appointments currently in progress)
- Join to `phorest_staff_mapping` to get `user_id`, then to `employee_profiles` to get `photo_url` and `display_name` for avatars
- Deduplicate stylists (one stylist may have overlapping appointments)
- Auto-refresh every 60 seconds to keep the snapshot current

### Technical Changes

**1. New hook: `src/hooks/useLiveSessionSnapshot.ts`**
- Queries `phorest_appointments` for today where current time falls between `start_time` and `end_time`
- Resolves stylist avatars via `phorest_staff_mapping` -> `employee_profiles`
- Returns: `{ inSessionCount, activeStylistCount, stylists: Array<{ name, photoUrl }>, isLoading }`
- Refreshes every 60 seconds via `refetchInterval`

**2. New component: `src/components/dashboard/LiveSessionIndicator.tsx`**
- Renders as an inline pill (matching the Zura Insights / Announcements button style)
- Green pulsating dot (CSS animation) on the left
- Text: "{N} In Session"
- Stacked avatar row (negative margin overlap, up to 7 avatars + "+N" overflow badge)
- Enterprise mode (40+ stylists): hides avatars, shows count only
- Uses `bg-background border border-border` styling to match sibling buttons
- Fallback initials for stylists without photos

**3. Modified: `src/pages/dashboard/DashboardHome.tsx`**
- Import `LiveSessionIndicator`
- Add it after `<AnnouncementsDrawer>` in both the compact and detailed analytics header rows (lines ~732 and ~801)

### Files Created
- `src/hooks/useLiveSessionSnapshot.ts`
- `src/components/dashboard/LiveSessionIndicator.tsx`

### Files Modified
- `src/pages/dashboard/DashboardHome.tsx` (add LiveSessionIndicator to both header rows)

