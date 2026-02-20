

## Design Token Compliance Fix -- Assistant Schedule (Round 3)

### Remaining Violations Found

| # | Violation | Lines | Fix |
|---|-----------|-------|-----|
| 1 | **StatCard value uses raw classes** (`text-2xl font-medium text-foreground`) instead of `tokens.stat.large` or `tokens.kpi.value` | Line 76 | Replace with `tokens.kpi.value` |
| 2 | **StatCard description uses raw classes** (`text-xs text-muted-foreground`) | Line 78 | Replace with `tokens.body.muted` |
| 3 | **AdminRequestRow: `font-medium` raw class** on stylist name (line 137) | Line 137 | Replace with `tokens.body.emphasis` |
| 4 | **RequestCard: `font-medium` raw class** on time display (line 199) | Line 199 | Replace with `tokens.body.emphasis` |
| 5 | **RequestCard: hardcoded `bg-green-50 text-green-700 border-green-200`** on "Accepted" badge (line 206) | Line 206 | Use `APPOINTMENT_STATUS_BADGE.confirmed` tokens |
| 6 | **RequestCard: hardcoded `bg-green-600 hover:bg-green-700`** on Accept button (line 271) | Line 271 | Use semantic `bg-primary hover:bg-primary/90` or success semantic class |
| 7 | **RequestCard: hardcoded `text-red-600 border-red-200 hover:bg-red-50`** on Decline button (line 280) | Line 280 | Use `text-destructive border-destructive/30 hover:bg-destructive/10` |
| 8 | **RequestCard: hardcoded `bg-amber-50 text-amber-700`** on "Awaiting assistant response" badge (line 322) | Line 322 | Use `APPOINTMENT_STATUS_BADGE.checked_in` tokens |
| 9 | **RequestsList: raw empty state** (lines 364-370) instead of `EmptyState` component | Lines 364-370 | Replace with `<EmptyState>` |
| 10 | **Stylist/Assistant CardHeaders** missing canonical icon-box layout (lines 854-856, 887-889, 871-872, 903-904) | Lines 854, 871, 887, 903 | Add icon-box + `tokens.card.title` pattern |
| 11 | **Page subtitle uses raw `text-muted-foreground`** without token (line 499) | Line 499 | Use `tokens.body.muted` |
| 12 | **Assistant roster: `font-medium` raw on location name** (line 771) | Line 771 | Use `tokens.body.emphasis` class |
| 13 | **Summary strip label `text-muted-foreground` raw** without body token (lines 637, 643, 649, 654) | Multiple | Use `tokens.body.muted` inline |
| 14 | **Date group heading in RequestsList** uses raw `font-medium text-sm text-muted-foreground` (line 377) | Line 377 | Use `tokens.heading.subsection` |

### Technical Details

**File: `src/pages/dashboard/AssistantSchedule.tsx`**

All changes are in this single file. Summary:

1. **StatCard** -- value line becomes `<div className={tokens.kpi.value}>{value}</div>`, description becomes `<p className={cn(tokens.body.muted, "mt-1 text-xs")}>`

2. **AdminRequestRow** -- stylist name `font-medium` becomes `tokens.body.emphasis`

3. **RequestCard** -- replace all five hardcoded color instances with semantic tokens:
   - Accepted badge: `APPOINTMENT_STATUS_BADGE.confirmed` bg/text
   - Accept button: `bg-primary hover:bg-primary/90`
   - Decline button: `text-destructive border-destructive/30 hover:bg-destructive/10`
   - Awaiting badge: `APPOINTMENT_STATUS_BADGE.checked_in` bg/text
   - Time span: `tokens.body.emphasis`

4. **RequestsList empty state** -- replace raw div with `<EmptyState icon={Calendar} title="No requests found" />`

5. **Stylist/Assistant CardHeaders** (4 cards) -- add icon-box layout with appropriate icons (Inbox for requests, CheckCircle2 for completed, UserCheck for assignments)

6. **Page subtitle** -- `<p className={tokens.body.muted}>`

7. **Summary strip labels** -- wrap in `tokens.body.muted` class

8. **Location name in roster** -- replace raw `font-medium` with `tokens.body.emphasis`

9. **Date group heading** -- replace raw classes with `tokens.heading.subsection`

No database, routing, or new component changes needed. Pure token compliance pass on remaining raw classes and hardcoded colors.

