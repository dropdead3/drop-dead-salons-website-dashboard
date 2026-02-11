

# Fix: Drill-Down Card Location Filter Not Syncing with Command Center

## Problem

When you change the location filter on the command center (e.g., to "All Locations"), the drill-down card's internal location filter stays on the previous value (e.g., "North Mesa"). This happens because the drill-down uses `useState(parentLocationId)` which only captures the initial value on mount -- it does not react to subsequent changes.

## Fix

Add a `useEffect` in `ServiceProductDrilldown.tsx` that syncs the local `filterLocationId` state whenever the parent `parentLocationId` prop changes.

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/ServiceProductDrilldown.tsx` | Add a `useEffect` that calls `setFilterLocationId(parentLocationId or 'all')` whenever `parentLocationId` changes. This ensures the local filter stays in sync with the command center filter without requiring a close/reopen. |

The change is a single `useEffect` addition (~4 lines) right after the existing `useState` declarations (around line 48).

