

# Fix Kiosk Settings: Organization Defaults & Location Overrides

## Problems Identified

### 1. Database Integrity Issue
There are currently **4 duplicate org-level settings rows** (where `location_id` is `NULL`) for the same organization. This is caused by:
- **Missing unique constraint** on `(organization_id, location_id)`
- **Query bug** in `useUpdateKioskSettings`: Using `.eq('location_id', null)` instead of `.is('location_id', null)` when checking for existing settings

### 2. Missing "Push to All Locations" Feature
When editing organization defaults, there's no way to apply those changes to all locations at once.

### 3. Missing "Reset Location to Defaults" Feature  
Individual locations can't clear their custom settings to inherit from org-level defaults.

### 4. No Visual Feedback
The UI doesn't indicate which locations have custom overrides vs. using defaults.

---

## Solution

### Part 1: Fix Database (Migration)

1. **Clean up duplicate rows** - Keep only the most recent org-level settings row
2. **Add unique constraint** on `(organization_id, COALESCE(location_id, 'NULL'))` to prevent future duplicates

```sql
-- Delete duplicate org-level rows (keep most recent)
DELETE FROM organization_kiosk_settings a
USING organization_kiosk_settings b
WHERE a.organization_id = b.organization_id
  AND a.location_id IS NULL
  AND b.location_id IS NULL
  AND a.updated_at < b.updated_at;

-- Add unique constraint
CREATE UNIQUE INDEX organization_kiosk_settings_org_loc_unique 
ON organization_kiosk_settings (organization_id, COALESCE(location_id, '___NULL___'));
```

### Part 2: Fix Query Bug in Hook

Update `useUpdateKioskSettings` to properly handle NULL location_id:

```typescript
// When checking for existing settings
const query = supabase
  .from('organization_kiosk_settings')
  .select('id')
  .eq('organization_id', organizationId);

// Use proper NULL handling
if (locationId) {
  query.eq('location_id', locationId);
} else {
  query.is('location_id', null);
}
```

### Part 3: Add "Push to All Locations" Feature

When viewing **Organization Defaults**, add a button:

```text
+----------------------------------------------------------+
|  💾 Save Kiosk Settings                                  |
+----------------------------------------------------------+
|  📤 Push Defaults to All Locations                       |
|  This will overwrite all location-specific settings      |
+----------------------------------------------------------+
```

**Logic:**
1. Delete all location-specific settings for this org
2. Each location will then automatically inherit from org defaults

### Part 4: Add "Reset to Defaults" Feature

When viewing a **specific location**, add an option:

```text
+----------------------------------------------------------+
|  💾 Save Location Settings                               |
+----------------------------------------------------------+
|  🔄 Reset to Organization Defaults                       |
|  Remove custom settings and inherit from defaults        |
+----------------------------------------------------------+
```

**Logic:**
1. Delete the location-specific settings row
2. Location will then fall back to org defaults

### Part 5: Visual Indicators

In the location selector dropdown, show which locations have custom overrides:

```text
+------------------------------------+
| 🏢 Organization Defaults           |
+------------------------------------+
| 📍 North Mesa      ✏️ Customized   |
| 📍 Val Vista Lakes ✏️ Customized   |
| 📍 South Chandler  (uses defaults) |
+------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | New migration: cleanup duplicates, add unique constraint |
| `src/hooks/useKioskSettings.ts` | Fix NULL handling, add `usePushDefaultsToAllLocations` and `useResetLocationToDefaults` hooks, add `useLocationKioskOverrides` query hook |
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Add "Push to All" button when editing defaults, add "Reset to Defaults" button when editing location, enhance location selector with override indicators |

---

## Implementation Details

### New Hook: Push Defaults to All Locations

```typescript
export function usePushDefaultsToAllLocations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (organizationId: string) => {
      // Delete all location-specific settings
      const { error } = await supabase
        .from('organization_kiosk_settings')
        .delete()
        .eq('organization_id', organizationId)
        .not('location_id', 'is', null);
      
      if (error) throw error;
    },
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({ queryKey: ['kiosk-settings'] });
      queryClient.invalidateQueries({ queryKey: ['kiosk-settings-location'] });
      queryClient.invalidateQueries({ queryKey: ['kiosk-location-overrides'] });
      toast.success('Defaults pushed to all locations');
    },
  });
}
```

### New Hook: Reset Location to Defaults

```typescript
export function useResetLocationToDefaults() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, locationId }: { organizationId: string; locationId: string }) => {
      const { error } = await supabase
        .from('organization_kiosk_settings')
        .delete()
        .eq('organization_id', organizationId)
        .eq('location_id', locationId);
      
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['kiosk-settings'] });
      queryClient.invalidateQueries({ queryKey: ['kiosk-settings-location', vars.locationId] });
      queryClient.invalidateQueries({ queryKey: ['kiosk-location-overrides'] });
      toast.success('Location reset to organization defaults');
    },
  });
}
```

### New Query: Get Locations with Custom Overrides

```typescript
export function useLocationKioskOverrides(organizationId?: string) {
  return useQuery({
    queryKey: ['kiosk-location-overrides', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_kiosk_settings')
        .select('location_id')
        .eq('organization_id', organizationId)
        .not('location_id', 'is', null);
      
      if (error) throw error;
      return data.map(row => row.location_id);
    },
    enabled: !!organizationId,
  });
}
```

### UI Updates

**Organization Defaults View:**
```tsx
{selectedLocation === 'all' && (
  <div className="pt-4 border-t">
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Push Defaults to All Locations
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Push to All Locations?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all location-specific customizations. 
            All {locations.length} locations will use the organization defaults.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePushToAll}>
            Yes, Push to All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
)}
```

**Location-Specific View:**
```tsx
{locationId && hasCustomOverride && (
  <Button 
    variant="ghost" 
    size="sm"
    onClick={handleResetToDefaults}
  >
    <RotateCcw className="w-4 h-4 mr-2" />
    Reset to Defaults
  </Button>
)}
```

---

## Expected Outcome

1. **No more duplicate settings** - Unique constraint prevents future issues
2. **Org defaults work correctly** - Fixed NULL handling in queries
3. **Push to All Locations** - One click to apply defaults everywhere
4. **Reset individual locations** - Clear customizations to use defaults
5. **Visual clarity** - See which locations have custom settings at a glance

