

## Fix: Services Created Without Organization ID

### Root Cause

The `useCreateService` hook in `src/hooks/useServicesData.ts` does not include `organization_id` when inserting a new service. The insert payload (line 155-171) is missing this field entirely.

However, the `useServicesData` query (line 50-52) filters services by `organization_id`, so any service saved with a null org ID is invisible in the UI.

This is why the toast says "Service created successfully" but the service never appears under the category.

### Fix

**File:** `src/hooks/useServicesData.ts` -- `useCreateService` function

1. Accept `organizationId` or pull it from `useOrganizationContext` inside the hook
2. Include `organization_id` in the insert payload

Since the hook already lives alongside `useServicesData` which uses `useOrganizationContext`, the cleanest approach is to use the same context:

```typescript
export function useCreateService() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...existingFields,
          organization_id: service.organization_id || effectiveOrganization?.id || null,
        })
        .select()
        .single();
      // ...
    },
  });
}
```

### Also Fix Existing Orphaned Records

Run a database update to assign the 2 existing orphaned "Test On Zura" services to the correct organization:

```sql
UPDATE services
SET organization_id = 'fa23cd95-decf-436a-adba-4561b0ecc14d'
WHERE category = 'Test On Zura'
  AND organization_id IS NULL;
```

And fix the "Test On Zura" category color record too:

```sql
UPDATE service_category_colors
SET organization_id = 'fa23cd95-decf-436a-adba-4561b0ecc14d'
WHERE category_name = 'Test On Zura'
  AND organization_id IS NULL;
```

### Files

| File | Action |
|------|--------|
| `src/hooks/useServicesData.ts` | Add `organization_id` to insert in `useCreateService` |
| Database | Fix 2 orphaned services and 1 category color record |

