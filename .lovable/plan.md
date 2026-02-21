

## Enhance Staff-Service Configurator: Location Filter, Role Filter, and Alphabetical Sorting

### What Changes

The Stylist Service Assignments card gets three key upgrades:

1. **Location filter** -- dropdown to filter the stylist list by their assigned location
2. **Alphabetical A-Z filter** -- quick letter buttons to jump to stylists by first letter
3. **Service-provider-only filter** -- the dropdown only shows stylists, stylist assistants, and booth renters (excludes admins, managers, receptionists, operations assistants, etc.)
4. **UI polish** -- better spacing, filter bar layout, count indicators, and visual hierarchy

### How It Works

**Filter Bar** (above the stylist selector):
- **Location dropdown**: Select a location to narrow the stylist list. Defaults to "All Locations."
- **A-Z bar**: Row of letter buttons. Clicking "A" filters the dropdown to stylists whose name starts with "A." Clicking the active letter again clears the filter.

**Role Filtering** (automatic, no UI toggle):
- The `useActiveStylists` hook gets updated to join against `user_roles` and only return users with roles: `stylist`, `stylist_assistant`, or `booth_renter`
- This eliminates non-service-providers from the screenshot (Admin Assistant, Manager, Receptionist, Operations Assistant)

**Alphabetical sorting**:
- Stylists are always sorted alphabetically by display_name/full_name
- The A-Z bar highlights letters that have matching stylists

### Gap Analysis and Enhancement Opportunities

| Area | Finding | Action |
|------|---------|--------|
| **Non-providers in dropdown** | Admins, managers, receptionists showing in selector | Fix: filter by service-provider roles |
| **No location scoping** | Can't see "which stylists at Location X do which services" | Fix: add location filter |
| **No quick navigation** | Large teams need fast alphabetical access | Fix: A-Z letter bar |
| **Stylist count missing** | No indicator of how many stylists match current filters | Enhancement: show count badge |
| **Search** | No text search for stylist name | Future: add search input for very large teams (20+) |
| **Bulk assign by service** | Can only assign services per stylist, not stylists per service | Future Phase 2: inverse matrix view |
| **Location-scoped qualifications** | `location_id` column exists but configurator doesn't use it | Future: allow different service sets per location for the same stylist |

### Technical Plan

**File: `src/hooks/useStaffServiceConfigurator.ts`**

Update `useActiveStylists` to:
- Accept optional `locationId` parameter
- Join with `user_roles` to filter by `stylist`, `stylist_assistant`, `booth_renter` roles only
- Apply location filter on `employee_profiles.location_id` when set
- Return results sorted alphabetically

**File: `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx`**

- Add state for `locationFilter` and `letterFilter`
- Import `useActiveLocations` for the location dropdown
- Add a filter bar row with Location select + A-Z letter buttons
- Filter the stylists list client-side by selected letter
- Show active letter count and total stylist count
- Polish card styling: tighter spacing, muted filter labels, responsive layout

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useStaffServiceConfigurator.ts` | Filter `useActiveStylists` by service-provider roles and optional location |
| `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx` | Add location dropdown, A-Z bar, role filtering, UI enhancements |

