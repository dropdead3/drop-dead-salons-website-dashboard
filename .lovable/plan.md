

# Fix: Payroll Card Corner Radius Mismatch

## Problem
The "Pay schedule not configured" card uses `rounded-2xl` (16px) while the Sales Overview card and most other dashboard cards use the default Card component rounding of `rounded-xl` (12px, matching the global `--radius: 0.75rem`). This creates a visual inconsistency.

## Fix

Remove the explicit `rounded-2xl` from `PayrollDeadlineCard.tsx` so it uses the default Card rounding (`rounded-xl`), matching all other dashboard cards.

| File | Change |
|---|---|
| `src/components/dashboard/payroll/PayrollDeadlineCard.tsx` | Change both Card instances from `className="rounded-2xl shadow-md border-border/40"` to `className="shadow-md border-border/40"` (dropping `rounded-2xl` so the default `rounded-xl` applies). |
| `src/components/dashboard/mypay/PaydayCountdownBanner.tsx` | Same fix -- remove `rounded-2xl` from the Card className to match the standard rounding. |

Two lines changed, two files.

