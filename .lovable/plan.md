

# Multi-Tenant SaaS Platform Packaging Plan

## Current State Assessment

Based on my thorough analysis of the codebase, here's what exists and what's missing for a proper multi-tenant platform:

### What's Already Built
| Component | Status | Notes |
|-----------|--------|-------|
| Platform roles table | Done | `platform_roles` with owner, admin, support, developer roles |
| Platform login page | Done | `/platform-login` with dark theme |
| Platform route protection | Done | `requireAnyPlatformRole` / `requirePlatformRole` props |
| Platform admin hub pages | Done | Overview, Accounts, Account Detail, Import, Settings |
| Platform team management | Done | Team manager UI in Platform Settings |
| Auth context with platform roles | Done | `platformRoles`, `isPlatformUser`, `hasPlatformRole` |

### Critical Gaps for Scaling

| Issue | Impact | Priority |
|-------|--------|----------|
| **Organizations table missing** | Cannot store salon accounts | Critical |
| **No organization_id on data tables** | No data isolation between salons | Critical |
| **No tenant-aware RLS policies** | Data leakage between accounts | Critical |
| **Hooks not organization-scoped** | Queries return all data | High |
| **No organization context in App** | Platform can't switch contexts | High |
| **Platform navigation not in sidebar** | Hard to navigate platform | Medium |

---

## Architecture Overview

The platform will have two distinct user experiences:

```text
PLATFORM TEAM (your dev/support team)
├── Login at /platform-login
├── Access Platform Admin Hub
├── Manage multiple organizations
└── Switch context to work "as" an organization

SALON STAFF (your customers)
├── Login at /staff-login
├── Access salon dashboard
├── Only see their organization's data
└── No awareness of other organizations
```

---

## Implementation Plan

### Phase 1: Database Foundation (Critical)

Create the multi-tenant schema with proper isolation:

**1.1 Create Organizations Table**
```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, suspended, churned
  onboarding_stage TEXT DEFAULT 'new', -- new, importing, training, live
  subscription_tier TEXT DEFAULT 'standard',
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  source_software TEXT, -- phorest, mindbody, boulevard, etc.
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);
```

**1.2 Create Organization Admins Table**
```sql
CREATE TABLE public.organization_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'admin', -- owner, admin
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
```

**1.3 Add organization_id to Data Tables**

These tables need `organization_id` foreign keys:

| Table | Migration Strategy |
|-------|-------------------|
| `locations` | Add FK, nullable initially |
| `employee_profiles` | Add FK, nullable initially |
| `clients` | Add FK, nullable initially |
| `appointments` | Add FK, nullable initially |
| `services` | Add FK, nullable initially |
| `import_jobs` | Add FK, already has template |
| `user_roles` | Add FK (users belong to org) |

**1.4 Create Helper Functions**
```sql
-- Check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_admins 
    WHERE user_id = _user_id AND organization_id = _org_id
  )
  OR EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE user_id = _user_id AND organization_id = _org_id
  )
  OR public.is_platform_user(_user_id)
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Get user's primary organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM employee_profiles WHERE user_id = _user_id LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
```

**1.5 Update RLS Policies**

All data tables need organization-scoped policies:
```sql
-- Example for appointments
CREATE POLICY "Users can view org appointments"
ON public.appointments FOR SELECT
USING (
  organization_id = public.get_user_organization(auth.uid())
  OR public.is_platform_user(auth.uid())
);
```

---

### Phase 2: Application Layer Updates

**2.1 Update Organization Context**

Enhance the context to support:
- Current organization for salon users (auto-detected from profile)
- Selected organization for platform users (manual selection)

```typescript
interface OrganizationContextValue {
  currentOrganization: Organization | null;      // User's org
  selectedOrganization: Organization | null;    // Platform override
  effectiveOrganization: Organization | null;   // Which to use
  setSelectedOrganization: (org: Organization | null) => void;
  isImpersonating: boolean;
}
```

**2.2 Update Hooks to be Organization-Aware**

All data hooks need to accept and use `organizationId`:

```typescript
// Example: useLocations becomes organization-aware
export function useLocations(organizationId?: string) {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = organizationId || effectiveOrganization?.id;
  
  return useQuery({
    queryKey: ['locations', orgId],
    queryFn: async () => {
      let query = supabase.from('locations').select('*');
      if (orgId) query = query.eq('organization_id', orgId);
      // ...
    },
  });
}
```

Hooks to update:
- `useLocations`
- `useCalendar` / `useAppointments`
- `useClientsData`
- `useServicesData`
- `useEmployeeProfile` (for listing staff)
- All analytics/reporting hooks

**2.3 Wrap App with Organization Provider**

```typescript
// src/App.tsx
<AuthProvider>
  <OrganizationProvider>
    {/* ... rest of app */}
  </OrganizationProvider>
</AuthProvider>
```

---

### Phase 3: Platform Navigation & UI

**3.1 Add Platform Section to Sidebar**

Create a dedicated platform navigation section visible only to platform users:

```typescript
const platformNavItems: NavItem[] = [
  { href: '/dashboard/platform/overview', label: 'Platform Overview', icon: Terminal, platformOnly: true },
  { href: '/dashboard/platform/accounts', label: 'Salon Accounts', icon: Building2, platformOnly: true },
  { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload, platformOnly: true },
  { href: '/dashboard/platform/settings', label: 'Platform Settings', icon: Settings, platformOnly: true },
];
```

**3.2 Organization Switcher for Platform Users**

Add a dropdown in the header/sidebar for platform users to switch organization context:

```text
┌─────────────────────────────────┐
│ Viewing as: [Select Salon ▼]   │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search salons...         │ │
│ │ • Hair Studio ABC           │ │
│ │ • Beauty Bar XYZ            │ │
│ │ • Salon 123                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**3.3 Platform Context Banner**

When a platform user is viewing as an organization, show a banner:
```text
┌────────────────────────────────────────────────────┐
│ 🔄 Viewing as: Hair Studio ABC  [Exit View Mode]  │
└────────────────────────────────────────────────────┘
```

---

### Phase 4: Data Migration

**4.1 Create Default Organization**

Migrate existing data to a default organization:

```sql
-- Create default org for existing data
INSERT INTO organizations (name, slug, status, onboarding_stage)
VALUES ('Default Salon', 'default-salon', 'active', 'live')
RETURNING id;

-- Update all existing records
UPDATE locations SET organization_id = '{default_org_id}';
UPDATE employee_profiles SET organization_id = '{default_org_id}';
UPDATE clients SET organization_id = '{default_org_id}';
-- etc.
```

**4.2 Make organization_id NOT NULL**

After migration, add NOT NULL constraints:

```sql
ALTER TABLE locations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE employee_profiles ALTER COLUMN organization_id SET NOT NULL;
-- etc.
```

---

### Phase 5: Enhanced Platform Features

**5.1 Organization Onboarding Flow**
- Step 1: Create organization record
- Step 2: Set up admin user
- Step 3: Configure locations
- Step 4: Import data (optional)
- Step 5: Training/handoff

**5.2 Organization Health Dashboard**
- Active users count
- Recent activity
- Storage usage
- Feature adoption metrics

**5.3 Audit Logging**
```sql
CREATE TABLE public.platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/components/platform/OrganizationSwitcher.tsx` | Dropdown for platform users to switch org context |
| `src/components/platform/PlatformContextBanner.tsx` | Banner showing current organization being viewed |
| `src/components/platform/OnboardingWizard.tsx` | Multi-step new organization setup |
| `src/hooks/useOrganizationContext.ts` | Enhanced org context hook |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with `OrganizationProvider` |
| `src/contexts/OrganizationContext.tsx` | Add effective organization logic |
| `src/hooks/useLocations.ts` | Add organization_id filtering |
| `src/hooks/useCalendar.ts` | Add organization_id filtering |
| `src/hooks/useClientsData.ts` | Add organization_id filtering |
| `src/hooks/useServicesData.ts` | Add organization_id filtering |
| `src/components/dashboard/DashboardLayout.tsx` | Add platform nav section |
| `src/components/dashboard/SidebarNavContent.tsx` | Platform section rendering |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Cross-org data access | RLS policies with `user_belongs_to_org()` check |
| Platform user impersonation | Audit log all context switches |
| Privilege escalation | Platform roles separate from salon roles |
| Data isolation | All queries scoped to `organization_id` |
| API access | Edge functions validate org membership |

---

## Implementation Order

1. **Week 1**: Database schema (organizations table, FKs, RLS)
2. **Week 1**: Data migration (create default org, update existing records)
3. **Week 2**: Organization context provider update
4. **Week 2**: Update core hooks to be org-aware
5. **Week 3**: Platform navigation and org switcher UI
6. **Week 3**: Testing and security audit
7. **Week 4**: Enhanced platform features (onboarding wizard, analytics)

---

## Next Steps

After approval, I'll implement in this order:

1. Create the `organizations` table with proper schema
2. Create `organization_admins` table
3. Add `organization_id` columns to core data tables
4. Create helper functions for org access checks
5. Update RLS policies for organization isolation
6. Migrate existing data to a default organization
7. Update the `OrganizationContext` for dual-mode operation
8. Update hooks to be organization-aware

