
# Fix PIN Validation for Platform Users

## The Problem

Your PIN validation is failing because you're a **platform owner**. Platform users have special organization handling that breaks the PIN unlock flow:

1. For platform users, `effectiveOrganization` is `null` unless they explicitly select an organization
2. When the dashboard is locked, the PIN validation tries to use `effectiveOrganization.id`
3. Since it's `null`, the validation throws "No organization context" error
4. This error gets caught and displayed as "Incorrect PIN" - even though your PIN (`3746`) is correctly set

## Technical Root Cause

In `OrganizationContext.tsx`:
```typescript
if (isPlatformUser) {
  return selectedOrganization; // NULL if no org selected!
}
```

In `useUserPin.ts`:
```typescript
if (!effectiveOrganization?.id) throw new Error('No organization context');
```

The error is caught in `DashboardLockScreen.tsx` and shown as "Incorrect PIN".

## Solution

Modify the `useValidatePin` hook to also access `currentOrganization` and use it as a fallback when `effectiveOrganization` is null. This ensures platform users can always unlock with their PIN using their primary organization.

## Files to Modify

### `src/hooks/useUserPin.ts`

Update the `useValidatePin` function to use `currentOrganization` as a fallback:

```typescript
export function useValidatePin() {
  const { effectiveOrganization, currentOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (pin: string): Promise<PinValidationResult | null> => {
      // Use effectiveOrganization first, fall back to currentOrganization
      // This handles platform users who haven't selected an org
      const orgId = effectiveOrganization?.id || currentOrganization?.id;
      
      if (!orgId) throw new Error('No organization context');

      const { data, error } = await supabase
        .rpc('validate_user_pin', {
          _organization_id: orgId,
          _pin: pin,
        });

      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null;
    },
  });
}
```

## Why This Works

- `effectiveOrganization` - The org you're currently viewing/impersonating (null for platform users without selection)
- `currentOrganization` - Your primary organization from your employee profile (always available if you belong to an org)

By falling back to `currentOrganization`, platform users can always unlock the dashboard using their own org's PIN validation, even when they haven't selected a specific organization to view.

## Bonus Fix (Optional)

Also fix the empty `display_name` issue in your profile - currently it's an empty string rather than NULL, so COALESCE doesn't work properly. This is a separate data issue but can be fixed with:

```sql
UPDATE employee_profiles 
SET display_name = NULL 
WHERE display_name = '' AND user_id = '1be01269-08b2-4da4-9d57-1b6ff7678317';
```
