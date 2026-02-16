
# Conditionally Show Rent Revenue and Renter Analytics

## Problem
The Rent Revenue KPI card in the Executive Summary and the Rent tab in Analytics Hub are always visible, even for organizations that have no renters and do not offer booth rentals. This creates noise for pure commission-based salons.

## Solution
Create a lightweight `useHasRenters` hook that checks two signals:
1. Whether the organization has at least 1 `booth_renter_profiles` record (any status)
2. Whether any of the organization's locations have a `rental_model` that is not "none" (i.e., they offer booths)

If either signal is true, renter-related UI is shown. If both are false, it is hidden.

## Changes

### 1. New hook: `src/hooks/useHasRenters.ts`
A simple React Query hook that runs two fast count queries against `booth_renter_profiles` and `locations.rental_model`, returning `{ hasRenters: boolean, isLoading: boolean }`. Cached aggressively (5-minute stale time) since renter presence rarely changes mid-session.

### 2. Executive Summary Card (`src/components/dashboard/analytics/ExecutiveSummaryCard.tsx`)
- Import `useHasRenters`
- Conditionally exclude the "Rent Revenue" KPI object from the `kpis` array when `hasRenters` is false
- The card layout auto-adjusts since KPIs are rendered from a dynamic array

### 3. Analytics Hub (`src/pages/dashboard/admin/AnalyticsHub.tsx`)
- Import `useHasRenters`
- Only include `rentCategory` in the tabs list when `hasRenters` is true (in addition to the existing `isSuperAdmin` check)
- The Rent tab trigger and content are already wrapped in `VisibilityGate`, so this adds a data-driven gate on top

## What This Does NOT Change
- No data is deleted; this is purely a UI visibility change
- If a salon later onboards their first renter, the UI appears automatically on next page load
- The `VisibilityGate` / role-based access controls remain in place as an additional layer
- Payroll reports that reference rent data already guard with `if (rentData.activeRenterCount > 0)`, so those are unaffected

## Files Changed
1. **`src/hooks/useHasRenters.ts`** (new) -- lightweight hook
2. **`src/components/dashboard/analytics/ExecutiveSummaryCard.tsx`** -- filter out Rent Revenue KPI when no renters
3. **`src/pages/dashboard/admin/AnalyticsHub.tsx`** -- hide Rent tab when no renters
