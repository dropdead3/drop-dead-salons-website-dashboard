
# Refine & Polish Services Settings

## Issues Identified
1. Raw `font-medium` classes instead of design tokens throughout
2. Card headers not using `tokens.heading.section` 
3. ServiceFormDialog toggle labels using raw `font-medium` (violates token system)
4. Accordion items have tight padding (`px-1`), needs more breathing room
5. Service rows inside accordion use raw classes instead of tokens
6. Empty states don't use `tokens.empty.*` pattern
7. Category name display and service count text not tokenized

## Changes

### File: `src/components/dashboard/settings/ServicesSettingsContent.tsx`

**1. Import design tokens**
Add `import { tokens } from '@/lib/design-tokens';` at the top.

**2. Card headers -- use token system**
- Line 220: Replace `CardTitle className="font-display text-lg"` with `CardTitle className={tokens.heading.section}`
- Line 335: Same change for SERVICES header

**3. Category row text -- use tokens**
- Line 301: Replace `className="font-medium text-sm truncate"` with `className={cn(tokens.body.emphasis, 'truncate')}`
- Line 302: Replace `className="text-xs text-muted-foreground"` with `className={tokens.body.muted}` (adjust text-xs if needed)

**4. Accordion items -- improve padding**
- Line 360: Change `className="border rounded-lg mb-2 px-1"` to `className="border rounded-lg mb-2 px-4"`
- Line 361: Adjust trigger padding `py-3` to `py-4` for breathing room

**5. Service category name in accordion trigger -- use tokens**
- Line 369: Replace `className="font-medium text-sm"` with `className={tokens.body.emphasis}`
- Line 370: Replace `className="text-xs text-muted-foreground"` with `className={tokens.body.muted}`

**6. Service row inside accordion -- use tokens**
- Line 381: Replace `className="text-sm font-medium truncate"` with `className={cn(tokens.body.emphasis, 'truncate')}`
- Line 382: Replace `className="flex items-center gap-3 text-xs text-muted-foreground"` with token-aware version

**7. Empty states -- use token pattern**
- Lines 232-236: Replace with `tokens.empty.container`, `tokens.empty.icon`, `tokens.empty.heading`, `tokens.empty.description`
- Line 376: Empty category message should use `tokens.empty.description`

**8. Color picker labels -- use tokens**
- Lines 264, 283: Replace `className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider"` with `className={tokens.label.tiny}`

### File: `src/components/dashboard/settings/ServiceFormDialog.tsx`

**9. Toggle labels -- use tokens instead of raw font-medium**
- Replace `className="text-sm font-medium"` on "Requires Qualification" and "Same-Day Booking" with `className={tokens.body.emphasis}`
- Replace `className="text-xs text-muted-foreground"` descriptions with `className={tokens.body.muted}`

### File: `src/components/dashboard/settings/CategoryFormDialog.tsx`

No major issues -- dialog is minimal and mostly uses shadcn defaults.

## Summary
- 2 files modified
- All raw `font-medium` / `text-sm font-medium` replaced with design tokens
- Accordion padding improved from `px-1` to `px-4`
- Empty states aligned to `tokens.empty.*` pattern
- Color picker sub-labels use `tokens.label.tiny`
- No new dependencies
