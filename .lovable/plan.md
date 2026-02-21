

## Make Time Slot Badge Follow the Cursor

### What Changes
Currently the hover time badge (e.g., "12:30 PM") is fixed at the top-center of each time slot row. We will make it follow the user's mouse cursor horizontally, staying anchored vertically just above the cursor position within the slot.

### Technical Detail

**Approach:** Add an `onMouseMove` handler to each slot row that tracks the cursor's X position relative to the slot, then use an inline `left` style on the badge instead of the fixed `left-1/2 -translate-x-1/2` centering.

**File: `src/components/dashboard/schedule/DayView.tsx`**

In the `TimeSlot` component (~line 120):
1. Add a `mouseX` state (using `useState`) to track cursor X within the slot.
2. Add `onMouseMove` to the slot div that sets `mouseX` from `e.nativeEvent.offsetX`.
3. On the time badge div (line 164), replace `left-1/2 -translate-x-1/2` with `style={{ left: mouseX }}` and add `-translate-x-1/2` (keep the vertical translate).
4. Apply the same to the "no longer available" tooltip (line 159).

**File: `src/components/dashboard/schedule/WeekView.tsx`**

In the week grid slot (~line 533):
1. Add `onMouseMove` to the slot div to capture cursor X offset.
2. Update the badge (line 543) to use the tracked X position instead of fixed centering.

Both badges will smoothly follow the cursor horizontally while staying pinned just above it vertically. The `pointer-events-none` class on the badge ensures it doesn't interfere with mouse events.

