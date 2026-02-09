

# Clock-In / Clock-Out Time Tracking System

## Overview

Add a time clock system that lets employees clock in and out of their shifts. The clock-in prompt appears automatically on login and when unlocking the dashboard (if the user isn't already clocked in). A persistent Clock In / Clock Out button is added to the sidebar footer, above "Lock Dashboard." All time entries are stored in a new `time_entries` table and wired to the active payroll provider for hour tracking.

## Database Changes

### New table: `time_entries`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | uuid | FK to organizations, NOT NULL |
| user_id | uuid | FK to auth.users, NOT NULL |
| clock_in | timestamptz | NOT NULL |
| clock_out | timestamptz | Nullable (null = currently clocked in) |
| duration_minutes | numeric | Computed on clock-out |
| break_minutes | numeric | Default 0 |
| location_id | text | Optional, which location |
| notes | text | Optional |
| source | text | Default 'manual' -- could be 'kiosk', 'lock_screen', 'sidebar' |
| payroll_synced | boolean | Default false -- marks if sent to provider |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

- RLS: Users can read/insert/update their own entries. Admins/managers can read all entries in their org.
- Trigger: auto-calculate `duration_minutes` on clock-out update.
- Enable realtime so clock status updates instantly across tabs.

## Frontend Changes

### 1. New hook: `useTimeClock`

File: `src/hooks/useTimeClock.ts`

- Fetches the user's active (open) time entry where `clock_out IS NULL`
- Provides `clockIn()` and `clockOut()` mutations
- `clockIn` inserts a new row; `clockOut` updates it with timestamp and calculates duration
- Exposes `isClockedIn`, `activeEntry`, `todayTotalHours`
- Uses `usePayrollConnection` to know which provider to reference

### 2. Sidebar Clock Button

File: `src/components/dashboard/SidebarClockButton.tsx`

- Placed above `SidebarLockButton` in `SidebarNavContent.tsx`
- Shows a clock icon with "Clock In" or "Clock Out" text
- Green accent when clocked in, neutral when clocked out
- Collapsed mode shows just the icon with a tooltip
- Clicking toggles clock state with a confirmation toast

### 3. Clock-In Prompt Dialog

File: `src/components/dashboard/ClockInPromptDialog.tsx`

- A modal dialog that appears after login or after unlocking the dashboard
- Only shows if the user is NOT already clocked in
- Shows: "Start your shift?" with Clock In and "Not Now" buttons
- Optionally shows the location selector if multi-location org
- Remembers dismissal for the session (so it doesn't nag on every page nav)

### 4. Integration Points

**DashboardLayout.tsx:**
- After auth state resolves (user is logged in and loaded), check if clocked in
- If not, show `ClockInPromptDialog`

**DashboardLockScreen.tsx:**
- After successful PIN unlock (in the 1.5s animation window), queue the clock-in prompt
- Pass a flag via `onUnlock` or route state so `DashboardLayout` knows to show the prompt

**SidebarNavContent.tsx:**
- Add `SidebarClockButton` above `SidebarLockButton` in the footer section

### 5. Payroll Integration Awareness

The `useTimeClock` hook reads from `usePayrollConnection` to:
- Tag entries with the active provider in metadata
- Surface a "not synced" indicator if entries haven't been pushed to the payroll provider
- Future: when syncing payroll runs, pull from `time_entries` for hourly calculations

## File Summary

**New files:**
- `src/hooks/useTimeClock.ts` -- core clock-in/out logic
- `src/components/dashboard/SidebarClockButton.tsx` -- sidebar button
- `src/components/dashboard/ClockInPromptDialog.tsx` -- auto-prompt dialog

**Modified files:**
- `src/components/dashboard/SidebarNavContent.tsx` -- add clock button to footer
- `src/components/dashboard/DashboardLayout.tsx` -- trigger clock-in prompt on login
- `src/components/dashboard/DashboardLockScreen.tsx` -- flag clock-in prompt after unlock

