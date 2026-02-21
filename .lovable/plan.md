
# Filter Preferred Stylist Dropdown to Service Providers Only

## Problem

The "Preferred Stylist" dropdown in both the New Client Dialog and Client Detail Sheet currently shows all active staff members (including front desk, managers, etc.) instead of only service providers.

## Solution

Filter the `teamMembers` list to only include users with service-provider roles (`stylist`, `stylist_assistant`, `booth_renter`) before rendering the dropdown options. The `useTeamDirectory` hook already returns `roles` for each member, so no new queries are needed.

## Changes

### 1. `src/components/dashboard/schedule/NewClientDialog.tsx`

- After the `useTeamDirectory` call, filter `teamMembers` to only those whose `roles` array includes at least one of `stylist`, `stylist_assistant`, or `booth_renter`
- The filtered list feeds into the existing `Select` dropdown

### 2. `src/components/dashboard/ClientDetailSheet.tsx`

- Same filtering logic applied to `teamMembers` before rendering the preferred stylist `Select` dropdown in the edit-mode Settings card

### Technical Note

The constant `SERVICE_PROVIDER_ROLES` already exists in `useStaffServiceConfigurator.ts` as `['stylist', 'stylist_assistant', 'booth_renter']`. Both files will use the same role set inline (a simple `.filter()` call) to keep the change minimal.
