

# Fix Show/Hide Buttons in Quick Actions by Role

## Problem Analysis

The Show/Hide buttons in the "Quick Actions by Role" section aren't working properly because:

1. **Incomplete visibility entries**: Not all roles have visibility entries for all dashboard elements
   - `super_admin`: Only 29 of 44 elements have entries
   - Other roles: 41 of 44 elements
   - `admin`, `manager`: 44 of 44 (complete)

2. **Filter condition skips missing entries**: The `handleBulkToggle` function filters with:
   ```typescript
   el.roles[roleName as AppRole] !== undefined
   ```
   This means elements without visibility entries for a role are silently skipped.

3. **Stats are misleading**: The stats show "X of Y visible" based only on existing entries, not all possible elements. This makes it appear nothing changed.

---

## Solution

### Fix 1: Auto-sync missing entries before bulk toggle

Modify `handleBulkToggle` to create missing visibility entries before toggling, or run sync first.

**File: `src/components/dashboard/settings/CommandCenterContent.tsx`**

Update the `handleBulkToggle` function to:
1. First identify elements that are missing entries for the target role
2. Create those entries (using the add mutation or a new bulk insert)
3. Then perform the toggle

```typescript
const handleBulkToggle = async (roleName: string, setVisible: boolean) => {
  // Find elements that need updating (already have entries)
  const updates = allElements
    .filter(el => el.roles[roleName as AppRole] !== undefined && el.roles[roleName as AppRole] !== setVisible)
    .map(el => ({
      elementKey: el.element_key,
      role: roleName as AppRole,
      isVisible: setVisible,
    }));
  
  // Find elements missing entries for this role
  const missingElements = allElements.filter(el => el.roles[roleName as AppRole] === undefined);
  
  // Create missing entries with the target visibility
  if (missingElements.length > 0) {
    for (const el of missingElements) {
      await supabase.from('dashboard_element_visibility').insert({
        element_key: el.element_key,
        element_name: el.element_name,
        element_category: el.element_category,
        role: roleName,
        is_visible: setVisible,
      });
    }
  }
  
  // Perform updates for existing entries
  if (updates.length > 0) {
    bulkMutation.mutate(updates);
  } else if (missingElements.length > 0) {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['dashboard-visibility'] });
    toast.success('Visibility settings updated');
  }
  
  setConfirmHideRole(null);
};
```

### Fix 2: Run sync on component mount

Add automatic sync when the component loads to ensure all roles have complete entries.

```typescript
useEffect(() => {
  // Auto-sync visibility entries when component mounts
  if (!visibilityLoading && visibilityData && roles.length > 0) {
    const uniqueElements = new Set(allElements.map(el => el.element_key));
    const rolesWithMissingEntries = roles.filter(role => {
      const roleElementCount = allElements.filter(
        el => el.roles[role.name as AppRole] !== undefined
      ).length;
      return roleElementCount < uniqueElements.size;
    });
    
    if (rolesWithMissingEntries.length > 0) {
      syncMutation.mutate();
    }
  }
}, [visibilityLoading, visibilityData, roles]);
```

### Fix 3: Show accurate stats with sync indicator

Update the stats calculation to show when a role has incomplete data:

```typescript
const getRoleVisibilityStats = (roleName: string) => {
  const totalElements = allElements.length; // Total unique elements
  const roleElements = allElements.filter(el => el.roles[roleName as AppRole] !== undefined);
  const visibleCount = roleElements.filter(el => el.roles[roleName as AppRole]).length;
  return { 
    visible: visibleCount, 
    total: roleElements.length,
    incomplete: roleElements.length < totalElements
  };
};
```

And add a visual indicator when data is incomplete.

---

## Alternative Simpler Fix

Instead of the above, simply trigger a sync before each bulk toggle:

```typescript
const handleBulkToggle = async (roleName: string, setVisible: boolean) => {
  // First sync to ensure all entries exist
  await syncMutation.mutateAsync();
  
  // Then perform the bulk toggle on fresh data
  // ... existing logic
};
```

But this requires making `syncMutation` return a promise we can await.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/settings/CommandCenterContent.tsx` | Update `handleBulkToggle` to handle missing entries, add auto-sync logic, improve stats display |
| `src/hooks/useDashboardVisibility.ts` | (Optional) Add a new mutation for bulk inserting missing entries |

---

## Expected Result

After fix:
- Clicking "Show" will make ALL elements visible for that role (including creating missing entries)
- Clicking "Hide" will make ALL elements hidden for that role
- Stats will accurately reflect the visibility state
- Roles will show when they have incomplete visibility configurations

