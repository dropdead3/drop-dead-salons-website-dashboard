

## Redesign Quick Day Buttons in Schedule Header

### What Changes

The day selector buttons in the secondary navigation bar (Today, Sat, Sun, Mon...) will be redesigned from pill-shaped buttons to elegant rectangular buttons with:

1. **Rounded rectangle shape** -- slight border radius instead of fully rounded pills
2. **Date subtext** -- the numeric date (e.g., "21") displayed below the day abbreviation
3. **Refined styling** -- cleaner visual hierarchy with the day name on top and date below

### File to Change

**`src/components/dashboard/schedule/ScheduleHeader.tsx`** (lines 292-325)

### Design

Current:
```
[ Today ] [ Sat ] [ Sun ] [ Mon ] [ Tue ] [ Wed ] [ Thu ] [ Fri ]
```

New:
```
[ Today ] [  Sat  ] [  Sun  ] [  Mon  ] [  Tue  ] [  Wed  ] [  Thu  ] [  Fri  ]
[  Feb 21 ] [  22  ] [   23  ] [   24  ] [   25  ] [   26  ] [   27  ] [   28  ]
```

Each button becomes a two-line element:
- **Line 1**: Day abbreviation (e.g., "Sat") or "Today"
- **Line 2**: Date number (e.g., "22") or formatted date for Today (e.g., "Feb 21")

### Technical Details

- Replace the `Button` components with custom `button` elements using `rounded-lg` (slight radius) instead of the default `rounded-full`
- Each button uses `flex-col` layout for stacked day + date
- Active state: solid background with contrast text
- Today button: primary accent styling
- Hover: subtle background lift
- Dimensions: slightly wider (`min-w-[56px]`) and taller (`py-2`) to accommodate two lines
- The "Today" label shows "Today" on line 1 and the short date (e.g., "Feb 21") on line 2
- Other days show the 3-letter abbreviation on line 1 and just the day number on line 2

