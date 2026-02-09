

# Enable Account Owner to Manage All Team PINs

## Overview

Ensure the Primary Owner (Account Owner) can view all team members and update their PINs, even if they don't have the `super_admin` role. Currently, the `canManage` access check only looks for `super_admin` role.

## Current Issue

In `AccessHub.tsx`:
```typescript
const isSuperAdmin = roles.includes('super_admin');
const canManage = isSuperAdmin || isPlatformUser;  // Missing Primary Owner check
```

The Primary Owner should always have access to PIN management as a core Account Owner capability.

## Files to Modify

### 1. `src/pages/dashboard/admin/AccessHub.tsx`

**Change**: Add Primary Owner check to the `canManage` logic.

```typescript
import { useIsPrimaryOwner } from '@/hooks/useIsPrimaryOwner';

// Inside component:
const { data: isPrimaryOwner } = useIsPrimaryOwner();
const isSuperAdmin = roles.includes('super_admin');
const canManage = isSuperAdmin || isPlatformUser || isPrimaryOwner;
```

### 2. `src/components/access-hub/TeamPinManagementTab.tsx`

**Change**: Also add Primary Owner context so they can manage PINs. Update the access check message to reflect that Account Owners can also manage.

```typescript
import { useIsPrimaryOwner } from '@/hooks/useIsPrimaryOwner';

// In component:
const { data: isPrimaryOwner } = useIsPrimaryOwner();

// Update the restricted message:
if (!canManage && !isPrimaryOwner) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          Only Super Admins and the Account Owner can manage team PINs.
        </p>
      </CardContent>
    </Card>
  );
}
```

## Technical Details

### Who Can Manage Team PINs
| User Type | Can View All Users | Can Reset PINs |
|-----------|-------------------|----------------|
| Primary Owner | Yes | Yes (all users including self) |
| Super Admin | Yes | Yes (except Primary Owner) |
| Platform User | Yes | Yes (except Primary Owner) |
| Others | No | No |

### Who's PIN Cannot Be Reset by Others
- The Primary Owner's PIN can only be changed by themselves (enforced by database trigger `protect_primary_owner_pin`)

## Implementation Order

1. Update `AccessHub.tsx` to include Primary Owner in `canManage` check
2. Update `TeamPinManagementTab.tsx` to recognize Primary Owner access
3. Test the flow with the Account Owner account

