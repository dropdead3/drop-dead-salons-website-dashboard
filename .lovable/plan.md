

# Clean Up Sort Buttons -- Remove Icons

## Problem

The sort buttons (Name, Spend, Visits, Recent) each have a leading icon AND a trailing ArrowUpDown icon, making the row feel visually busy and cluttered. That's 8 icons across 4 buttons.

## Change

**File: `src/pages/dashboard/ClientDirectory.tsx` (lines 582-622)**

Remove the leading icons (`Type`, `DollarSign`, `Calendar`, `Clock`) from all four sort buttons. Keep only the text label and a single `ArrowUpDown` icon per button. The active sort button already gets `bg-muted` highlighting which is sufficient to indicate state.

Before: `[T] Name [sort] | [$] Spend [sort] | [cal] Visits [sort] | [clock] Recent [sort]`
After: `Name [sort] | Spend [sort] | Visits [sort] | Recent [sort]`

This cuts the icon count in half and creates a calmer, more executive feel aligned with Zura's UX principles.

## Technical Detail

Remove four icon elements:
- Line 589: `<Type className="w-3 h-3 mr-1" />`
- Line 599: `<DollarSign className="w-3 h-3 mr-1" />`
- Line 609: `<Calendar className="w-3 h-3 mr-1" />`
- Line 619: `<Clock className="w-3 h-3 mr-1" />`

Clean up unused imports for `Type`, `DollarSign`, `Calendar`, `Clock` if they're no longer referenced elsewhere in the file.

