
# Improve Birthday Date Picker for Fast Year Navigation

## Problem
The current birthday selector uses a standard `Calendar` component that only allows navigating one month at a time. For a birthday field, users often need to go back 20-80 years, making this extremely tedious.

## Solution
Replace the birthday `Calendar` with a custom picker that includes **month and year dropdown selects** above the day grid, allowing users to jump directly to any year/month. The `react-day-picker` library (already installed) supports `captionLayout="dropdown"` mode natively, along with `fromYear` and `toYear` props to define the selectable range.

## Technical Details

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx` (lines 346-354)

Replace the current `Calendar` usage with dropdown caption mode:

```tsx
<Calendar
  mode="single"
  selected={birthday}
  onSelect={setBirthday}
  disabled={(date) => date > new Date()}
  initialFocus
  captionLayout="dropdown"
  fromYear={1920}
  toYear={new Date().getFullYear()}
  className={cn("p-3 pointer-events-auto")}
/>
```

**File:** `src/components/ui/calendar.tsx`

Add styling for the dropdown elements that `react-day-picker` renders when `captionLayout="dropdown"` is used. The classNames config needs entries for:
- `caption_dropdowns` -- container for the month/year selects
- `vhidden` -- visually hidden labels (accessibility)

The dropdowns themselves are native `<select>` elements rendered by the library, styled via the `caption_dropdowns` class to sit inline within the calendar header.

This is a minimal change -- two files, no new dependencies, and the standard `Calendar` component continues to work normally everywhere else (the dropdown behavior only activates when `captionLayout="dropdown"` is passed).
