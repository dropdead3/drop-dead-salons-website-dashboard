

# Replace Birthday Dropdowns with Typed Date Input

## Overview

Replace the three `Select` dropdowns (Month, Day, Year) with a single typed input field that uses locale-aware date formatting. US markets get `MM/DD/YYYY`, while other locales get their native format (e.g. `DD/MM/YYYY` for en-GB, `DD/MM/YYYY` for es/fr/de).

## How It Works

The input auto-formats as the user types:
- User types digits only; slashes are inserted automatically
- Placeholder shows the expected format (e.g. "MM/DD/YYYY" or "DD/MM/YYYY")
- Validation ensures the date is real (no Feb 30) and not in the future
- On valid entry, the `birthday` state is set; on invalid/incomplete, it clears

## Locale Detection

Uses the existing `useOrgDefaults()` hook to read `locale`. The format map:
- `en`, `en-US` -> `MM/DD/YYYY` (month-first)
- `en-GB`, `es`, `fr`, `de`, and all others -> `DD/MM/YYYY` (day-first)

## Technical Changes

### File: `src/components/dashboard/schedule/NewClientDialog.tsx`

**Remove:**
- `birthMonth`, `birthDay`, `birthYear` state variables and their `useEffect` syncs
- `years`, `months`, `daysInMonth` memos
- The three `Select` components in the Birthday section

**Add:**
- Import `useOrgDefaults` from `@/hooks/useOrgDefaults`
- A single `birthdayInput` string state (e.g. `""`)
- A helper that determines format from locale (`isMonthFirst` boolean)
- An `handleBirthdayInput` function that:
  1. Strips non-digits
  2. Auto-inserts `/` separators at positions 2 and 4
  3. Caps length at 10 characters (`MM/DD/YYYY`)
  4. Parses into a `Date` when all 10 chars are entered
  5. Validates: real date, not in the future, year within last 100 years
  6. Sets `birthday` state on valid, clears on invalid
- Replace the three dropdowns with a single `Input` component using `autoCapitalize="off"`, `inputMode="numeric"`, and the locale-aware placeholder

**Reset handling:** `resetForm` clears `birthdayInput` to `''` (replaces the three `setBirth*('')` calls).

**Layout:** The Birthday field becomes a single `Input` inside the existing `space-y-2` div, no longer needing the `flex gap-2` wrapper or `col-span-2` grid. Simpler and more compact.

### No other files changed

All utilities (`useOrgDefaults`, `Input`, `cn`) are already available. No new dependencies.

