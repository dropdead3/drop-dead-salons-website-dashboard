
# Multi-Organization Account Owner Support

## Executive Summary

This feature enables account owners (typically salon owners, franchisees, or entrepreneurs) who operate multiple separate organizations to switch between them seamlessly from a single login. This is different from the existing platform admin org-switching, which is for internal support staff to impersonate customer accounts.

---

## Current Architecture Analysis

### How Users Are Currently Linked to Organizations

| Table | Purpose | Current Limitation |
|-------|---------|-------------------|
| `employee_profiles` | Stores user's profile with `organization_id` | **1:1 relationship** - each user belongs to ONE org |
| `organization_admins` | Admin-level access to an org | Can have multiple entries but **not actively used** |
| `is_primary_owner` flag | Marks the account owner | Flag on profile, tied to single org |

### Existing Org Switching (Platform Users Only)

The `OrganizationSwitcher` component currently:
- Only appears for `isPlatformUser` (internal team)
- Uses `setSelectedOrganization` from `OrganizationContext`
- Shows ALL organizations in the system (not user-specific)

### Key Insight

The `organization_admins` table already exists to link users to multiple organizations, but it's underutilized. The system currently uses `employee_profiles.organization_id` as the primary source of truth.

---

## Recommended Approach

### Strategy: Use `organization_admins` as Multi-Org Membership Table

Rather than duplicating infrastructure, leverage the existing `organization_admins` table to track which organizations a user has ownership/admin access to across multiple businesses.

```text
USER ──┬── employee_profiles (single org, where they work day-to-day)
       │
       └── organization_admins (multiple orgs they own/admin)
            ├── Org A (role: owner)
            ├── Org B (role: owner)
            └── Org C (role: owner)
```

---

## Database Changes

### 1. Extend organization_admins for Multi-Org Ownership

```sql
-- Add owner role type and improve the table
ALTER TABLE organization_admins 
  ALTER COLUMN role TYPE text;

-- Add index for fast lookup of user's organizations
CREATE INDEX IF NOT EXISTS idx_org_admins_user_role 
  ON organization_admins(user_id, role);

-- Function to get all orgs a user has admin/owner access to
CREATE OR REPLACE FUNCTION public.get_user_accessible_organizations(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT organization_id 
  FROM organization_admins 
  WHERE user_id = _user_id
  UNION
  SELECT organization_id 
  FROM employee_profiles 
  WHERE user_id = _user_id AND organization_id IS NOT NULL
$$;
```

### 2. Track Selected Organization Preference

```sql
-- Add column to store user's preferred/last-selected org
ALTER TABLE employee_profiles 
  ADD COLUMN IF NOT EXISTS active_organization_id UUID REFERENCES organizations(id);

-- This allows persistence of org selection across sessions
```

---

## Feature Flow

```text
Multi-Org Account Owner Flow
────────────────────────────

1. User logs in
   │
   ▼
2. System checks organization_admins + employee_profiles
   │
   ├── Single org found → No switcher shown (current behavior)
   │
   └── Multiple orgs found → Show organization switcher
       │
       ▼
3. User sees org switcher in sidebar header
   │
   ▼
4. Selecting different org:
   ├── Updates OrganizationContext.selectedOrganization
   ├── All data queries filter by new org
   ├── Persisted to active_organization_id
   └── Dashboard refreshes with new org's data
```

---

## Frontend Implementation

### 1. New Hook: `useUserOrganizations`

```typescript
// src/hooks/useUserOrganizations.ts

export function useUserOrganizations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: async () => {
      // Get orgs from organization_admins (multi-org ownership)
      const { data: adminOrgs } = await supabase
        .from('organization_admins')
        .select(`
          organization_id,
          role,
          organizations (*)
        `)
        .eq('user_id', user.id);
      
      // Get org from employee profile (primary org)
      const { data: profile } = await supabase
        .from('employee_profiles')
        .select('organization_id, organizations (*)')
        .eq('user_id', user.id)
        .single();
      
      // Combine and deduplicate
      const allOrgs = new Map();
      
      // Add profile org first (always primary)
      if (profile?.organizations) {
        allOrgs.set(profile.organization_id, {
          ...profile.organizations,
          role: 'primary',
        });
      }
      
      // Add admin orgs
      adminOrgs?.forEach(ao => {
        if (!allOrgs.has(ao.organization_id)) {
          allOrgs.set(ao.organization_id, {
            ...ao.organizations,
            role: ao.role,
          });
        }
      });
      
      return Array.from(allOrgs.values());
    },
    enabled: !!user?.id,
  });
}
```

### 2. New Component: `AccountOwnerOrgSwitcher`

```typescript
// src/components/dashboard/AccountOwnerOrgSwitcher.tsx

// Distinct from platform OrganizationSwitcher
// - Shows only orgs the user owns/admins
// - Different visual styling (not purple platform theme)
// - Positioned in sidebar header
// - Persists selection to profile.active_organization_id
```

### 3. Update OrganizationContext

Extend the context to support both:
- **Regular users with multiple orgs** (via org_admins)
- **Platform users** (existing behavior)

```typescript
// Key changes:
- Add `userOrganizations` from useUserOrganizations
- Show switcher when userOrganizations.length > 1
- isMultiOrgOwner boolean flag
- Persist selection preference
```

### 4. Update DashboardLayout

```text
Sidebar Header (when multi-org owner)
┌────────────────────────────────────────┐
│  🏢 Drop Dead Salons        ▾         │
│      └── Switch organization           │
├────────────────────────────────────────┤
│  📊 Command Center                     │
│  📅 Schedule                           │
│  💬 Team Chat                          │
│  ...                                   │
```

---

## UI/UX Considerations

### Switcher Appearance

| Scenario | Switcher Shown | Style |
|----------|----------------|-------|
| Single org employee | No | - |
| Multi-org owner | Yes (sidebar) | Subtle, branded |
| Platform user | Yes (header) | Purple platform theme |

### Visual Differentiation

The account owner switcher should look different from the platform switcher:
- Use organization branding/logo if available
- Gold/amber accent for "owner" context (not purple)
- Positioned in sidebar near logo, not in header bar

---

## Components to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useUserOrganizations.ts` | Fetch user's accessible organizations |
| `src/components/dashboard/AccountOwnerOrgSwitcher.tsx` | Org switcher for multi-org owners |
| `supabase/migrations/XXXX_multi_org_support.sql` | Database enhancements |

### Modified Files

| File | Changes |
|------|---------|
| `src/contexts/OrganizationContext.tsx` | Support multi-org owners, not just platform users |
| `src/components/dashboard/SidebarNavContent.tsx` | Add switcher slot for multi-org owners |
| `src/components/dashboard/DashboardLayout.tsx` | Pass org switcher visibility flag |

---

## Implementation Phases

### Phase 1: Database & Hook Foundation
1. Create migration for `active_organization_id` column
2. Create `get_user_accessible_organizations` function
3. Build `useUserOrganizations` hook
4. Add RLS policy updates for cross-org access

### Phase 2: Context & Switcher UI
1. Extend `OrganizationContext` for multi-org owners
2. Build `AccountOwnerOrgSwitcher` component
3. Integrate into `SidebarNavContent`
4. Add persistence of selection preference

### Phase 3: Data Access & Testing
1. Verify all queries respect `effectiveOrganization`
2. Test cross-org data isolation
3. Audit log org switches for owners
4. Handle edge cases (removed access, org deletion)

---

## Security Considerations

### RLS Policy Updates

The existing `user_belongs_to_org` function already checks both `organization_admins` and `employee_profiles`:

```sql
-- Current function (already supports multi-org via organization_admins)
SELECT EXISTS (
  SELECT 1 FROM public.organization_admins 
  WHERE user_id = _user_id AND organization_id = _org_id
)
OR EXISTS (
  SELECT 1 FROM public.employee_profiles 
  WHERE user_id = _user_id AND organization_id = _org_id
)
```

This means adding a user to `organization_admins` for another org will automatically grant RLS access.

### Audit Trail

Log organization switches for accountability:

```sql
-- When owner switches org context
INSERT INTO platform_audit_log (
  user_id, 
  organization_id, 
  action, 
  details
) VALUES (
  auth.uid(),
  new_org_id,
  'org_context_switch',
  jsonb_build_object(
    'from_org', previous_org_id,
    'to_org', new_org_id,
    'user_type', 'owner'
  )
);
```

---

## Adding a User to Multiple Organizations

### Admin UI Flow (Future Enhancement)

Platform admins would use the Account Detail page to add an owner to multiple orgs:

1. Navigate to Account → Users tab
2. Click "Link to Another Organization"
3. Select organization from list
4. Set role (owner, admin)
5. User now sees that org in their switcher

### Direct Database Method (Initial)

```sql
-- Add Eric Day as owner of a second organization
INSERT INTO organization_admins (user_id, organization_id, role)
VALUES (
  '1be01269-08b2-4da4-9d57-1b6ff7678317', -- Eric's user_id
  'second-org-uuid',
  'owner'
);
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Org switch latency | < 500ms |
| Data isolation verified | 100% (no cross-org leakage) |
| Session persistence | Selection survives page refresh |
| Multi-org owner activation | Configurable per user |

---

## Alternative Approaches Considered

### Option A: Separate `user_organization_memberships` Table
- **Pro**: Clean separation from admin access
- **Con**: Redundant with existing `organization_admins` table

### Option B: Array column on employee_profiles
- **Pro**: Simple single-table lookup
- **Con**: Harder to manage, no role differentiation, breaks normalization

### Chosen: Option C - Extend `organization_admins` Usage
- **Pro**: Uses existing infrastructure, already has RLS support
- **Pro**: Supports role differentiation (owner vs admin)
- **Pro**: `user_belongs_to_org` function already checks this table
