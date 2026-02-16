

# Add Time Tooltip on Hover for Schedule Time Slots

## What This Does
When you hover over any time slot in the Day or Week views, a small floating label will appear showing the exact time (e.g., "12:15 PM") for that slot. This gives clear visual feedback about which time you're pointing at, similar to how the current time indicator works.

## Approach
Use a lightweight CSS-only tooltip (no external library) that appears on hover, styled to match the existing current-time indicator (blue pill with white text). The tooltip will show the formatted 12-hour time for the slot being hovered.

## Changes

### 1. DayView.tsx -- DroppableSlot component
- Add a `title` attribute for native browser tooltip as a baseline
- Add a styled hover tooltip using a `group` class and an absolutely-positioned child element
- The tooltip shows the time formatted as "h:mm AM/PM" (e.g., "12:15 PM")
- Only show on available (non-past) slots

### 2. WeekView.tsx -- Time slot divs
- Apply the same hover tooltip pattern to the slot `div` elements inside the day columns
- Both the past-slot (disabled) divs skip the tooltip; bookable slots get it

## Technical Details

The tooltip implementation uses Tailwind's `group-hover` pattern:

```tsx
// Wrap the slot div with group class, add a child tooltip element
<div className="group relative ...existing classes...">
  {/* Existing slot content */}
  {isAvailable && (
    <div className="absolute left-1/2 -translate-x-1/2 -top-7 
      bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded 
      font-medium shadow opacity-0 group-hover:opacity-100 
      transition-opacity pointer-events-none z-40 whitespace-nowrap">
      {formatTime(hour, minute)}
    </div>
  )}
</div>
```

A small helper function `formatTime(hour, minute)` converts 24h values to "12:15 PM" format, reusing the pattern already present in WeekView.

### Files Changed
- `src/components/dashboard/schedule/DayView.tsx` -- Update `DroppableSlot` component
- `src/components/dashboard/schedule/WeekView.tsx` -- Update time slot hover divs

