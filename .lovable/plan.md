

## Wire Add-On Assignments Between Cards

### Root Cause

There are two bugs preventing assignments from being saved:

1. **Edit flow returns wrong data shape**: When editing an existing add-on and selecting categories, the save handler calls `data?.id` to get the add-on ID. But the update hook returns `{ data: <row>, organizationId }`, so `data?.id` is `undefined` -- the assignment creation is silently skipped.

2. **Create flow only works if categories are selected during initial creation**: Most users create the add-on first, then try to assign it to categories by editing it. This hits bug #1.

### Fix

**File: `ServiceAddonsLibrary.tsx`**

Update `onSuccessWithAssignment` to handle both create and edit return shapes:

```tsx
const onSuccessWithAssignment = (result: any) => {
  // Create returns the row directly; Update returns { data: row, organizationId }
  const addonId = editingId || result?.id || result?.data?.id;
  if (addonId && selectedCategoryIds.length > 0) {
    // ... existing assignment creation logic (unchanged)
  }
  resetForm();
};
```

The simplest fix: when editing, we already have `editingId` in scope -- use that instead of trying to extract it from the mutation result. For creates, `result?.id` still works.

### What Changes

| File | Change |
|------|--------|
| `ServiceAddonsLibrary.tsx` | Fix `onSuccessWithAssignment` to use `editingId` for edits, fixing the data shape mismatch (~line 225) |

One-line fix. No database or schema changes needed. The `service_addon_assignments` table and the Booking Add-On Recommendations card are already correctly wired -- assignments just weren't being created due to the ID extraction bug.

