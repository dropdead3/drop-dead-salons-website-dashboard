
# Role-Based Visibility for GROWTH Navigation Section

## Summary

Configure the GROWTH navigation section so that:
- **Training** → Visible to Management + Stylists + Stylist Assistants
- **Program Team Overview** → Visible only to Management (super_admin, admin, manager)
- **New-Client Engine Program** → Visible only to Stylists + Stylist Assistants
- **Ring the Bell** → Visible only to Stylists + Stylist Assistants
- **My Graduation** → Visible only to Stylist Assistants (already configured)

---

## Implementation Approach

### Option A: Modify Filter Logic + Add Roles (Recommended)

Update `filterNavItems` to check **both** permission AND roles when both are specified, then add `roles` restrictions to nav items.

**Current logic:**
```
if permission → check permission only
else if roles → check roles
else → show to all
```

**New logic:**
```
if permission → check permission
  if also has roles → also check roles (must have both)
else if roles → check roles
else → show to all
```

### Changes

#### 1. Update `filterNavItems` function

Modify the function to respect both `permission` AND `roles` when both are specified:

```typescript
const filterNavItems = (items: NavItem[]) => {
  return items.filter(item => {
    // Check platform role restriction first (uses hierarchy)
    if (item.platformRoles && item.platformRoles.length > 0) {
      const hasRequiredPlatformRole = item.platformRoles.some(
        role => hasPlatformRoleOrHigher(role)
      );
      if (!hasRequiredPlatformRole) return false;
    }
    
    // Check permission if specified
    let hasRequiredPermission = true;
    if (item.permission) {
      hasRequiredPermission = hasPermission(item.permission);
    }
    
    // Check roles if specified
    let hasRequiredRole = true;
    if (item.roles && item.roles.length > 0) {
      hasRequiredRole = item.roles.some(role => roles.includes(role));
    }
    
    // Must have both permission (if specified) AND role (if specified)
    return hasRequiredPermission && hasRequiredRole;
  });
};
```

#### 2. Update `growthNavItems` array

```typescript
const growthNavItems: NavItem[] = [
  // Training - visible to management + stylists + stylist assistants
  { 
    href: '/dashboard/training', 
    label: 'Training', 
    icon: Video, 
    permission: 'view_training',
    roles: ['super_admin', 'admin', 'manager', 'stylist', 'stylist_assistant']
  },
  // New-Client Engine Program - only stylists + stylist assistants
  { 
    href: '/dashboard/program', 
    label: 'New-Client Engine Program', 
    icon: Target, 
    permission: 'access_client_engine',
    roles: ['stylist', 'stylist_assistant']
  },
  // Program Team Overview - only management (permission already restricts this)
  { 
    href: '/dashboard/admin/team', 
    label: 'Program Team Overview', 
    icon: Users, 
    permission: 'view_team_overview',
    roles: ['super_admin', 'admin', 'manager']
  },
  // Ring the Bell - only stylists + stylist assistants
  { 
    href: '/dashboard/ring-the-bell', 
    label: 'Ring the Bell', 
    icon: Bell, 
    permission: 'ring_the_bell',
    roles: ['stylist', 'stylist_assistant']
  },
  // My Graduation - only stylist assistants (already configured)
  { 
    href: '/dashboard/my-graduation', 
    label: 'My Graduation', 
    icon: GraduationCap, 
    permission: 'view_my_graduation', 
    roles: ['stylist_assistant'] 
  },
];
```

---

## Role Visibility Summary

| Link | super_admin | admin | manager | stylist | stylist_assistant |
|------|-------------|-------|---------|---------|-------------------|
| Training | ✓ | ✓ | ✓ | ✓ | ✓ |
| Program Team Overview | ✓ | ✓ | ✓ | ✗ | ✗ |
| New-Client Engine Program | ✗ | ✗ | ✗ | ✓ | ✓ |
| Ring the Bell | ✗ | ✗ | ✗ | ✓ | ✓ |
| My Graduation | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Update `filterNavItems` function to check both permission AND roles; update `growthNavItems` array with role restrictions |

---

## Technical Notes

1. **Dual Check Logic**: The updated filter ensures that if BOTH `permission` and `roles` are specified, the user must satisfy BOTH conditions. This prevents permission-only bypass.

2. **Backward Compatibility**: Items that only have `permission` OR only have `roles` will continue to work as before.

3. **Super Admin Override**: Note that super_admin is explicitly included in the roles arrays where they should have access. This ensures super admins see what they need to see.
