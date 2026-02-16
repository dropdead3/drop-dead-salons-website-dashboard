

# Fix Category Name Kerning in Services Accordion

## Problem
The service category names ("New Client Consultation", "Haircuts", "Blonding", etc.) in the SERVICES accordion section display with wide letter-spacing. While `tokens.body.emphasis` correctly sets `font-sans`, it does not explicitly reset `tracking`, so the text inherits wider tracking from parent elements in the card/accordion hierarchy.

## Fix
Add `tracking-normal` to the category name span (line 374) and the service count span (line 375) to explicitly reset any inherited letter-spacing.

## Technical Changes

### File: `src/components/dashboard/settings/ServicesSettingsContent.tsx`

**Line 374** -- Category name span:
- Current: `<span className={tokens.body.emphasis}>`
- Updated: `<span className={cn(tokens.body.emphasis, 'tracking-normal')}>`

**Line 375** -- Service count span:
- Current: `<span className={tokens.body.muted}>`
- Updated: `<span className={cn(tokens.body.muted, 'tracking-normal')}>`

This ensures both text elements explicitly use normal letter-spacing regardless of inherited tracking from the Card, CardHeader, or AccordionTrigger ancestors.
