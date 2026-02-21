

## Multi-Select for Add-On Category/Service Assignments

### The Problem

The "Apply to Category / Service" picker currently only allows selecting one category (and optionally one service within it). When an add-on like "Olaplex Treatment" applies to multiple categories (e.g., Color, Blonding, Extensions), you have to save and re-edit repeatedly to create each assignment.

### Solution

Replace the single-select dropdown with a checkbox-based multi-select, allowing you to pick multiple categories and/or specific services in one save action. Each selection creates a separate assignment row in the database (the existing data model already supports this).

### How It Will Work

1. **Category picker** becomes a popover with checkboxes (similar to the location multi-select pattern already in the codebase)
2. **When one category is selected**, an optional service-level drill-down appears (same as today) letting you pick specific services within that category
3. **When multiple categories are selected**, the service drill-down is hidden -- it applies to the entire category for each selection
4. **On save**, one assignment is created per selected category/service
5. **Label** updates dynamically: "No assignment", "Color", "2 categories", etc.

### Changes

**1. State changes in `ServiceAddonsLibrary.tsx`**

- Replace `selectedCategoryId: string | null` with `selectedCategoryIds: string[]`
- Keep `assignMode` and `linkedServiceId` for the single-category + specific-service case

**2. Replace `renderAssignmentPicker()` UI**

- Swap the `Select` component for a `Popover` with a checkbox list (categories)
- Each category row has a `Checkbox` + category name
- When exactly 1 category is checked, show the optional service-level Select below
- When 0 or 2+ categories are checked, hide the service Select

**3. Update `handleSave()` assignment logic**

- Currently creates one assignment. Updated to loop over `selectedCategoryIds` and create one assignment per category (or one service assignment if in single-category + service mode)
- Uses `Promise.all` with the existing `createAssignment.mutate` for each

**4. Update `resetForm()`**

- Clear `selectedCategoryIds` to `[]` instead of `null`

### Files Modified

| File | Change |
|------|--------|
| `ServiceAddonsLibrary.tsx` | Replace single-select category picker with multi-select checkbox popover; update save logic to create multiple assignments |

Single file change. No database changes needed -- the existing `service_addon_assignments` table already supports multiple assignments per add-on.

