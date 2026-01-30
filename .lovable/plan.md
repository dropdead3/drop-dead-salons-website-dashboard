
# Give Platform Owner Full Permissions + Revenue Link Visibility

## Summary

Update the platform role system so that `platform_owner` automatically has all permissions that `platform_admin` has (hierarchy), and restrict the Revenue nav link to only show for platform owners and admins.

---

## Current Issue

1. **Route Access**: The Revenue page is protected with `requirePlatformRole="platform_admin"`, but `hasPlatformRole()` does an exact match. A `platform_owner` cannot access Revenue because they technically don't have the `platform_admin` role - even though they should have MORE permissions.

2. **Nav Visibility**: The Revenue link shows for all platform users (support, developer, etc.) even though they can't access the page.

---

## Solution

### 1. Add Platform Role Hierarchy Function

Create a helper that respects the permission hierarchy:

```text
platform_owner > platform_admin > platform_support = platform_developer
```

The `platform_owner` should inherit all permissions of lower roles.

### 2. Update Route Protection

Modify the `ProtectedRoute` component to use a new `hasPlatformRoleOrHigher` check that recognizes the hierarchy.

### 3. Filter Revenue Nav Item

Add a `platformRoles` property to the Revenue nav item so it only appears for `platform_owner` and `platform_admin`.

---

## Implementation Details

### File 1: `src/contexts/AuthContext.tsx`

Add a new helper function `hasPlatformRoleOrHigher` that implements the hierarchy:

```typescript
// Platform role hierarchy (higher includes all permissions of lower)
const PLATFORM_ROLE_HIERARCHY: Record<PlatformRole, number> = {
  platform_owner: 4,
  platform_admin: 3,
  platform_support: 2,
  platform_developer: 2,
};

const hasPlatformRoleOrHigher = useCallback((requiredRole: PlatformRole): boolean => {
  const requiredLevel = PLATFORM_ROLE_HIERARCHY[requiredRole];
  return platformRoles.some(role => PLATFORM_ROLE_HIERARCHY[role] >= requiredLevel);
}, [platformRoles]);
```

Add this to the context interface and provider exports.

### File 2: `src/components/auth/ProtectedRoute.tsx`

Update the platform role check to use `hasPlatformRoleOrHigher`:

```typescript
// Before:
if (requirePlatformRole && !hasPlatformRole(requirePlatformRole)) {
  return <Navigate to="/dashboard/platform/overview" replace />;
}

// After:
if (requirePlatformRole && !hasPlatformRoleOrHigher(requirePlatformRole)) {
  return <Navigate to="/dashboard/platform/overview" replace />;
}
```

### File 3: `src/components/dashboard/DashboardLayout.tsx`

Update the `platformNavItems` to include role restrictions:

```typescript
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: AppRole[];
  platformRoles?: PlatformRole[];  // NEW: restrict to specific platform roles
}

const platformNavItems: NavItem[] = [
  { href: '/dashboard/platform/overview', label: 'Platform Overview', icon: Terminal },
  { href: '/dashboard/platform/accounts', label: 'Accounts', icon: Building2 },
  { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload },
  { href: '/dashboard/platform/revenue', label: 'Revenue', icon: DollarSign, 
    platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/settings', label: 'Platform Settings', icon: Settings,
    platformRoles: ['platform_owner', 'platform_admin'] },
];
```

Update `filterNavItems` to check platform role restrictions:

```typescript
const filterNavItems = (items: NavItem[]) => {
  return items.filter(item => {
    // Check platform role restriction first
    if (item.platformRoles && item.platformRoles.length > 0) {
      const hasRequiredPlatformRole = item.platformRoles.some(
        role => hasPlatformRoleOrHigher(role)
      );
      if (!hasRequiredPlatformRole) return false;
    }
    
    // Existing permission/role checks...
    if (item.permission) {
      return hasPermission(item.permission);
    }
    if (!item.roles) return true;
    return item.roles.some(role => roles.includes(role));
  });
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Add `hasPlatformRoleOrHigher` function with hierarchy logic |
| `src/components/auth/ProtectedRoute.tsx` | Use `hasPlatformRoleOrHigher` instead of exact match |
| `src/components/dashboard/DashboardLayout.tsx` | Add `platformRoles` to NavItem interface, add restrictions to Revenue/Settings items, update filter logic |
| `src/components/dashboard/SidebarNavContent.tsx` | Update NavItem interface to include `platformRoles` |

---

## Result

After these changes:
- **Platform Owner** can access Revenue and Settings pages (inherits admin permissions)
- **Platform Admin** can access Revenue and Settings pages
- **Platform Support/Developer** cannot see or access Revenue/Settings
- The nav sidebar correctly shows/hides links based on effective platform permissions
