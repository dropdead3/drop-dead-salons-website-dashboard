

## Enhance Service Add-Ons Configurator

### Current State

The add-on system has two cards in the bento grid:
1. **Service Add-Ons Library** (left) -- define reusable add-ons with name, price, cost, duration, linked service
2. **Booking Add-On Recommendations** (right) -- assign add-ons to categories or individual services via expandable rows

The assignment card already supports both category-level and service-level assignments. The booking popover then surfaces these as smart recommendations.

### Enhancements

#### 1. Bulk "Assign to All Categories" Action

Add a quick action at the top of the Assignments card to assign an add-on to every category at once. This is common for universal add-ons like "Olaplex Treatment" or "Deep Conditioning" that apply across all service types.

- A "Bulk Assign" button opens a small dropdown to pick an add-on
- On selection, it creates assignments for all categories that don't already have that add-on
- Shows a confirmation count: "Assigned to 6 categories"

#### 2. Description Field for Add-Ons

Add an optional `description` field to the add-on library form. This text surfaces in the booking toast so stylists understand _why_ to recommend the add-on (e.g., "Repairs bonds after lightening services").

- New text input in the create/edit form
- Displayed as a subtitle in the add-on list items
- Surfaced in the ServiceAddonToast during booking

**Database**: The `service_addons` table already has a `description` column (nullable text), so no migration is needed.

#### 3. Visual Improvements to the Library Card

- Show a count badge on the card header (e.g., "4 add-ons")
- Add an empty state icon (Package) instead of just text
- Show the linked service name (not just "Linked") in the add-on row for clarity
- Group services in the linked-service picker by category for easier navigation

#### 4. Drag-to-Reorder Add-Ons in the Library

Allow admins to reorder add-ons in the library via drag handles. The `display_order` column already exists -- it just needs a UI.

- Use `@dnd-kit/sortable` (already installed) to add drag handles to the add-on list
- On reorder, batch-update `display_order` values
- Order persists and controls the order add-ons appear in booking recommendations

#### 5. Quick-Assign from Library Card

When hovering an add-on in the library, show a small "Assign" shortcut that opens a popover to pick a target category or service without needing to go to the assignments card.

---

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/components/dashboard/settings/ServiceAddonsLibrary.tsx` | Description field in form, count badge, linked service name display, drag-to-reorder with dnd-kit, category-grouped service picker, quick-assign popover |
| `src/components/dashboard/settings/ServiceAddonAssignmentsCard.tsx` | Bulk "Assign to All" action at top of card |
| `src/hooks/useServiceAddons.ts` | New `useReorderServiceAddons` mutation for batch display_order updates |
| `src/components/dashboard/schedule/ServiceAddonToast.tsx` | Show add-on description subtitle if available |

**No database migration needed** -- all columns (`description`, `display_order`, `linked_service_id`) already exist.

**Dependencies already installed:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

### Sequencing

1. Library card enhancements (description, count badge, linked service name, grouped picker)
2. Drag-to-reorder in library
3. Bulk assign action on assignments card
4. Quick-assign popover from library
5. Toast description surfacing

