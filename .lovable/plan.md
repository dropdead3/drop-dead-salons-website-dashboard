

# Fix Team PIN Management Not Loading Team Members

## Problem

The `useTeamPinStatus` hook has the same issue we just fixed in `useValidatePin` - it only uses `effectiveOrganization`, which is `null` for platform owners who haven't selected an organization.

This is why Alex (and all team members) aren't appearing in the Team PIN Management tab.

## Root Cause

In `src/hooks/useUserPin.ts` (lines 243-272):

```typescript
export function useTeamPinStatus() {
  const { effectiveOrganization } = useOrganizationContext();  // Only effectiveOrganization!

  return useQuery({
    queryKey: ['team-pin-status', effectiveOrganization?.id],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return [];  // Returns empty if null
      // ...
    },
    enabled: !!effectiveOrganization?.id,  // Disabled if null
  });
}
```

For platform users:
- `effectiveOrganization?.id` is `undefined`
- Query is disabled (`enabled: false`)
- Even if it ran, early return `[]`

## Solution

Apply the same fix we used for `useValidatePin` - also use `currentOrganization` as a fallback.

## File to Modify

### `src/hooks/useUserPin.ts`

Update the `useTeamPinStatus` function:

```typescript
export function useTeamPinStatus() {
  const { effectiveOrganization, currentOrganization } = useOrganizationContext();

  // Use effectiveOrganization first, fall back to currentOrganization
  // This handles platform users who haven't selected an org
  const orgId = effectiveOrganization?.id || currentOrganization?.id;

  return useQuery({
    queryKey: ['team-pin-status', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, is_super_admin, is_primary_owner, login_pin')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('full_name');

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.display_name || profile.full_name,
        photo_url: profile.photo_url,
        is_super_admin: profile.is_super_admin,
        is_primary_owner: profile.is_primary_owner,
        has_pin: !!profile.login_pin,
      }));
    },
    enabled: !!orgId,
  });
}
```

## Why This Works

- `currentOrganization` is derived from the user's `employee_profiles.organization_id` - it's always available if the user belongs to an organization
- For platform owners who haven't selected a specific org, this fallback ensures they can still manage their team's PINs
- This is consistent with the fix we just applied to `useValidatePin`

