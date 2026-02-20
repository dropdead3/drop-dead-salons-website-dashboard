

# Convert Booking Wizard to Floating Bento Card Panel

## What Changes
Transform the booking wizard from a standard full-height Sheet into a floating bento card that slides in from the right, matching the platform's luxury aesthetic and bento design system.

## Approach
Replace the Sheet component with a custom animated panel using Framer Motion. The panel will float with margin/inset from edges, use the standard bento card styling (rounded-xl, glassmorphism, backdrop-blur), and slide in from the right.

## Changes

### 1. `src/components/dashboard/schedule/booking/BookingWizard.tsx`

- Remove the `Sheet` / `SheetContent` wrapper
- Replace with a custom overlay + floating panel using Framer Motion's `AnimatePresence` and `motion.div`
- Panel styling:
  - Fixed position, inset from top/right/bottom (e.g. `top-3 right-3 bottom-3`)
  - `w-full sm:max-w-md` width
  - `rounded-xl` corners (bento standard)
  - `bg-card/80 backdrop-blur-xl border border-border` (glassmorphism standard)
  - `shadow-2xl` for depth
- Slide animation: `x: "100%"` to `x: 0` with spring transition
- Backdrop overlay with fade in/out

### 2. `src/components/dashboard/schedule/booking/BookingHeader.tsx`

- Update top corners to match the floating card aesthetic
- Add `rounded-t-xl` to the header container so it follows the card shape
- Use `font-display tracking-wide uppercase` for the title to match platform header conventions

### Visual Result
The wizard will appear as a premium floating card hovering over the schedule, with rounded corners on all sides, a frosted glass background, and smooth slide-in animation from the right edge -- consistent with the bento design language used throughout the dashboard.

