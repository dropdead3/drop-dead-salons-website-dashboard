
# Complete Multi-Tenant SaaS Integration Plan

## Overview

This plan implements all the remaining pieces to make the platform fully operational for managing thousands of salon accounts. We'll complete the data isolation, add platform navigation, create a default organization, update data hooks, and integrate audit logging.

---

## What We'll Build

| Component | Description |
|-----------|-------------|
| **Platform Sidebar Navigation** | Dedicated platform section in the dashboard sidebar for platform team members |
| **Default Organization + Data Migration** | Create first salon organization and associate all existing data |
| **OrganizationProvider in App** | Wrap the app with organization context for tenant-aware queries |
| **Organization Switcher in Header** | Add the switcher to DashboardLayout for platform users |
| **Platform Context Banner** | Show notification when platform user is viewing as a specific salon |
| **Organization-Aware Hooks** | Update appointments, clients, services hooks to filter by org |
| **Enhanced Audit Logging** | Integrate logging into all platform actions |

---

## Implementation Details

### Phase 1: Platform Sidebar Navigation

Add a dedicated platform section to the sidebar that appears only for platform users.

**Changes to DashboardLayout.tsx:**
```typescript
// New platform nav items
const platformNavItems: NavItem[] = [
  { href: '/dashboard/platform/overview', label: 'Platform Overview', icon: Terminal },
  { href: '/dashboard/platform/accounts', label: 'Salon Accounts', icon: Building2 },
  { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload },
  { href: '/dashboard/platform/settings', label: 'Platform Settings', icon: Settings },
];
```

**Changes to SidebarNavContent.tsx:**
- Add new `platformNavItems` prop
- Render platform section when `isPlatformUser` is true
- Add visual separator between salon navigation and platform section
- Platform section styled with distinct background/border

---

### Phase 2: Default Organization + Data Migration

Create a database migration that:
1. Creates the first organization record (for existing salon data)
2. Updates all existing records with `organization_id`

**Migration SQL:**
```sql
-- Create default organization for existing data
INSERT INTO organizations (name, slug, status, onboarding_stage)
VALUES ('Drop Dead Gorgeous', 'drop-dead-gorgeous', 'active', 'live');

-- Get the created org ID and update all tables
DO $$
DECLARE
  default_org_id uuid;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'drop-dead-gorgeous';
  
  -- Update locations
  UPDATE locations SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update employee_profiles
  UPDATE employee_profiles SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update clients
  UPDATE clients SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update appointments
  UPDATE appointments SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update services
  UPDATE services SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
END $$;
```

---

### Phase 3: App-Level Organization Context

Wrap the application with `OrganizationProvider` and integrate the context banner and switcher.

**Changes to App.tsx:**
```typescript
import { OrganizationProvider } from './contexts/OrganizationContext';

// Wrap inside AuthProvider
<AuthProvider>
  <OrganizationProvider>
    <DashboardThemeProvider>
      {/* ... existing providers and routes */}
    </DashboardThemeProvider>
  </OrganizationProvider>
</AuthProvider>
```

**Changes to DashboardLayout.tsx:**
- Import and render `OrganizationSwitcher` in the header (for platform users)
- Import and render `PlatformContextBanner` below header (when impersonating)
- Add `isPlatformUser` from AuthContext to conditionally show platform UI

---

### Phase 4: Organization-Aware Data Hooks

Update the core data hooks to filter by `organization_id` from the context.

**useClientsData.ts:**
```typescript
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export function useClientsData(options?: {
  locationId?: string;
  stylistId?: string;
  includeInactive?: boolean;
  limit?: number;
  organizationId?: string; // NEW - explicit org override
}) {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = options?.organizationId || effectiveOrganization?.id;
  
  return useQuery({
    queryKey: ['clients-data', ..., orgId],
    queryFn: async () => {
      let query = supabase.from('clients').select('*');
      
      // Apply organization filter
      if (orgId) {
        query = query.eq('organization_id', orgId);
      }
      // ... rest of existing logic
    },
  });
}
```

**Similar updates for:**
- `useCalendar.ts` - Add org filtering to appointments query
- `useServicesData.ts` - Add org filtering to services query
- `useLocations.ts` - Already has org support, just needs context integration
- `useEmployeeProfile.ts` (team directory) - Add org filtering

**Pattern for all hooks:**
1. Import `useOrganizationContext`
2. Get `effectiveOrganization` from context
3. Add `organizationId` to query key
4. Add `.eq('organization_id', orgId)` filter when orgId exists

---

### Phase 5: Enhanced Audit Logging

Integrate audit logging across platform actions consistently.

**Actions to Log:**

| Action | Trigger Point | Details to Log |
|--------|---------------|----------------|
| `org_created` | When creating new organization | org name, created by |
| `org_status_changed` | Status changes (pending→active, etc.) | old status, new status |
| `org_viewed` | When platform user switches to view an org | org id, user |
| `migration_started` | Import job begins | source, org |
| `migration_completed` | Import job finishes | records imported |
| `platform_user_added` | New team member invited | role, email |
| `platform_user_role_changed` | Role assignment changed | old role, new role |

**Implementation:**
```typescript
// In OrganizationSwitcher when selecting an org
const handleSelectOrg = (org: Organization) => {
  setSelectedOrganization(org);
  logPlatformAction(org.id, 'org_viewed', 'organization', org.id, {
    organization_name: org.name,
    action: 'context_switch'
  });
};

// In organization mutations
onSuccess: (data) => {
  logPlatformAction(data.id, 'org_created', 'organization', data.id, {
    name: data.name,
    slug: data.slug
  });
}
```

---

## Files to Create/Modify

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with `OrganizationProvider` |
| `src/components/dashboard/DashboardLayout.tsx` | Add OrganizationSwitcher, PlatformContextBanner, platform nav props |
| `src/components/dashboard/SidebarNavContent.tsx` | Add platform section rendering with isPlatformUser check |
| `src/hooks/useClientsData.ts` | Add organization_id filtering from context |
| `src/hooks/useCalendar.ts` | Add organization_id filtering from context |
| `src/hooks/useServicesData.ts` | Add organization_id filtering from context |
| `src/hooks/useEmployeeProfile.ts` | Add organization_id filtering to team queries |
| `src/components/platform/OrganizationSwitcher.tsx` | Add audit logging on org selection |
| `src/hooks/useOrganizations.ts` | Add audit logging to mutations |
| `src/components/platform/PlatformTeamManager.tsx` | Add audit logging for team changes |

### New Migration

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_create_default_org.sql` | Create default org and migrate existing data |

---

## Technical Architecture

### Data Flow After Changes

```text
Platform User Login
        │
        ▼
    AuthContext
    (isPlatformUser = true)
        │
        ▼
    OrganizationContext
    (effectiveOrganization = null initially)
        │
        ├── Sidebar shows Platform Section
        │
        ▼
    User selects org via OrganizationSwitcher
        │
        ▼
    setSelectedOrganization(org)
        │   │
        │   └── logPlatformAction('org_viewed')
        │
        ▼
    effectiveOrganization = selectedOrg
        │
        ▼
    All hooks (useClientsData, useCalendar, etc.)
    filter by effectiveOrganization.id
        │
        ▼
    PlatformContextBanner shows "Viewing as: [Org Name]"
```

### Salon User Login

```text
Salon User Login
        │
        ▼
    AuthContext
    (isPlatformUser = false)
        │
        ▼
    OrganizationContext
    (fetches org from employee_profiles.organization_id)
        │
        ▼
    currentOrganization = user's salon
    effectiveOrganization = currentOrganization
        │
        ▼
    No platform navigation visible
    All hooks auto-filtered to their org
```

---

## Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Data isolation | RLS policies + hook-level filtering |
| Platform access | `is_platform_user()` function checks |
| Audit trail | All org switches logged |
| Context awareness | Banner clearly indicates impersonation mode |

---

## Implementation Order

1. **Database migration** - Create default org, update existing records
2. **App.tsx update** - Add OrganizationProvider wrapper
3. **DashboardLayout.tsx** - Add OrganizationSwitcher and PlatformContextBanner
4. **SidebarNavContent.tsx** - Add platform navigation section
5. **Update data hooks** - Add organization filtering to all major hooks
6. **Audit logging integration** - Add logging to key platform actions
7. **Testing** - Verify platform user flow and salon user isolation
