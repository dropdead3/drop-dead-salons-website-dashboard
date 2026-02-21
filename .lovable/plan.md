
## Right-Click to Add Break on Desktop

### What Changes
Right-clicking an available time slot in the Day View will open a small context menu with an "Add Break" option. Selecting it will open the break form pre-filled with that slot's time and stylist. This provides a faster workflow for admins and stylists scheduling breaks without going through the full booking popover first.

### How It Works
1. Right-click an empty time slot in the Day View
2. A minimal context menu appears at the cursor position with "Add Break"
3. Clicking it opens the AddBreakForm in a popover/dialog pre-filled with the slot's date, time, and stylist

### Technical Detail

**File: `src/pages/dashboard/Schedule.tsx`**
- Add state for a "break context menu": `{ open, x, y, date, time, stylistId }`.
- Add a new handler `handleSlotContextMenu(stylistId, time, mouseEvent)` that prevents the default browser context menu, captures cursor position, and sets the break context menu state.
- Pass `onSlotContextMenu` down to `DayView`.
- Render a small absolutely-positioned menu (or use Radix `ContextMenu`) at the cursor coordinates with a single "Add Break" item.
- When clicked, render the `AddBreakForm` inside a Dialog/Popover anchored to that position.

**File: `src/components/dashboard/schedule/DayView.tsx`**
- Accept a new optional prop: `onSlotContextMenu?: (stylistId: string, time: string, e: React.MouseEvent) => void`.
- In the `DroppableSlot` (renamed `TimeSlot`), add `onContextMenu` to the slot div that calls `onSlotContextMenu` for available (non-past) slots, passing the mouse event for positioning.
- Pass `onSlotContextMenu` through from the parent `DayView` component to each `DroppableSlot`.

**Scope**: Day View only (Week View slots don't have per-stylist context, so we'll keep it to Day View where the stylist is known). This can be extended to Week View later if desired.
