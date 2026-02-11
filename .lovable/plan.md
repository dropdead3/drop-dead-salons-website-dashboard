

# Add Border Definition to Internal Bento Sub-Cards

## Problem
Internal sub-sections within command center cards (New Clients, Returning Clients, After-Service Rebook, location rows, secondary KPIs like Transactions/Avg Ticket/Tips) use `bg-muted/30` or `bg-muted/20` backgrounds without borders. In dark mode, these blend into the parent card background, making the bento structure invisible.

## Approach
Add `border border-border/50` to all internal sub-card elements that currently rely only on background color for definition. This matches the pattern already used by the AggregateSalesCard's Services/Products sub-cards (`border border-border/30`).

## Files to Change

### 1. `src/components/dashboard/NewBookingsCard.tsx`
- **Lines 85, 104**: New Clients and Returning Clients buttons -- add `border border-border/50`
- **Line 123**: After-Service Rebook section -- add `border border-border/50`
- **Line 173**: Location breakdown rows (`bg-muted/20`) -- add `border border-border/30`

### 2. `src/components/dashboard/AggregateSalesCard.tsx`
- **Lines 567, 582, 598, 615, 632**: Secondary KPI cells (Transactions, Avg Ticket, Rev/Hour, Daily Avg, Tips) using `bg-muted/30 dark:bg-card` -- add `border border-border/30`

### 3. `src/components/dashboard/sales/TopPerformersCard.tsx`
- **Line 45**: Default rank background (`bg-muted/30 dark:bg-card`) -- already has border class from `getRankBg`. No change needed.

### 4. `src/components/dashboard/LocationBreakdownSection.tsx`
- **Line 55**: Location rows (`bg-muted/20`) -- add `border border-border/30`

## Summary

| File | Elements | Border Added |
|---|---|---|
| NewBookingsCard.tsx | New/Returning client cards, Rebook section, Location rows | `border border-border/50` and `border-border/30` |
| AggregateSalesCard.tsx | 5 secondary KPI cells | `border border-border/30` |
| LocationBreakdownSection.tsx | Location rows | `border border-border/30` |

Total: ~10 className additions across 3 files. No structural or behavioral changes.
