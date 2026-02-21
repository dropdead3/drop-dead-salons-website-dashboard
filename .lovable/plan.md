

## Staff-Service Configurator

### What You Get

A new card in the Services & Schedule settings page where admins can control which stylists are qualified to perform which services. This directly affects what can be booked for each stylist.

### How It Works

1. **Select a stylist** from a dropdown at the top of the card
2. **See all service categories** as collapsible sections, each with checkboxes for individual services
3. **Toggle entire categories** on/off with a single click (select all / deselect all)
4. **Changes save immediately** with an undo toast (consistent with the rest of the services page)
5. When no qualifications exist for a stylist, all services default to "available" (graceful fallback for new team members)

### Where It Lives

New card in the Services & Schedule settings bento grid, placed after the existing Service Categories + Services row. Title: **"Stylist Service Assignments"**.

### Data Model

Uses the existing `staff_service_qualifications` table (already created, currently empty):

| Column | Type | Purpose |
|--------|------|---------|
| `user_id` | uuid (FK employee_profiles) | The stylist |
| `service_id` | uuid (FK services) | The service |
| `location_id` | text | Optional location scope |
| `custom_price` | numeric | Optional price override per stylist |
| `is_active` | boolean | Whether qualified (default true) |

Unique constraint already exists on `(user_id, service_id, location_id)`.

### Downstream Effect

The booking wizard already filters stylists via `useQualifiedStaffForServices`. This configurator will need a **bridge** so the booking wizard also consults `staff_service_qualifications` (not just the Phorest sync table). When manual qualifications exist, they take priority.

### Gap Analysis and Enhancements Identified

| Gap | Fix |
|-----|-----|
| **No admin UI** for managing qualifications | This plan builds the configurator |
| **Booking wizard only reads `phorest_staff_services`** | Update `useQualifiedStaffForServices` to also check `staff_service_qualifications` as a secondary/override source |
| **No RLS write policies** on `staff_service_qualifications` | Add INSERT/UPDATE/DELETE policies for admin/manager roles |
| **No "select all" for a category** | Category-level checkbox toggles all services in that group |
| **No bulk assignment** (assign a service to multiple stylists) | Future enhancement (Phase 2) -- this plan is stylist-first |
| **No custom pricing per stylist** | The `custom_price` column exists but will be surfaced as an optional inline field (Phase 2) |
| **Stylist-First booking flow reads Phorest IDs** | The `useStaffQualifiedServices` hook queries `phorest_staff_services` by `phorest_staff_id` -- needs to also query `staff_service_qualifications` by `user_id` for manual entries |

### Technical Plan

**1. Database Migration**
- Add RLS policies on `staff_service_qualifications`:
  - SELECT: authenticated users in the same org
  - INSERT/UPDATE/DELETE: admin, manager, super_admin roles

**2. New Hook: `useStaffServiceConfigurator.ts`**
- `useStaffQualifications(userId)` -- fetch all rows from `staff_service_qualifications` for a user
- `useToggleServiceQualification()` -- upsert or update `is_active` for a (user_id, service_id) pair
- `useBulkToggleCategoryQualifications()` -- batch upsert for all services in a category

**3. Update `useStaffServiceQualifications.ts`**
- Modify `useQualifiedStaffForServices` to also query `staff_service_qualifications` when `phorest_staff_services` has no data (or merge both sources)
- Modify `useStaffQualifiedServices` similarly for the stylist-first booking flow

**4. New Component: `StaffServiceConfiguratorCard.tsx`**
- Stylist selector (dropdown of active team members)
- Category accordion with service checkboxes
- Category-level "select all" toggle
- Undo toast on every toggle action
- Empty state when no stylist is selected

**5. Wire into `ServicesSettingsContent.tsx`**
- Import and render the new card in the bento grid layout

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | RLS policies for `staff_service_qualifications` |
| `src/hooks/useStaffServiceConfigurator.ts` | New hook for CRUD on qualifications |
| `src/hooks/useStaffServiceQualifications.ts` | Update to also read from `staff_service_qualifications` |
| `src/components/dashboard/settings/StaffServiceConfiguratorCard.tsx` | New UI component |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Add the new card to the layout |

### Access Control

| Action | Who Can Do It |
|--------|--------------|
| View configurator | Admin, Manager, Super Admin |
| Toggle qualifications | Admin, Manager, Super Admin |
| Custom pricing (future) | Admin, Super Admin |

