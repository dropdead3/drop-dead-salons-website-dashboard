

## Add "Restore to Category" and Undo for Uncategorized Services

### What You Get

- Each uncategorized service row gets a new **"Restore to category"** button (using an `ArchiveRestore` or `Undo2` icon)
- Clicking it recreates the original category (e.g., "Extras") in `service_category_colors` if it doesn't already exist, then the service is back in a real category
- If the category already got recreated (e.g., from restoring another service with the same "was:" label), the service just gets reassigned without creating a duplicate
- An **undo toast** appears after restoration, allowing you to reverse the action within 6 seconds
- Services without a "was:" label (null category) won't show the restore button -- they can still be edited/reassigned via the existing editor dialog

### How It Works

1. User clicks the restore icon on an uncategorized service (e.g., "Color Remover — was: Extras")
2. System checks if a category named "Extras" already exists in `service_category_colors`
   - If not, creates it with a random default color
   - If yes, skips creation
3. The service's `category` field already matches, so it becomes visible again under the restored category
4. An undo toast appears: "Restored 'Color Remover' to Extras"
   - Undo would archive the category again (if it was just created) or leave it (if it already existed)

### Technical Details

**File: `ServicesSettingsContent.tsx`**

1. Add a new handler `handleRestoreToCategory(service)` that:
   - Reads `service.category` (the "was:" value)
   - Checks if `localOrder` already has that category name
   - If not, calls `createCategory.mutate()` to recreate it
   - Shows undo toast on success

2. Add a restore button to each uncategorized service row (next to the existing archive button), only when `svc.category` is non-null

3. Wire the undo toast to archive the category back if it was freshly created

### Changes

| File | Change |
|------|--------|
| `ServicesSettingsContent.tsx` | Add restore-to-category button and handler on uncategorized service rows, with undo toast |

