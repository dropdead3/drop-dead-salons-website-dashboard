

# Platform Login & Platform Team Roles

## Overview

Create a dedicated login experience for your internal development/support team who manage the software platform. This establishes a clear separation between:

- **Salon Team**: Stylists, managers, admins who use the software for their salon business
- **Platform Team**: Your internal dev, support, and migration team who manage salon accounts

---

## What We'll Build

### 1. New Platform Roles

| Role | Purpose | Access Level |
|------|---------|--------------|
| `platform_owner` | Company founders/leadership | Full platform access, billing, security |
| `platform_admin` | Senior dev/ops team | Full platform access, user management |
| `platform_support` | Import/migration team | View all orgs, perform migrations, support tasks |
| `platform_developer` | Development team | View access, testing, debugging |

These are stored separately from salon roles using a `platform_roles` table (not the `app_role` enum).

### 2. Dedicated Platform Login Page

A separate login at `/platform-login` with:
- Platform-specific branding (different from salon branding)
- Direct redirect to Platform Admin Hub after login
- No role selection (platform users don't self-select roles)
- "Go to Salon Login" link for salon staff

### 3. Platform Team Management

The "Manage Team" button on Platform Settings will allow:
- Inviting new platform team members
- Assigning platform roles
- Viewing platform team activity

---

## Architecture

### Database Schema

```text
platform_roles (NEW TABLE)
├── id: uuid
├── user_id: uuid (FK to auth.users)
├── role: text (platform_owner, platform_admin, platform_support, platform_developer)
├── created_at: timestamptz
├── granted_by: uuid
└── UNIQUE(user_id, role)
```

This is separate from `user_roles` which stores salon-level roles.

### Authentication Flow

```text
/platform-login                     /staff-login
      │                                   │
      ▼                                   ▼
  [Sign In]                          [Sign In]
      │                                   │
      ▼                                   ▼
 Check platform_roles              Check user_roles
      │                                   │
      ▼                                   ▼
/dashboard/platform/overview       /dashboard
```

### Permission Mapping

| Platform Role | Permissions Granted |
|--------------|---------------------|
| `platform_owner` | All platform permissions + billing |
| `platform_admin` | view_platform_admin, manage_organizations, perform_migrations |
| `platform_support` | view_platform_admin, view_all_organizations, perform_migrations |
| `platform_developer` | view_platform_admin, view_all_organizations |

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/pages/PlatformLogin.tsx` | Dedicated platform team login page |
| `src/hooks/usePlatformRoles.ts` | CRUD for platform team roles |
| `src/components/platform/PlatformTeamManager.tsx` | Team management UI |
| `src/components/platform/InvitePlatformUserDialog.tsx` | Invite new platform users |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/platform-login` route |
| `src/contexts/AuthContext.tsx` | Add `platformRoles` state, `isPlatformUser` check |
| `src/components/auth/ProtectedRoute.tsx` | Add `requirePlatformRole` prop |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Wire up team management |

---

## Implementation Steps

### Phase 1: Database Schema

1. Create `platform_roles` table with appropriate columns
2. Create RLS policies (only platform admins can manage)
3. Create `is_platform_user()` helper function
4. Create `has_platform_role()` check function
5. Seed initial platform owner (your account)

### Phase 2: Authentication Updates

1. Create `usePlatformRoles` hook to fetch platform roles
2. Update `AuthContext` to include:
   - `platformRoles: string[]` state
   - `isPlatformUser: boolean` computed property
   - `hasPlatformRole(role: string): boolean` helper
3. Update `ProtectedRoute` to support `requirePlatformRole` prop

### Phase 3: Platform Login Page

1. Create `/platform-login` page with platform branding
2. Login-only (no self-registration for platform team)
3. After login:
   - Check if user has any platform role
   - If yes → redirect to `/dashboard/platform/overview`
   - If no → show error "Not authorized for platform access"
4. Add link to salon login for convenience

### Phase 4: Platform Team Management

1. Build team management UI in Platform Settings
2. Ability to:
   - View all platform team members
   - Invite new team members (email invite)
   - Assign/remove platform roles
   - View activity log
3. Only `platform_owner` and `platform_admin` can manage team

---

## Visual Design

### Platform Login Page

The platform login will have:
- Dark/professional theme (vs salon's warm cream theme)
- Your company logo (not salon logo)
- "Platform Administration" heading
- Clean, minimal design
- Footer link: "Salon staff? Login here →"

### Platform Team List

| Member | Email | Role | Status | Actions |
|--------|-------|------|--------|---------|
| Avatar | john@company.com | Platform Admin | Active | Edit, Remove |
| Avatar | sarah@company.com | Platform Support | Active | Edit, Remove |

---

## Security Considerations

1. **Separate role storage**: Platform roles in `platform_roles` table, salon roles in `user_roles`
2. **No self-registration**: Platform users can only be invited
3. **RLS protection**: Only existing platform admins can add new platform users
4. **Audit logging**: All role changes logged to `platform_audit_log`
5. **Session awareness**: Platform login sets a session flag for context

---

## Migration for Current Users

Since you're currently using `super_admin` for platform access:

1. Create the new `platform_roles` table
2. Add your account as `platform_owner`
3. Platform permissions will check `platform_roles` first
4. Existing `super_admin` logic remains for salon-level access

This allows a user to have both:
- `platform_admin` role (for platform access)
- `super_admin` salon role (when assisting a specific salon)

---

## Technical Details

### Database Migration SQL

```sql
-- Platform roles table (separate from salon app_role enum)
CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_owner', 'platform_admin', 'platform_support', 'platform_developer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check platform role
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is any type of platform user
CREATE OR REPLACE FUNCTION public.is_platform_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles WHERE user_id = _user_id
  )
$$;
```

### AuthContext Updates

```typescript
// New state
const [platformRoles, setPlatformRoles] = useState<string[]>([]);

// New computed
const isPlatformUser = platformRoles.length > 0;

// New helper
const hasPlatformRole = (role: string) => platformRoles.includes(role);
```

### ProtectedRoute Enhancement

```typescript
interface ProtectedRouteProps {
  // ... existing props
  requirePlatformRole?: string; // NEW - e.g., 'platform_admin'
  requireAnyPlatformRole?: boolean; // NEW - any platform access
}
```

