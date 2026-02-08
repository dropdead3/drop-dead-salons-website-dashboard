
# Add Role-Based Staff Invitation to Management Hub

## Overview

Add a staff invitation feature to the Management Hub that allows managers to invite team members with role-based restrictions:
- **Managers/Admins** can invite: Stylist, Front Desk (Receptionist), Stylist Assistant
- **Super Admins only** can invite: Super Admin, Admin, Manager (and all lower roles)

This follows the existing role hierarchy pattern and ensures proper access control.

---

## Role Hierarchy & Permission Logic

| Inviting User Role | Can Invite These Roles |
|-------------------|------------------------|
| Manager | stylist, receptionist, stylist_assistant, operations_assistant |
| Admin | All manager-invitable roles + admin_assistant, bookkeeper |
| Super Admin | All roles including admin, super_admin, manager |

The logic:
1. **Leadership roles** (super_admin, admin, manager) require Super Admin to invite
2. **Operational/stylists roles** can be invited by Manager or above

---

## Changes Required

### 1. New Component: `ManagementInviteCard.tsx`

Create a dedicated invitation card for the Management Hub with:
- Visual "Invite Team Member" card matching existing ManagementCard style
- Role-filtered dropdown based on current user's permissions
- Email input with validation
- Pending invitations count badge
- Success/error feedback

### 2. New Hook: `useInvitableRoles.ts`

Create a hook that returns which roles the current user can invite:
```typescript
function useInvitableRoles() {
  // Returns filtered role options based on:
  // - Current user's roles (manager, admin, super_admin)
  // - Whether user has is_super_admin flag
  // - Role category (leadership vs operations/stylists)
}
```

### 3. Update `ManagementHub.tsx`

Add a new "Team Invitations" category section containing:
- ManagementInviteCard component (dialog-based invite flow)
- Link to full invitation management (Account Management page)

### 4. Enhanced `InviteStaffDialog.tsx` (Refactor)

Update to accept a `restrictedRoles` prop that filters the available roles:
```typescript
interface InviteStaffDialogProps {
  allowedRoles?: AppRole[];  // If provided, only show these roles
  trigger?: React.ReactNode; // Custom trigger element
}
```

---

## UI/UX Design

### Management Hub Addition

New section "Team Invitations" with:
```
┌─────────────────────────────────────────────────┐
│ 👤+ Invite Team Member                     [→]  │
│ Send invitations to new staff members           │
│                                    3 pending    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 📋 Manage Invitations                      [→]  │
│ View and manage all pending invitations         │
└─────────────────────────────────────────────────┘
```

### Invitation Dialog

```
┌─────────────────────────────────────────────────┐
│ ✉ Invite New Team Member                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Email Address                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ name@example.com                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Role                                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ Stylist                               ▼     │ │
│ └─────────────────────────────────────────────┘ │
│ ⓘ Only Super Admins can invite Admin roles     │ │ (shown when applicable)
│                                                 │
│                        [Cancel] [Send Invite]   │
└─────────────────────────────────────────────────┘
```

---

## Role Restriction Logic

```typescript
// Leadership roles - Super Admin only
const LEADERSHIP_ROLES = ['super_admin', 'admin', 'manager', 'admin_assistant'];

// General roles - Manager and above can invite
const GENERAL_ROLES = ['stylist', 'receptionist', 'stylist_assistant', 
                       'operations_assistant', 'booth_renter', 'bookkeeper'];

function getInvitableRoles(userRoles: AppRole[], isSuperAdmin: boolean): AppRole[] {
  // Super Admin can invite all roles
  if (isSuperAdmin || userRoles.includes('super_admin')) {
    return [...LEADERSHIP_ROLES, ...GENERAL_ROLES];
  }
  
  // Admin can invite general roles + some operational
  if (userRoles.includes('admin')) {
    return GENERAL_ROLES;
  }
  
  // Manager can invite front-line roles
  if (userRoles.includes('manager')) {
    return ['stylist', 'receptionist', 'stylist_assistant', 'operations_assistant'];
  }
  
  return [];
}
```

---

## Security Considerations

1. **Client-side filtering** - The role dropdown only shows roles the user can invite
2. **Server-side validation** - The `useCreateInvitation` hook should verify permission before creating
3. **RLS policies** - The existing `staff_invitations` table RLS should be checked/enhanced

---

## Enhancements

1. **Quick invite from Management Hub** - One-click access without navigating away
2. **Pending count badge** - Shows pending invitations at a glance
3. **Role descriptions** - Show what each role can access when selecting
4. **Super Admin notice** - Clear indication when certain roles require elevated permissions
5. **Capacity awareness** - Integrate with existing `useBusinessCapacity` hook

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useInvitableRoles.ts` | Role permission logic |
| `src/components/management/ManagementInviteDialog.tsx` | Role-restricted invite dialog |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/ManagementHub.tsx` | Add Team Invitations section |
| `src/hooks/useStaffInvitations.ts` | Add role permission validation |

---

## Summary

This implementation:
- Adds invitation capability directly in the Management Hub for quick access
- Enforces proper role hierarchy (Super Admin required for leadership roles)
- Reuses existing invitation infrastructure
- Follows the established design patterns in the codebase
- Includes proper security validation on both client and server

