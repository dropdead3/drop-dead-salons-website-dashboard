
# Restrict Payroll Hub Access for Manager Role

## Current State Analysis

Based on my investigation of the codebase and database:

| Role | Has `manage_payroll` Permission |
|------|--------------------------------|
| super_admin | ✅ Yes |
| admin | ✅ Yes |
| bookkeeper | ✅ Yes |
| manager | ❌ No |
| stylist | ❌ No |
| receptionist | ❌ No |

**The database is already correctly configured** - Managers do not have the `manage_payroll` permission. A real Manager user logging in would be blocked from the Payroll Hub by the `ProtectedRoute` component.

## What You're Seeing

The screenshot shows the Payroll Hub visible while using **"View As Manager"** mode. This happens because:

1. **ProtectedRoute** checks the real logged-in user's permissions (your admin account)
2. **"View As"** only simulates the experience for navigation filtering, not page-level access control

This is actually working as designed - admins can navigate to any page even while "viewing as" another role to verify what content would display (you'll notice the navigation already hides the Payroll Hub link when viewing as Manager).

## Two Options for Improvement

### Option A: Accurate "View As" Simulation (Recommended)

Make the "View As" feature enforce page-level access restrictions, providing a fully accurate simulation of what a Manager would experience:

**Changes Required:**

1. **Create `useEffectivePermissions` hook** - A shared hook that returns simulated permissions when in View As mode, real permissions otherwise

2. **Update ProtectedRoute** - Check effective permissions (respecting View As) instead of real permissions:

```tsx
// In ProtectedRoute.tsx
import { useViewAs } from '@/contexts/ViewAsContext';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';

const { isViewingAs, viewAsRole } = useViewAs();
const effectivePermissions = useEffectivePermissions();

// If viewing as another role, use simulated permissions
if (requiredPermission && isViewingAs) {
  if (!effectivePermissions.includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }
}
```

3. **Add "Access Denied" feedback** - When an admin in View As mode tries to access a restricted page, show a clear message:

```tsx
if (isViewingAs && !effectivePermissions.includes(requiredPermission)) {
  return (
    <AccessDeniedView 
      role={viewAsRole} 
      permission={requiredPermission}
      onExitViewAs={clearViewAs}
    />
  );
}
```

### Option B: Grant Permission via Role Access Configurator

If you want specific Managers to access Payroll Hub, you can grant the `manage_payroll` permission to the Manager role:

1. Go to **Settings > Access & Visibility > Role Access**
2. Select **Permissions Matrix** tab
3. Find **Manager** role
4. Toggle ON: `manage_payroll`

This would give all Managers access to Payroll Hub. For individual manager access, you would need to:
- Create a custom role (e.g., "Senior Manager" with payroll access)
- Assign that role to specific managers

---

## Recommended Approach

**Option A** provides the best solution because:
- It makes the "View As" feature fully accurate for testing role experiences
- It respects existing permission controls without database changes
- It helps admins verify what each role can actually access
- Real Manager users are already blocked by the current permission configuration

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useEffectivePermissions.ts` | New hook - returns simulated or real permissions based on View As mode |
| `src/components/auth/ProtectedRoute.tsx` | Check effective permissions instead of real permissions when in View As mode |
| `src/components/auth/AccessDeniedView.tsx` | New component - shows friendly message when View As blocks access |

---

## Result After Implementation

When using "View As Manager":
- ✅ Payroll Hub link hidden from navigation (already works)
- ✅ Direct URL `/dashboard/admin/payroll` redirects to dashboard with message
- ✅ Clear feedback that Manager role cannot access this page
- ✅ Easy exit from View As mode to regain full access

When logged in as actual Manager:
- ✅ Payroll Hub link not visible in navigation
- ✅ Direct URL access blocked, redirects to dashboard
- ✅ No access to any payroll data or functions
