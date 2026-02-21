

## Update Slot Time Hover Tooltip Colors

### What Changes
The hover time indicator (e.g., "12:30 PM") that appears when hovering over available time slots currently uses a fixed blue background with white text. We will update it to use theme-aware colors: white text on a dark background in dark mode, and black text on a light background in light mode.

### Technical Detail

**File: `src/components/dashboard/schedule/DayView.tsx`** (line 164)

Change:
```
bg-blue-500 text-white
```
To:
```
bg-foreground text-background
```

**File: `src/components/dashboard/schedule/WeekView.tsx`** (line 543)

Same change: replace `bg-blue-500 text-white` with `bg-foreground text-background`.

This uses the existing `foreground` and `background` semantic tokens, which automatically flip between light and dark mode -- producing a dark pill with white text in dark mode, and a light pill with black text in light mode.

Note: The current-time indicator (red/blue line with timestamp) will remain unchanged as that serves a different purpose.

