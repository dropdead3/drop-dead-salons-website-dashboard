

# Fix Category Avatar Kerning/Tracking Mismatch

## Problem
The category avatar badges have `font-sans` applied (correct typeface) but they still visually differ between the two sections because:
1. They inherit `tracking-wide` or `tracking-wider` from parent elements that use `font-display` headings
2. The two badge locations use different font sizes (`text-xs` vs `text-[10px]`), compounding the visual mismatch

## Fix
Add `tracking-normal` to both avatar badge elements to reset any inherited letter-spacing, and unify them to the same font size (`text-[11px]`) for consistency.

## Technical Changes

### File: `src/components/dashboard/settings/ServicesSettingsContent.tsx`

**Line 254 (Category Manager badge):**
- Add `tracking-normal` to reset inherited kerning
- Change `text-xs` to `text-[11px]` for visual match

**Line 369 (Services Accordion badge):**
- Add `tracking-normal` to reset inherited kerning
- Change `text-[10px]` to `text-[11px]` to match the category manager badges

Both badges will now render identically: Aeonik Pro, 11px, normal tracking, medium weight.

