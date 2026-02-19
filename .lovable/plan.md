

## Improve Live Session Drill-Down Styling

Refine the "Happening Now" drill-down to match the platform's luxury glassmorphism aesthetic and ensure it scrolls properly when the list exceeds the viewport.

### Changes (single file: `src/components/dashboard/LiveSessionDrilldown.tsx`)

**1. Header upgrade**
- Use `font-display tracking-wide uppercase` on the title (Termina, per design tokens) instead of `font-semibold`
- Add a subtle gradient divider below the header instead of a plain border

**2. Stylist row refinement**
- Increase row padding and avatar size (h-9 w-9) for breathing room
- Add a subtle hover state (`hover:bg-muted/30 transition-colors`) on each row
- Use `rounded-lg` on the avatar fallback background for a softer look
- Apply `font-medium` (not `font-semibold`) on stylist names per design system rules
- Add a mini progress indicator showing appointment progress as a thin bar (e.g., 3/5 = 60%) under the "Appointment X of Y" text using a simple div with `bg-primary/40` fill

**3. Wrap-up time styling**
- Wrap the time block in a small `bg-muted/40 rounded-md px-2 py-1` chip so it reads as a contained data element rather than floating text

**4. Scroll behavior**
- The `ScrollArea` already has `flex-1 min-h-0` which should work within the `max-h-[85vh] flex flex-col` dialog -- verify this is functioning and add an explicit `overflow-hidden` on the outer container if needed

### Technical Details

**File modified:** `src/components/dashboard/LiveSessionDrilldown.tsx`

- Import `tokens` from `@/lib/design-tokens`
- Replace `text-base font-semibold` on DialogTitle with `tokens.heading.section` (Termina, uppercase, tracked)
- Add hover transition to each row div
- Wrap the time display in a muted chip container
- Add a thin progress bar (4px tall div) under the appointment count text
