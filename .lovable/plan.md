

# Auto-Hide Top Menu Bar on Schedule Page

## What We're Doing
The desktop top navigation bar will be hidden by default on the schedule page, sliding down from the top only when the mouse enters the top area of the screen. This gives the calendar maximum vertical space while keeping navigation accessible.

## How It Works

1. When the mouse moves into the top ~40px of the screen, the top bar slides down with a smooth animation
2. The bar stays visible while the mouse remains over it
3. When the mouse leaves the bar (and isn't near the top edge), it slides back up and hides
4. This behavior only applies on the schedule page (where `hideFooter` is true) on desktop (lg+)
5. Mobile header remains unchanged

## Technical Details

### File: `src/components/dashboard/DashboardLayout.tsx`

**New state and mouse tracking (inside `DashboardLayoutInner`):**
- Add `headerAutoHidden` state (true when `hideFooter` is active)
- Add `headerHovered` state to track mouse proximity
- Add a transparent "hot zone" div (~40px tall) fixed at the top of the screen that triggers reveal on `mouseenter`
- The top bar wrapper gets `onMouseLeave` to re-hide when cursor exits

**Desktop Top Bar changes (lines ~1122-1247):**
- When `hideFooter` is true, change from `sticky top-0` to `fixed top-0 left-0 right-0` positioning (offset by sidebar width)
- Apply a CSS transform: `translateY(-100%)` when hidden, `translateY(0)` when revealed
- Add `transition-transform duration-300 ease-in-out` for smooth slide animation
- The bar sits in a higher z-index layer so it overlays calendar content when revealed

**Hot zone trigger:**
- A fixed, invisible div at the very top of the viewport (full width, ~40px tall)
- Only rendered when `hideFooter` is true
- On `mouseenter`, sets `headerHovered = true` which reveals the bar
- The top bar's `onMouseLeave` sets `headerHovered = false` to re-hide

**Main content adjustment:**
- When `hideFooter` is true, remove the top bar from document flow (it becomes fixed/overlaying) so the calendar gets the extra ~80px of vertical space
- Update the `h-[calc(100vh-4rem)]` in `Schedule.tsx` to use full height since the header no longer takes up space in the flow

### Files to Modify
1. **`src/components/dashboard/DashboardLayout.tsx`** -- Add auto-hide logic, hot zone div, and conditional positioning/animation classes to the desktop top bar
2. **`src/pages/dashboard/Schedule.tsx`** -- Adjust the height calc to account for the header no longer being in flow

