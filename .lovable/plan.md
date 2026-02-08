
# Fix: Modules Not Showing for Platform Users

## Root Cause

The current user is a **platform user** (`platform_owner` role). The `OrganizationContext` logic returns `null` for `effectiveOrganization` when platform users haven't explicitly selected an organization:

```typescript
// OrganizationContext.tsx lines 79-83
if (isPlatformUser) {
  return selectedOrganization;  // null if no selection
}
```

The `useOrganizationFeatures` hook then disables its query when there's no organization:

```typescript
// useOrganizationFeatures.ts line 101
enabled: !!orgId,  // Query never runs when orgId is null
```

**Result:** Platform users see "0 of 0 enabled" because the feature catalog is never fetched.

---

## Solution

Modify the `useOrganizationFeatures` hook to fetch the **feature catalog** even when no organization is selected. This allows platform users to see all available modules (with their default states) without requiring an organization selection.

When an organization IS selected, the hook will merge organization-specific overrides as it currently does.

---

## Changes Required

### File: `src/hooks/useOrganizationFeatures.ts`

**Update `useOrganizationFeatures` to handle "no org" case:**

```typescript
export function useOrganizationFeatures() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['organization-features', orgId ?? 'catalog-only'],
    queryFn: async (): Promise<MergedFeature[]> => {
      // Always fetch the catalog
      const { data: catalog, error: catalogError } = await supabase
        .from('feature_catalog')
        .select('*')
        .order('display_order', { ascending: true });

      if (catalogError) throw catalogError;

      // If no org selected, return catalog with default values
      if (!orgId) {
        return (catalog || []).map(item => ({
          ...item,
          is_enabled: item.default_enabled,
          has_override: false,
          disabled_at: null,
          last_known_config: {},
        })) as MergedFeature[];
      }

      // Get org-specific overrides
      const { data: orgFeatures, error: orgError } = await supabase
        .from('organization_features')
        .select('*')
        .eq('organization_id', orgId);

      if (orgError) throw orgError;

      // Create a map of org overrides
      const overrideMap = new Map<string, OrganizationFeature>();
      for (const feature of orgFeatures || []) {
        overrideMap.set(feature.feature_key, feature as OrganizationFeature);
      }

      // Merge catalog with org overrides
      return (catalog || []).map(item => {
        const override = overrideMap.get(item.feature_key);
        return {
          ...item,
          is_enabled: override ? override.is_enabled : item.default_enabled,
          has_override: !!override,
          disabled_at: override?.disabled_at || null,
          last_known_config: override?.last_known_config || {},
        } as MergedFeature;
      });
    },
    // Always enabled - just change behavior based on orgId presence
    enabled: true,
  });
}
```

### File: `src/components/access-hub/ModulesTab.tsx`

**Add visual indicator when viewing catalog without org context:**

Add an info banner when `effectiveOrganization` is null to inform platform users they're seeing default values:

```typescript
import { useOrganizationContext } from '@/contexts/OrganizationContext';

// Inside the component:
const { effectiveOrganization } = useOrganizationContext();

// Add this banner above the module categories when no org is selected:
{!effectiveOrganization && (
  <Card className="border-amber-500/30 bg-amber-500/5">
    <CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <Info className="h-4 w-4" />
        <span className="text-sm font-medium">
          Viewing catalog defaults. Select an organization to see org-specific settings.
        </span>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Visual Result

### Before (Platform User, No Org Selected)
```
0 of 0 enabled | 0 core (always on)
[Empty - "No modules match your search criteria"]
```

### After (Platform User, No Org Selected)
```
[Amber Banner] Viewing catalog defaults. Select an organization...

20 of 25 enabled | 3 core (always on)
[Core Features]
  ├── Command Center (enabled by default)
  ├── Schedule (enabled by default)
  └── Team Directory (enabled by default)
[Team Development]
  ├── Training Hub
  └── ...
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useOrganizationFeatures.ts` | Remove `enabled: !!orgId`, handle null org case with catalog defaults |
| `src/components/access-hub/ModulesTab.tsx` | Add info banner for platform users without org selection |

---

## Behavior Summary

| User Type | Org Selected? | What They See |
|-----------|---------------|---------------|
| Regular User | N/A (auto from profile) | Their org's feature states |
| Platform User | Yes | Selected org's feature states |
| Platform User | No | **Catalog defaults** + info banner |
