

# Close Remaining Renter Visibility Gaps

## What Was Found

The `useHasRenters` hook was added to the Executive Summary and Analytics Hub, but three other areas still show rent-related content unconditionally.

## Gaps to Fix

### 1. Payroll Summary Report - On-Screen KPI Cards
**File:** `src/components/dashboard/reports/PayrollSummaryReport.tsx` (lines 164-172)

The "Expected Rent" and "Collected Rent" cards are always rendered in the 4-column KPI grid. When there are no renters, these show "$0" which is confusing.

**Fix:** Import `useHasRenters`, conditionally render the two rent cards only when `hasRenters` is true, and adjust the grid from `grid-cols-4` to `grid-cols-2` when rent cards are hidden.

### 2. Payroll Summary Report - PDF Summary Line
**File:** `src/components/dashboard/reports/PayrollSummaryReport.tsx` (line 73)

The PDF header always prints `"Total Commission: $X | Expected Rent: $0 | Collected Rent: $0"`. The rent section in the PDF body is already guarded by `activeRenterCount > 0`, but the summary line is not.

**Fix:** Conditionally omit the rent portions of the summary string when `hasRenters` is false.

### 3. Payroll Summary Report - CSV Export
**File:** `src/components/dashboard/reports/PayrollSummaryReport.tsx` (lines 127-129)

The CSV always appends a "Rent Summary" block. It checks `if (rentData)` but `rentData` is always truthy (it returns an object with zeros).

**Fix:** Change the guard to `if (rentData && rentData.activeRenterCount > 0)` to match the PDF logic, or use `hasRenters`.

## What This Does NOT Change

- The "Renter Hub" sidebar link and Management Hub card are navigation items, not analytics. They are already behind the `manage_booth_renters` permission gate. These are intentionally left visible so owners who want to start onboarding renters can discover the feature.
- The Renter Portal routes (for booth_renter role users) are unaffected since those users would not exist in a non-rental org.

## Technical Details

- Only 1 file changes: `PayrollSummaryReport.tsx`
- Adds the `useHasRenters` import (same hook already used elsewhere)
- Three small conditional checks: KPI grid rendering, PDF summary string, CSV export block
- Grid adjusts from `md:grid-cols-4` to `md:grid-cols-2` when rent cards are hidden
