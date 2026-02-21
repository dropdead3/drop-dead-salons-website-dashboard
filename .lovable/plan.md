

## Make Category and Add-On Rows Clickable for Editing

### Current State

Both cards have edit functionality, but it's only accessible via small pencil icons that appear on hover. The row content area (name, description, price) is not clickable.

### Changes

**1. Service Categories card (`ServicesSettingsContent.tsx`)**

Make the name/service-count area (the `<div className="flex-1 min-w-0">` block inside each `SortableCategoryRow`) clickable. Clicking it opens the rename dialog for that category -- the same action as the pencil icon button.

- Add `onClick` + `cursor-pointer` to the name/count div
- Trigger: `setCategoryDialogMode('rename'); setEditingCategory(cat); setCategoryDialogOpen(true);`
- The color badge (popover trigger) and action buttons remain independent click targets
- Add a subtle hover indicator so users know the row is clickable

**2. Service Add-Ons card (`ServiceAddonsLibrary.tsx`)**

Make the content area of each `SortableAddonRow` clickable. Clicking it triggers `startEdit(addon)` -- the same inline edit that the pencil icon triggers.

- Add `onClick={onEdit}` + `cursor-pointer` to the content div (`<div className="flex-1 min-w-0">`)
- The drag handle, quick-assign popover, and delete button remain independent click targets
- Add the same subtle hover indicator

### Visual Treatment

Both rows already have `hover:bg-muted/40`. Adding `cursor-pointer` to the content area is sufficient to signal clickability. No new styles needed.

### Files Modified

| File | Change |
|------|--------|
| `ServicesSettingsContent.tsx` | Add `onClick` + `cursor-pointer` to category row content div (~line 414) |
| `ServiceAddonsLibrary.tsx` | Add `onClick={onEdit}` + `cursor-pointer` to addon row content div (~line 91) |

Two small, focused edits. No new components, no database changes.
