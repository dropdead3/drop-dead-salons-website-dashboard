

# Native Services & Categories Settings Dashboard

## Overview
Build a full Services Settings dashboard that lets salon owners manage their service categories and individual services natively, while migrating the remaining `phorest_services` references to the Zura-owned `services` table.

## Phase 1: Add "Services" Settings Category

Add a new `services` entry to the Settings page sidebar (in `Settings.tsx`) with icon `Scissors` and description "Categories, services & pricing". This becomes the central hub for service management.

## Phase 2: Service Categories Configurator

**New component: `ServicesSettingsContent.tsx`**

A two-section layout:

### Section A: Category Manager
- List all categories from `service_category_colors` with drag-and-drop reordering (already built in `ScheduleSettingsContent` -- we'll move/share this logic)
- Add ability to **create**, **rename**, and **delete** categories
- Creating a category adds a row to `service_category_colors`
- Deleting a category shows a warning if services are assigned to it, and optionally reassigns them to another category
- Color picker stays as-is (already functional)

### Section B: Services List (per category)
- Expandable accordion per category showing all services in that category
- Each service row shows: name, duration, price, active/inactive toggle
- "Add Service" button per category opens a service form
- Edit button per service opens the same form pre-filled
- Delete (soft-delete via `is_active = false`)

### Service Form (Dialog)
Fields:
- Name (required)
- Category (dropdown from `service_category_colors`)
- Duration (minutes, required)
- Price (currency, optional)
- Description (optional textarea)
- Requires Qualification toggle
- Same-Day Booking toggle + lead time days
- Location assignment (multi-select or "All locations")

Uses existing `useCreateService` and `useUpdateService` hooks from `useServicesData.ts`.

## Phase 3: Database Changes

### Migration 1: Add `organization_id` to `service_category_colors`
The category colors table currently has no org scoping. Add `organization_id UUID REFERENCES organizations(id)` and backfill existing rows with the default organization. Add RLS policies.

### Migration 2: Ensure `services` table has RLS
Verify and add proper RLS policies on the `services` table for authenticated users scoped by `organization_id`.

## Phase 4: Migrate Phorest References

Update the following files to read from `services` instead of `phorest_services`:

| File | Current | Change |
|------|---------|--------|
| `usePhorestServices.ts` | Reads `phorest_services` | Redirect to `useServicesData` hooks, deprecate |
| `useServiceCategoryColors.ts` | Syncs from `phorest_services` | Sync from `services` table |
| `WalkInDialog.tsx` | Direct `phorest_services` query | Use `useServicesData` |
| `ServiceLinksTab.tsx` | Direct `phorest_services` query | Use `useServicesData` |
| `ServiceFormLinkDialog.tsx` | Direct `phorest_services` query | Use `useServicesData` |
| `PublicBooking.tsx` | Direct `phorest_services` query | Use `useServicesData` |
| `useSalesAnalytics.ts` | Category mapping from `phorest_services` | Use `services` |
| `useServiceCommunicationFlows.ts` | Direct `phorest_services` query | Use `services` |

Edge functions (`sync-phorest-services`, `check-phorest-availability`, `create-phorest-booking`) will remain as-is since they are Phorest-specific sync/API functions that write into the system.

## Phase 5: Update Schedule Settings

The existing `ScheduleSettingsContent.tsx` currently contains the category color/ordering UI. After Phase 2:
- Move the category management into the new Services settings section
- Keep `ScheduleSettingsContent` focused on calendar display preferences (theme, scheduling blocks like Break/Block)
- Update the empty-state text that currently says "Categories will appear here once services are synced from Phorest" to reference the new Services settings

## Technical Summary

**New files:**
- `src/components/dashboard/settings/ServicesSettingsContent.tsx` -- main services settings page
- `src/components/dashboard/settings/ServiceFormDialog.tsx` -- create/edit service dialog
- `src/components/dashboard/settings/CategoryFormDialog.tsx` -- create/rename category dialog

**Modified files:**
- `src/pages/dashboard/admin/Settings.tsx` -- add "services" category
- `src/hooks/useServiceCategoryColors.ts` -- add create/rename/delete mutations, org scoping
- `src/hooks/useServicesData.ts` -- minor enhancements (org-scoped category sync)
- `src/components/dashboard/settings/ScheduleSettingsContent.tsx` -- simplify, remove category management
- 6-8 files migrated from `phorest_services` to `services`

**Database migrations:**
- Add `organization_id` to `service_category_colors` with backfill
- RLS policies on `service_category_colors` and `services`

**No breaking changes** -- existing data is preserved, Phorest sync edge functions continue to populate the `services` table as an import source.
