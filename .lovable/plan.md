

## Improve Subcard Border Visibility in Light Mode

### Problem
The nested subcards within dashboard cards (Services, Products, Transactions, Avg Ticket, etc.) use `border-border/30` which renders nearly invisible against the light cream background. This hurts visual hierarchy and makes it hard to distinguish card boundaries.

### Solution
Increase the default border opacity on all subcards in the AggregateSalesCard from `border-border/30` to `border-border/60` for light mode, while preserving the softer dark mode appearance using a dual-class approach: `border-border/60 dark:border-border/30`.

This keeps the dark mode aesthetic intact (where contrast is already sufficient at 30% opacity) while making borders clearly visible on light backgrounds.

### Scope of Changes

**File: `src/components/dashboard/AggregateSalesCard.tsx`**

All subcard border classes will be updated:

1. **Services and Products subcards** (lines ~681, ~699) -- the two cards visible in your screenshot
   - From: `border-border/30`
   - To: `border-border/60 dark:border-border/30`

2. **Secondary KPI subcards** (Transactions, Avg Ticket, Rev/Hour, Tips -- lines ~740, ~759, ~778, ~797)
   - Same update on the inactive state border

3. **5-card layout variant** (lines ~824, ~843, and remaining KPI cards in the alternate grid)
   - Same update for consistency

The hover state (`hover:border-border/60`) will be adjusted to `hover:border-border/80` so there is still a visible lift on hover in light mode.

### Technical Details

- Approximately 12-15 class string replacements in one file
- No logic changes, no new dependencies
- Dark mode remains unchanged via the `dark:` prefix override
- Hover states scale proportionally (60% base to 80% hover in light; 30% base to 60% hover in dark)

