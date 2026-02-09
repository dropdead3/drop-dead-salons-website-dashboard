

# Fix Kiosk Organization Context for Unauthenticated Users

## Problem

The Kiosk Settings Dialog shows "Unable to save: Organization not found" because:

1. The kiosk runs without a logged-in Supabase user (it's a public-facing check-in terminal)
2. The `useValidatePin` hook uses `useOrganizationContext()` which requires an authenticated user to determine the organization
3. The `updateSettings` mutation is blocked by RLS policies that require `is_org_admin(auth.uid(), organization_id)`

## Root Cause Analysis

The data flow shows a disconnect:

```text
KioskProvider
├── useKioskSettingsByLocation(locationId)
│   └── Queries locations table (public read) ✓
│   └── Returns organizationId from location ✓
│   └── This works because locations has "Anyone can view active locations" RLS
│
KioskSettingsDialog
├── Uses useKiosk().organizationId ✓ (available from location lookup)
├── Uses useValidatePin() ✗
│   └── Uses useOrganizationContext()
│   └── Requires auth.uid() to get organization
│   └── Returns null when not logged in
├── Uses updateSettings.mutateAsync() ✗
    └── RLS: "Org admins can manage kiosk settings"
    └── Requires is_org_admin(auth.uid(), organization_id)
    └── Fails because auth.uid() is null
```

## Solution

### Part 1: Create Kiosk-Specific PIN Validation

Create a new hook that validates PINs using the organization ID from the location lookup (already available in KioskProvider) instead of the auth context.

**New hook: `useKioskValidatePin`**

```typescript
// In KioskSettingsDialog or a new hooks file
export function useKioskValidatePin(organizationId: string | null) {
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!organizationId) throw new Error('No organization context');

      const { data, error } = await supabase
        .rpc('validate_user_pin', {
          _organization_id: organizationId,
          _pin: pin,
        });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
  });
}
```

### Part 2: Add Public SELECT Policy for Kiosk Settings

The kiosk screen needs to read settings without auth. Add an RLS policy that allows reading kiosk settings via location lookup.

**Database Migration:**

```sql
-- Allow kiosk screens to read settings for their location
CREATE POLICY "Kiosk can read settings by location" 
ON organization_kiosk_settings
FOR SELECT
USING (
  -- Allow if the location_id matches a valid active location
  -- OR if it's org-level settings (location_id IS NULL) for a valid org
  EXISTS (
    SELECT 1 FROM locations l
    WHERE l.organization_id = organization_kiosk_settings.organization_id
    AND l.is_active = true
  )
);
```

### Part 3: Create Edge Function for Authenticated Kiosk Operations

Since kiosk users authenticate via PIN (not Supabase auth), we need an edge function that:
1. Validates the admin PIN
2. Performs the settings update using service role
3. Logs the action

**New Edge Function: `kiosk-settings`**

```typescript
// supabase/functions/kiosk-settings/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { organization_id, location_id, settings, admin_pin } = await req.json();

  // Validate admin PIN
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: pinResult, error: pinError } = await supabase
    .rpc('validate_user_pin', {
      _organization_id: organization_id,
      _pin: admin_pin,
    });

  if (pinError || !pinResult?.length) {
    return new Response(JSON.stringify({ error: 'Invalid PIN' }), { status: 401 });
  }

  const admin = pinResult[0];
  if (!admin.is_super_admin && !admin.is_primary_owner) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }

  // Upsert settings using service role
  const { data: existing } = await supabase
    .from('organization_kiosk_settings')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('location_id', location_id ?? null)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('organization_kiosk_settings')
      .update(settings)
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('organization_kiosk_settings')
      .insert({
        organization_id,
        location_id: location_id ?? null,
        ...settings,
      })
      .select()
      .single();
  }

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200 });
});
```

### Part 4: Update KioskSettingsDialog to Use New Pattern

1. Replace `useValidatePin()` with kiosk-specific PIN validation using `organizationId` from `useKiosk()`
2. Call the edge function for saving instead of direct Supabase mutation

## Implementation Summary

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskSettingsDialog.tsx` | Use organizationId from useKiosk() for PIN validation; Call edge function for save |
| `src/hooks/useKioskSettings.ts` | Add `useKioskSaveSettings` hook that calls edge function |
| `supabase/functions/kiosk-settings/index.ts` | New edge function for PIN-authenticated settings updates |
| Database migration | Add SELECT policy for kiosk screens to read settings |

## Alternative Simpler Approach

If you prefer a simpler solution without edge functions, we can:

1. **Keep the current authenticated admin workflow**: Require that the kiosk settings be configured from the dashboard (where users are logged in), not from the kiosk itself
2. **Add public SELECT policy for kiosk settings**: Allow kiosk screens to read settings without auth
3. **Remove settings editing from kiosk mode**: The settings gear icon would be dashboard-only

This is actually a common pattern - kiosk configuration is typically done from the admin dashboard, not from the kiosk terminal itself.

## Recommended Solution

I recommend the **simpler approach** for now:
1. Add RLS policy for public SELECT on kiosk settings (tied to valid locations)
2. Keep the kiosk settings dialog for emergency access but note it requires dashboard login
3. Primary kiosk configuration happens in the dashboard

This maintains security while ensuring the kiosk displays correctly with configured settings.

