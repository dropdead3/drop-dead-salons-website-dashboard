
# Fix Kiosk Settings Not Applying After Save

## Problem

When you save kiosk settings (background color, accent color, text color) in the Kiosk Settings dialog, the changes don't appear on the actual kiosk screens. The kiosk continues showing either default colors or the previously loaded values.

## Root Cause

There's a **query cache invalidation mismatch** in how React Query is being used:

| Component | Query Hook | Query Key |
|-----------|------------|-----------|
| Kiosk screens | `useKioskSettingsByLocation(locationId)` | `['kiosk-settings-location', locationId]` |
| Settings mutation | `invalidateQueries()` | `['kiosk-settings', organizationId]` |

When settings are saved, the mutation only invalidates `['kiosk-settings', ...]` but the kiosk page is listening to `['kiosk-settings-location', ...]`. Since these keys don't match, React Query doesn't know to refetch the data.

## Solution

Update the `useUpdateKioskSettings` mutation to also invalidate the location-based query key that the kiosk screens use.

### Technical Changes

**File: `src/hooks/useKioskSettings.ts`**

Update the `onSuccess` callback in `useUpdateKioskSettings` to invalidate both query keys:

```typescript
onSuccess: (_, variables) => {
  // Invalidate org-level settings queries
  queryClient.invalidateQueries({ 
    queryKey: ['kiosk-settings', variables.organizationId] 
  });
  
  // Also invalidate location-specific queries used by kiosk screens
  if (variables.locationId) {
    queryClient.invalidateQueries({ 
      queryKey: ['kiosk-settings-location', variables.locationId] 
    });
  }
  
  // Invalidate all location-based kiosk settings (for org-level changes)
  queryClient.invalidateQueries({
    queryKey: ['kiosk-settings-location'],
    exact: false, // Match any location ID
  });
  
  toast.success('Kiosk settings saved');
},
```

## Why This Works

After this fix:

```text
1. User saves kiosk settings
2. Mutation succeeds
3. onSuccess invalidates BOTH:
   - ['kiosk-settings', organizationId]
   - ['kiosk-settings-location', locationId]
4. Kiosk screens detect stale data
5. React Query automatically refetches
6. Kiosk updates with new colors ✓
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useKioskSettings.ts` | Add location-based query invalidation in `onSuccess` callback |

## Expected Outcome

After saving settings in the Kiosk Settings dialog, the kiosk screens will immediately update to reflect the new background color, accent color, and text color.
