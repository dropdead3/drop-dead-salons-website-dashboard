

## Services Settings Page: Deep Dive Analysis + Enhancement Plan

### Current Architecture Overview

The Services Settings page has **four cards** stacked vertically:

1. **SERVICE CATEGORIES** -- Drag-to-reorder list with color badges, rename/delete actions
2. **SERVICE ADD-ONS** -- Library of add-on items with price/cost/margin tracking
3. **BOOKING ADD-ON RECOMMENDATIONS** -- Assignment UI linking add-ons to categories/services
4. **SERVICES** -- Accordion of categories, each expanding to show services with click-to-edit

Each service opens a **tabbed editor dialog** (Details, Level Pricing, Stylist Overrides, Location Pricing, Seasonal). There's also a separate "Add Service" dialog (`ServiceFormDialog`) used only for creation, which has **different fields** than the editor -- this is a core problem.

---

### Issues Found

#### Issue 1: Two Separate Service Dialogs With Different Fields

`ServiceFormDialog` (create) has fields the `ServiceEditorDialog` (edit) does NOT:
- `finishing_time_minutes`
- `content_creation_time_minutes`
- `processing_time_minutes`
- `requires_new_client_consultation`

Conversely, the editor has:
- `cost` field
- `bookable_online` toggle
- Level Pricing / Stylist Overrides / Location Pricing / Seasonal tabs

This means a service created with finishing/processing time settings **cannot be edited** for those same fields later. These are orphaned fields after creation.

**Fix:** Consolidate into one dialog. Use `ServiceEditorDialog` for both create and edit. Add the missing fields (`finishing_time_minutes`, `content_creation_time_minutes`, `processing_time_minutes`, `requires_new_client_consultation`) to the editor's Details tab. Remove `ServiceFormDialog` entirely.

#### Issue 2: Delete Button Has No Confirmation

In the SERVICES accordion, the trash icon on each service row calls `deleteService.mutate(svc.id)` directly with no confirmation dialog. A single misclick permanently soft-deletes a service.

**Fix:** Add an `AlertDialog` confirmation (same pattern as category delete) before deactivating a service.

#### Issue 3: Service List Rows Missing Active/Inactive Toggle

The service rows in the accordion show name, duration, and price, but there's no way to quickly toggle a service's active status without opening the full editor. The `handleToggleActive` function exists (line 216) but is never called from the UI.

**Fix:** Add a subtle Switch or toggle icon on hover in each service row to enable/disable a service inline.

#### Issue 4: No Inline Service Reordering Within a Category

Categories can be drag-reordered, but individual services within a category cannot. They're sorted alphabetically by name from the database query. There's no `display_order` on services.

**Fix (future consideration):** This would require a `display_order` column on the `services` table. Flag as a Phase 2 enhancement, not critical for now.

#### Issue 5: Duplicate "Haircuts" and "Haircut" Categories

The live data shows both "Haircut" (8 services) and "Haircuts" (0 services). This is likely a data quality issue, not a code issue, but the UI should help prevent this by warning when creating a category with a similar name.

**Fix:** Add a fuzzy match warning in `CategoryFormDialog` when the entered name closely matches an existing category (e.g., Levenshtein distance check or simple `.includes()` / plural detection).

#### Issue 6: "Haircuts" and "Vivids" Show 0 Services -- No Visual Distinction

Empty categories look identical to populated ones. There's no visual cue (muted styling, warning badge) to indicate a category is unused.

**Fix:** Mute the text and add a subtle "empty" indicator for categories with 0 services in the SERVICE CATEGORIES card.

#### Issue 7: Services Card Doesn't Show Cost or Margin Inline

The accordion service rows show duration and price but not cost. Since cost is tracked on services, showing a quick margin indicator inline (like the add-ons library does) would give at-a-glance margin visibility.

**Fix:** When `svc.cost` is set, show a small margin badge next to the price in the service row (same `MarginBadge` component from the add-ons library).

#### Issue 8: "Add service to {Category}" Button Creates via the Wrong Dialog

The "+ Add service to Haircut" button in the accordion uses `ServiceFormDialog` (the simpler create form). Since we're consolidating to one dialog, this should use the unified `ServiceEditorDialog` with the category pre-selected.

**Fix:** After consolidation, all service creation goes through `ServiceEditorDialog` in create mode.

---

### Enhancement Suggestions

#### Enhancement A: Bulk Category Actions

When a category has 0 services, show a "Delete empty category" shortcut directly on the row. For categories with services, show the count more prominently with a "view services" quick link that auto-scrolls to and expands that accordion section in the SERVICES card.

#### Enhancement B: Search/Filter in Services Accordion

With 66+ services across 9 categories, there's no way to quickly find a specific service. Add a search input above the accordion that filters services across all categories and auto-expands matching ones.

#### Enhancement C: Batch Price Update

Allow selecting multiple services within a category and applying a percentage price increase/decrease. Common for annual price adjustments.

---

### Implementation Plan

**Step 1: Consolidate Service Dialogs**
- Add missing fields (`finishing_time_minutes`, `content_creation_time_minutes`, `processing_time_minutes`, `requires_new_client_consultation`) to `ServiceEditorDialog`'s Details tab
- Update all `ServiceFormDialog` callsites in `ServicesSettingsContent.tsx` to use `ServiceEditorDialog` instead
- Remove `ServiceFormDialog.tsx`

**Step 2: Add Delete Confirmation for Services**
- Add a `deleteServiceId` / `deleteServiceName` state pair
- Add an `AlertDialog` (same pattern as category delete at line 488)
- Wire the trash button to set state instead of calling mutate directly

**Step 3: Inline Service Toggle**
- Add a small Switch in each service row (visible on hover or always) that calls `handleToggleActive`
- Show muted styling for inactive services if we ever query them

**Step 4: Empty Category Styling**
- In the SERVICE CATEGORIES card, mute the row styling when `serviceCount === 0`
- Add a small "(empty)" text or different opacity

**Step 5: Duplicate Category Warning**
- In `CategoryFormDialog`, check against existing category names
- Show a yellow warning if a similar name exists (not blocking, just informational)

**Step 6: Inline Margin Display**
- Import or extract the `MarginBadge` component (currently in `ServiceAddonsLibrary`)
- Show it inline in service rows when `svc.cost` is populated

**Step 7: Service Search**
- Add a search input at the top of the SERVICES card
- Filter the accordion to only show categories/services matching the query

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/settings/ServiceEditorDialog.tsx` | Add `finishing_time_minutes`, `content_creation_time_minutes`, `processing_time_minutes`, `requires_new_client_consultation` fields to Details tab |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Replace all `ServiceFormDialog` usage with `ServiceEditorDialog`; remove import; add delete confirmation dialog for services; add empty category muting; add search input; add inline margin badges; add inline active toggle |
| `src/components/dashboard/settings/ServiceFormDialog.tsx` | Delete file (replaced by consolidated editor) |
| `src/components/dashboard/settings/CategoryFormDialog.tsx` | Add duplicate name warning |
| `src/components/dashboard/settings/ServiceAddonsLibrary.tsx` | Extract `MarginBadge` to shared location or export it |

### Build Order

1. Consolidate dialogs (Step 1) -- highest impact, removes confusion
2. Delete confirmation (Step 2) -- safety
3. Empty category styling (Step 4) -- quick visual win
4. Duplicate category warning (Step 5) -- preventive
5. Inline margin display (Step 6) -- visibility
6. Service search (Step 7) -- discoverability
7. Inline toggle (Step 3) -- convenience

