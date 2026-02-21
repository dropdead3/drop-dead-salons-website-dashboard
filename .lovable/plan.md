
# Replace Birthday Calendar with Three-Dropdown Date Picker

## Problem
The calendar-based birthday picker (even with dropdown navigation) is clunky for entering birthdates. Users want a simple, familiar month/day/year dropdown pattern.

## Solution
Replace the Calendar + Popover birthday input with three inline `Select` dropdowns (Month, Day, Year) that construct a `Date` object from the selections.

## Changes

### File: `src/components/dashboard/schedule/NewClientDialog.tsx`

**Remove** the Calendar/Popover birthday section (lines 332-359) and replace with three `Select` dropdowns in a row:

- **Month dropdown**: January through December (values 0-11)
- **Day dropdown**: 1-31, dynamically adjusted based on selected month/year (e.g. Feb shows 28 or 29 days)
- **Year dropdown**: Current year down to 100 years ago, listed in descending order for fast selection

The three selects will manage intermediate state (`birthMonth`, `birthDay`, `birthYear`) and update the existing `birthday` state (a `Date`) whenever all three are populated. On dialog open, if `birthday` is already set, the dropdowns pre-populate from it.

**Layout**: The three dropdowns sit inside the existing grid cell, arranged as a flex row with Month taking more space than Day and Year.

**Import cleanup**: Remove `Calendar` import (line 18) and `CalendarIcon` usage for the birthday field (the "Client Since" field still uses it). Keep all `Select` imports already present.

### No other files changed
The `Select` component and all utilities (`cn`, `format`) are already imported. No new dependencies needed.
