

# Stylist-First Booking Flow (Staff-Facing)

## Overview

Add an optional "Know your stylist?" shortcut in the staff-facing booking wizard so front desk staff can select the provider first when a client requests a specific stylist. Once a stylist is selected, only the locations where that stylist works will be shown as location options. Services the selected stylist cannot perform will appear greyed out.

## User Flow

```text
Normal flow:  Service -> Location -> Client -> Stylist -> Confirm

Stylist-first: Service (click link) -> Stylist (all) -> Location (filtered to stylist's locations) -> Service (qualification-aware) -> Client -> Confirm
```

## What Changes

### 1. "Know your stylist?" link on the Service step
- A subtle text link below the search bar: "Know your stylist? Select first"
- Clicking it sets `stylistFirstMode = true` and navigates to a stylist selection step (showing all active stylists across all locations)

### 2. All-location stylist fetch
- A second stylist query (or modified existing one) that fetches all active stylists from `phorest_staff_mapping` without filtering by location, used only when `stylistFirstMode` is active and no location is selected yet

### 3. Location filtering by selected stylist
- When a stylist is pre-selected in stylist-first mode, the wizard determines which locations the stylist works at using their `phorest_staff_mapping` entries (each row has a `phorest_branch_id` which maps to a `locations` row)
- The Location step only shows locations matching the stylist's branch IDs
- If the stylist only works at one location, it auto-selects that location and skips the location step entirely

### 4. Greyed-out unqualified services
- When a stylist is pre-selected, each service is cross-referenced against the stylist's qualification data (via existing `useStaffQualifiedServices` hook)
- Unqualified services render at reduced opacity with a "Not offered by [Name]" label
- Selecting an unqualified service triggers a toast warning and clears the pre-selected stylist

### 5. Pre-selected stylist indicator on the Service step
- When returning to services with a stylist pre-selected, a small card at the top shows the stylist's avatar, name, and level with an X to clear the selection

### 6. Modified step navigation
- `stylistFirstMode` tracks the alternate flow
- After stylist selection, wizard goes to Location (filtered), then back to Service (with qualification overlay), then Client, then Confirm (skipping stylist step since already done)
- Reset on close

## Technical Details

**File: `src/components/dashboard/schedule/QuickBookingPopover.tsx`**

1. Add state: `stylistFirstMode` (boolean, default false), reset in `handleClose()`
2. Add a new query for all-location stylists (similar to existing stylist query at line 197 but without `.eq('phorest_branch_id', ...)`) -- enabled only when `stylistFirstMode` is true and no location is chosen
3. When a stylist is selected in stylist-first mode, query their `phorest_staff_mapping` rows to get all `phorest_branch_id` values, then match those to `locations` table to get location IDs. Filter the Location step's list to only those locations
4. If only one location matches, auto-select it and skip the Location step
5. Add `useStaffQualifiedServices` hook call for the pre-selected stylist's `phorest_staff_id` and branch ID
6. In service list rendering, cross-reference each `phorest_service_id` against the qualified list; apply `opacity-40` and "Not offered by [Name]" label for unqualified services
7. Modify step navigation: when `stylistFirstMode` is active, skip the stylist step when proceeding from services (stylist already chosen)

**No database or edge function changes required.** All data (staff mapping, qualifications, locations) already exists.

