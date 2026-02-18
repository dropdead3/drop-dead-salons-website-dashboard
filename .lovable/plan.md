

# Remove Action Buttons and Add Info Notice

## What Changes

1. **Remove "Manage Levels" button** and its `StylistLevelsEditor` wrapper from the header actions
2. **Remove "Add Category" button** and its entire Dialog (the add category dialog, state, and handler)
3. **Add an info notice** below the header explaining that services and categories are pulled from Services Settings, with a link to navigate there

## Technical Details

### File: `src/components/dashboard/website-editor/ServicesContent.tsx`

**Remove from header (lines 291-347):** Replace the action buttons div with a simple info banner:

```tsx
{/* Info notice */}
<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-border">
  <Settings2 className="w-5 h-5 text-muted-foreground shrink-0" />
  <p className="text-sm text-muted-foreground">
    Services and categories are managed in{' '}
    <Link to="/dashboard/admin/services" className="underline font-medium text-foreground hover:text-primary">
      Services Settings
    </Link>
    . Use this editor to control website display, descriptions, and popular badges.
  </p>
</div>
```

**Clean up unused code:**
- Remove `isAddCategoryOpen`, `newCategoryName`, `newCategoryIsAddOn` state variables
- Remove `handleAddCategory` function
- Remove `StylistLevelsEditor` import
- Remove `useStylistLevelsSimple` import (if only used for that)
- Remove category delete and rename handlers if they exist (since categories are managed in Settings)

This keeps the Website Editor focused on **website display controls** (popular toggles, website descriptions, communication flows) while making it clear that structural changes (adding categories, managing levels) happen in Settings.
