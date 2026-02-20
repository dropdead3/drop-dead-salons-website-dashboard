

# Transform Client Detail Drawer into Premium Floating Bento Panel

## Problem

The client detail view currently uses a standard side-sliding `Sheet` component, which feels visually disconnected from the premium floating bento pattern used by the Quick Booking Wizard. The wizard uses a centered floating card with backdrop blur overlay, `rounded-xl`, and `shadow-xl` -- which is the platform's cohesive premium UI language.

## Design Reference

The Quick Booking Wizard pattern (line 1560-1578 of `QuickBookingPopover.tsx`):
- Backdrop: `fixed inset-0 z-40 bg-black/20 backdrop-blur-sm`
- Panel: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] shadow-xl border border-border rounded-xl overflow-hidden bg-popover`

## Changes

### 1. Replace Sheet with Dialog-based Floating Panel

**File:** `src/components/dashboard/ClientDetailSheet.tsx`

Replace the `Sheet` / `SheetContent` wrapper with a custom floating panel that matches the Quick Booking Wizard's visual language:

- Remove `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` imports
- Use `Dialog` / `DialogContent` from Radix (or a custom floating div with AnimatePresence) to render a centered floating panel
- Apply the same styling pattern as the booking wizard:
  - Backdrop overlay: `bg-black/20 backdrop-blur-sm`
  - Panel container: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] max-h-[85vh] rounded-xl border border-border bg-popover shadow-xl overflow-hidden`
  - Internal scroll area for content overflow
- Add a close button (X) in the top-right corner matching the wizard's close pattern
- Wrap content in `AnimatePresence` + `motion.div` for smooth open/close transitions consistent with the wizard

### 2. Internal Layout Adjustments

Within the floating panel:
- Keep the same scrollable `p-6 space-y-4` internal layout
- All bento cards inside remain unchanged (`bg-card/80 backdrop-blur-xl border-border/60`)
- The header (avatar + name + badges) stays at top
- Quick action buttons (Call, Email, Text) stay below header
- Stats grid, all edit cards, tabs, and archive/ban actions remain in order

### 3. Responsive Behavior

- On mobile (`sm` and below), the panel should go full-width with slight margin: `w-[calc(100vw-2rem)] max-w-[440px]`
- Max height remains `max-h-[85vh]` with internal `overflow-y-auto`

## Technical Details

- The component will use a conditional render pattern: when `open` is true, render a portal with backdrop + floating panel (same as `QuickBookingPopover` lines 1556-1578)
- Use `framer-motion` for entry/exit animations (fade + scale, matching the drilldown dialog pattern)
- The close button and backdrop click both call `onOpenChange(false)`
- All edit state resets on close remain unchanged

## Files Modified

1. `src/components/dashboard/ClientDetailSheet.tsx` -- Replace Sheet wrapper with floating bento panel, add backdrop overlay, match wizard styling
