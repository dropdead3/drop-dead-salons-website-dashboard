

# Smart Multi-Location Handling for Organization Account Setup

## Problem

Single-location organizations see UI elements that don't make sense for them:
1. **"Locations" section** in Team Chat sidebar (unnecessary when there's only one location)
2. **"company-wide" channel** (redundant when everyone is in the same location - "general" serves the same purpose)
3. **Location channels** (only one would exist, identical to company-wide)

## Proposed Solution

Add an `is_multi_location` flag to organizations that drives intelligent defaults throughout the platform. This flag can be set during account provisioning and changed later in organization settings.

---

## Database Changes

### 1. Add `is_multi_location` Column to Organizations

```sql
ALTER TABLE public.organizations 
ADD COLUMN is_multi_location BOOLEAN DEFAULT false;

-- Backfill: Set true for orgs with more than 1 location
UPDATE public.organizations o
SET is_multi_location = true
WHERE (
  SELECT COUNT(*) FROM public.locations l 
  WHERE l.organization_id = o.id AND l.is_active = true
) > 1;
```

### 2. Auto-Update Flag via Trigger

When locations are added/removed, automatically update the flag:

```sql
CREATE OR REPLACE FUNCTION sync_multi_location_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Count active locations for the org
  UPDATE public.organizations
  SET is_multi_location = (
    SELECT COUNT(*) > 1 FROM public.locations
    WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multi_location_flag
AFTER INSERT OR UPDATE OR DELETE ON public.locations
FOR EACH ROW EXECUTE FUNCTION sync_multi_location_flag();
```

---

## Team Chat Behavior Changes

### Single-Location Organizations

| Feature | Behavior |
|---------|----------|
| Default channels | Only create "general" (skip "company-wide") |
| Location channels | Don't create any location-specific channels |
| Sidebar UI | Hide "Locations" section entirely |
| Channel init | Simpler setup with just "general" + "DMs" |

### Multi-Location Organizations

| Feature | Behavior |
|---------|----------|
| Default channels | Create both "company-wide" and "general" |
| Location channels | Create one channel per location |
| Sidebar UI | Show both "Channels" and "Locations" sections |
| Channel init | Full setup with location sync |

---

## Code Changes

### 1. Update `useOrganizations.ts` Interface

Add `is_multi_location` to the `Organization` type.

### 2. Modify `useChatChannels.ts` - `useInitializeDefaultChannels`

```typescript
// Check org's is_multi_location flag
const isSingleLocation = !effectiveOrganization?.is_multi_location;

// Adjust default channels
const defaultChannels = isSingleLocation
  ? [{ name: 'general', description: 'Team discussions', type: 'public' }]
  : [
      { name: 'company-wide', description: 'Organization-wide announcements', type: 'public' },
      { name: 'general', description: 'General discussions', type: 'public' },
    ];

// Skip location channel creation for single-location orgs
if (!isSingleLocation) {
  // Create location channels...
}
```

### 3. Update `ChannelSidebar.tsx`

```typescript
// Get multi-location status from org context
const { effectiveOrganization } = useOrganizationContext();
const isMultiLocation = effectiveOrganization?.is_multi_location ?? true;

// Hide Locations section for single-location orgs
{isMultiLocation && locationChannels.length > 0 && (
  <Collapsible ...>
    {/* Locations section */}
  </Collapsible>
)}
```

### 4. Update Account Provisioner Edge Function

Add `is_multi_location` parameter to provisioning request:

```typescript
interface ProvisioningRequest {
  // ...existing fields
  is_multi_location?: boolean;
}

// Set flag based on initial_locations count or explicit flag
const isMultiLocation = request.is_multi_location ?? 
  (request.initial_locations?.length ?? 0) > 1;

// Include in org insert
const { data: newOrg } = await adminClient
  .from('organizations')
  .insert({
    // ...existing fields
    is_multi_location: isMultiLocation,
  })
```

### 5. Add Toggle to Account Settings Tab

Add a switch in the Platform Admin's organization settings to manually override:

```typescript
<FeatureToggle
  label="Multi-Location Organization"
  description="Enable location-specific chat channels and team groupings"
  checked={settings.is_multi_location}
  onCheckedChange={(v) => updateSettings('is_multi_location', v)}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/[new].sql` | Add column, backfill, trigger |
| `src/hooks/useOrganizations.ts` | Add `is_multi_location` to types |
| `src/hooks/team-chat/useChatChannels.ts` | Conditional channel creation |
| `src/components/team-chat/ChannelSidebar.tsx` | Conditional Locations section |
| `supabase/functions/account-provisioner/index.ts` | Accept and set flag |
| `src/components/platform/account/AccountSettingsTab.tsx` | Add toggle for admins |

---

## Migration Strategy

1. Add column with default `false`
2. Backfill based on existing location counts
3. New orgs get flag set during provisioning
4. Flag auto-updates when locations are added/removed
5. Admins can manually override if needed

---

## Expected Behavior

| Scenario | Channels Created | Locations Section |
|----------|-----------------|-------------------|
| New single-location org | `general` only | Hidden |
| New multi-location org (2+ locations) | `company-wide`, `general`, `[location-1]`, `[location-2]` | Visible |
| Single-location adds second location | Auto-creates `company-wide` + location channels | Becomes visible |
| Multi-location removes all but one | Keeps existing channels, section hides | Hidden |

---

## Summary

This approach:
- **Simplifies** the experience for small businesses with one location
- **Scales** properly when organizations grow to multiple locations  
- **Auto-adapts** when location counts change
- **Allows override** for special cases (e.g., single location but wants company-wide channel)
- **Minimal code changes** - mostly conditional logic based on a single flag

