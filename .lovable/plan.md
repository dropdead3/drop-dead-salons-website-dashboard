
# Software Overview Dashboard (Admin Portal)

## Purpose

Create a centralized admin portal for the **import team** to manage multiple salon businesses that use this software platform. This transforms the single-organization system into a multi-tenant SaaS model with:

- Salon account provisioning and management
- Data migration/import tracking per salon
- Integration status monitoring
- Account health metrics

---

## Architecture Change: Multi-Tenant Foundation

Currently, the system is a **single-organization, multi-location** platform. To support an import team managing **multiple independent salons**, we need to introduce an `organizations` table at the top of the hierarchy.

### New Database Structure

```text
organizations (NEW - top-level tenant)
├── locations (existing - now linked to organization)
├── clients (via location_id)
├── appointments (via location_id)
├── services (via location_id)
├── employee_profiles (via organization_id)
└── import_jobs (add organization_id)
```

### Schema Changes

| Table | Change |
|-------|--------|
| `organizations` | **NEW** - Primary tenant entity with salon business details |
| `organization_admins` | **NEW** - Users who can manage a specific organization |
| `locations` | Add `organization_id` FK |
| `employee_profiles` | Add `organization_id` FK |
| `import_jobs` | Add `organization_id` FK |
| `business_settings` | Rename/repurpose to `organization_settings` |

---

## New Tables

### organizations

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Business/DBA name |
| `legal_name` | text | Official legal name |
| `slug` | text | URL-friendly identifier (unique) |
| `status` | enum | `pending`, `active`, `suspended`, `churned` |
| `subscription_tier` | text | Pricing tier/plan |
| `onboarding_stage` | text | `new`, `importing`, `training`, `live` |
| `primary_contact_email` | text | Main contact |
| `primary_contact_phone` | text | Phone number |
| `source_software` | text | Previous software (Phorest, Mindbody, etc.) |
| `created_at` | timestamptz | Account creation |
| `activated_at` | timestamptz | When they went live |
| `settings` | jsonb | Org-level config |

### organization_admins

| Column | Type | Description |
|--------|------|-------------|
| `organization_id` | uuid | FK to organizations |
| `user_id` | uuid | FK to auth.users |
| `role` | text | `owner`, `admin`, `support` |
| `created_at` | timestamptz | When added |

---

## Software Overview Dashboard Pages

### 1. Main Hub: `/dashboard/platform/overview`

A command center for the import team showing:

**Stats Grid (Bento Style)**
- Total Active Salons
- Salons in Onboarding
- Pending Migrations
- Active Users Across Platform
- Monthly Active Locations

**Recent Activity Feed**
- New sign-ups
- Completed migrations
- Support escalations
- Account status changes

**Quick Actions**
- Create New Salon Account
- Start Migration
- View All Accounts

### 2. Accounts List: `/dashboard/platform/accounts`

Filterable/searchable table of all salon organizations:

| Column | Description |
|--------|-------------|
| Salon Name | Business name with avatar |
| Status | Active, Onboarding, Suspended badge |
| Locations | Count of locations |
| Users | Active user count |
| Source | Previous software |
| Migration Stage | Progress indicator |
| Created | Account age |
| Actions | View, Import, Configure |

**Filters**: Status, Onboarding Stage, Source Software, Date Range

### 3. Salon Detail: `/dashboard/platform/accounts/:orgId`

Deep dive into a single salon account:

**Tabs**:
- **Overview** - Key metrics, health status
- **Locations** - Manage locations for this org
- **Users** - Staff accounts under this org
- **Imports** - Migration history specific to this org
- **Settings** - Org-level configuration
- **Activity Log** - Audit trail

### 4. Data Import Hub: `/dashboard/platform/import` (Enhanced)

Builds on existing `/dashboard/admin/import` but with organization context:

- Select target organization before importing
- Track migration progress per org
- Rollback/retry capabilities
- Import templates per source software

---

## User Interface Components

### New Components to Create

| Component | Purpose |
|-----------|---------|
| `PlatformLayout.tsx` | Wrapper for platform admin pages |
| `OrganizationSelector.tsx` | Dropdown to switch org context |
| `AccountsTable.tsx` | Data table for salon accounts |
| `AccountDetailCard.tsx` | Summary card for org details |
| `MigrationProgressCard.tsx` | Visual migration status |
| `CreateOrganizationDialog.tsx` | New account wizard |
| `OnboardingChecklist.tsx` | Track onboarding steps |

### New Hooks

| Hook | Purpose |
|------|---------|
| `useOrganizations` | CRUD for organizations |
| `useOrganizationStats` | Platform-wide analytics |
| `useOrganizationContext` | Current org selection |
| `useImportsByOrg` | Import jobs filtered by org |

---

## Permissions & Access Control

### New Permissions

| Permission | Description |
|------------|-------------|
| `view_platform_admin` | Access platform overview |
| `manage_organizations` | Create/edit salon accounts |
| `view_all_organizations` | See all salons (vs just assigned) |
| `perform_migrations` | Execute data imports |

### Access Levels

| Role | Access |
|------|--------|
| Platform Super Admin | Full access to all orgs |
| Platform Support | View all + limited actions |
| Org Owner | Only their organization |
| Org Admin | Only their organization |

---

## Implementation Phases

### Phase 1: Database Foundation
1. Create `organizations` table with status/onboarding fields
2. Create `organization_admins` junction table
3. Add `organization_id` to existing tables (nullable for migration)
4. Create RLS policies for organization-scoped access
5. Migrate current data to a default "primary" organization

### Phase 2: Core UI
1. Create `PlatformOverview.tsx` page with stats grid
2. Create `AccountsList.tsx` with sortable/filterable table
3. Create `CreateOrganizationDialog.tsx` wizard
4. Add platform admin routes to `App.tsx`
5. Add navigation items for platform admins

### Phase 3: Account Management
1. Create `AccountDetail.tsx` with tabbed interface
2. Create `OrganizationSettings.tsx` component
3. Create `OrganizationUsers.tsx` management
4. Implement organization-scoped import wizard

### Phase 4: Enhanced Data Import
1. Update `DataImportWizard` to accept organization context
2. Update `import-data` edge function for org scoping
3. Add migration progress tracking per organization
4. Build rollback/retry functionality

---

## Navigation Structure

```text
PLATFORM ADMIN (new section for platform users)
├── Overview      → /dashboard/platform/overview
├── Salon Accounts → /dashboard/platform/accounts
├── Migrations    → /dashboard/platform/import
└── Platform Settings → /dashboard/platform/settings
```

This section only appears for users with `view_platform_admin` permission.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard/platform/Overview.tsx` | Main dashboard |
| `src/pages/dashboard/platform/Accounts.tsx` | Accounts list |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Single account view |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Platform config |
| `src/components/platform/AccountsTable.tsx` | Reusable table |
| `src/components/platform/CreateOrganizationDialog.tsx` | Create wizard |
| `src/components/platform/OrganizationSelector.tsx` | Context switcher |
| `src/components/platform/MigrationProgressCard.tsx` | Progress visual |
| `src/components/platform/OnboardingChecklist.tsx` | Onboarding steps |
| `src/hooks/useOrganizations.ts` | Organization CRUD |
| `src/hooks/useOrganizationStats.ts` | Platform analytics |
| `src/contexts/OrganizationContext.tsx` | Org context provider |

---

## Database Migration

```sql
-- Create organization status enum
CREATE TYPE organization_status AS ENUM ('pending', 'active', 'suspended', 'churned');
CREATE TYPE onboarding_stage AS ENUM ('new', 'importing', 'training', 'live');

-- Main organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  status organization_status DEFAULT 'pending',
  onboarding_stage onboarding_stage DEFAULT 'new',
  subscription_tier TEXT DEFAULT 'standard',
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  source_software TEXT, -- phorest, mindbody, boulevard, etc.
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Organization admins (platform team + org owners)
CREATE TABLE organization_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- 'owner', 'admin', 'support'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE locations ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE import_jobs ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;
```

---

## Summary

This plan creates a two-tier admin system:

1. **Platform Level** - For your internal import/support team to manage all salon customers
2. **Organization Level** - For salon owners/admins to manage their specific business

The Data Import Wizard becomes organization-aware, allowing the import team to select which salon they're importing data for, track progress per customer, and manage the full onboarding lifecycle from signup to "live" status.
