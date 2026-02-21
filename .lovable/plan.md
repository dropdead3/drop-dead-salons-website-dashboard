
## Show Uncategorized Services After Category Deletion

### The Problem

When you delete a service category, the services in it keep their old category name in the database, but the UI only renders services grouped by entries in the `service_category_colors` table. Since the color row is deleted, those services become invisible -- there's no way to find, reassign, or manage them.

### The Fix

Add an "Uncategorized" section at the bottom of the Services Hub that automatically appears when any services exist whose category doesn't match a configured category.

### How It Will Work

1. After the sortable category accordion, compute which services are "orphaned" (their `category` value doesn't match any `localOrder` category name)
2. If any orphaned services exist, render an "Uncategorized" section with a muted style
3. Each service row works the same as normal -- you can click to edit, reassign to a real category, toggle active/inactive, or delete
4. The section disappears automatically once all orphaned services are reassigned or removed

### Technical Details

**File: `ServicesSettingsContent.tsx`**

1. **Compute uncategorized services** (new `useMemo` after `servicesByCategory`):
   ```
   const uncategorizedServices = allServices that have a category
   NOT matching any localOrder category_name, OR have null/empty category
   ```

2. **Render section** after the `</DndContext>` block and before the add-on cards:
   - A collapsible card/section styled with muted tones
   - Header: "Uncategorized" with a count badge
   - Lists orphaned services using the same service row pattern (name, price, margin badge, edit/delete actions)
   - Each service is editable via the existing `ServiceEditorDialog`, allowing reassignment to an active category

3. **No database changes needed** -- this is purely a UI visibility fix

### Changes

| File | What |
|------|------|
| `ServicesSettingsContent.tsx` | Add uncategorized services computation + render section below the category accordion |
