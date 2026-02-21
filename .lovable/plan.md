

## Archive and Restore for Categories and Services

### What You Get

- **Archive button** replaces the current delete (trash) icon on categories and services
- **Archived section** appears at the bottom of each card when archived items exist, with a muted/collapsed style
- **Restore button** on each archived item to bring it back
- **Permanent delete** button only visible to the account owner (primary owner) on archived items
- Categories and their services archive together -- archiving a category also archives its services
- Restoring a category restores it and its services back to the active list

### Database Changes

Two new columns on each table:

**`services` table:**
- `is_archived` (boolean, default false)
- `archived_at` (timestamptz, nullable)

**`service_category_colors` table:**
- `is_archived` (boolean, default false)
- `archived_at` (timestamptz, nullable)

### Hook Changes

**`useServicesData.ts`:**
- Main query filters `is_archived = false` (in addition to existing `is_active = true`)
- New `useArchivedServices()` hook to fetch archived services
- New `useArchiveService()` mutation (sets `is_archived=true, archived_at=now()`)
- New `useRestoreService()` mutation (sets `is_archived=false, archived_at=null`)
- New `usePermanentlyDeleteService()` mutation (actual DELETE, not soft-delete)

**`useServiceCategoryColors.ts`:**
- Main query filters `is_archived != true`
- New `useArchivedCategories()` hook
- New `useArchiveCategory()` mutation (archives category + all its services)
- New `useRestoreCategory()` mutation (restores category + its services)
- Existing `useDeleteCategory` becomes permanent delete (only used by primary owner on archived items)

### UI Changes

**`ServicesSettingsContent.tsx`:**

1. **Category card**: Trash icon becomes Archive icon. Confirmation dialog updated to say "Archive" instead of "Delete"
2. **Service rows**: Trash icon becomes Archive icon with updated confirmation
3. **Archived Categories section**: Collapsible section at bottom of categories card showing archived categories with Restore and (owner-only) Delete buttons
4. **Archived Services section**: Collapsible section at bottom of services card showing archived services with Restore and (owner-only) Delete buttons
5. Primary owner check uses existing `useIsPrimaryOwner()` hook to gate permanent delete

### Access Control

| Action | Who Can Do It |
|--------|--------------|
| Archive a category or service | Super Admin, Admin, Manager |
| Restore an archived item | Super Admin, Admin, Manager |
| Permanently delete archived data | Primary Owner only |

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Add `is_archived`, `archived_at` to `services` and `service_category_colors` |
| `src/hooks/useServicesData.ts` | Add archive/restore/permanent-delete mutations, filter archived from main query |
| `src/hooks/useServiceCategoryColors.ts` | Add archive/restore hooks, filter archived from main query |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Replace delete with archive, add archived sections with restore + owner-only delete |

