
# Fix Role Context for View As Mode in Dashboard Customize Menu

## Problem

When viewing as "Front Desk" role, the Customize Dashboard menu shows incorrect sections:
- "Command Center" appears (should be hidden for Front Desk)
- "Today's Queue" appears but isn't properly enabled by default

The root cause is in how `isLeadership` is calculated in `DashboardHome.tsx`:

```typescript
const isLeadership = profile?.is_super_admin || 
    roles.includes('super_admin') || 
    roles.includes('manager');
```

The `profile?.is_super_admin` check uses the **actual user's profile**, not the effective (impersonated) roles. So when a super admin views as "Front Desk", `isLeadership` remains `true`.

---

## Solution

Update the `isLeadership` calculation to respect View As mode by checking if impersonation is active.

### File: `src/pages/dashboard/DashboardHome.tsx`

**Current code (lines 93-95):**
```typescript
const isLeadership = profile?.is_super_admin || 
    roles.includes('super_admin') || 
    roles.includes('manager');
```

**Updated code:**
```typescript
// Import useViewAs hook at top of file
import { useViewAs } from '@/contexts/ViewAsContext';

// Inside component:
const { isViewingAs } = useViewAs();

// Leadership check - when viewing as another role, only use effective roles
const isLeadership = isViewingAs 
  ? roles.includes('super_admin') || roles.includes('manager')
  : profile?.is_super_admin || roles.includes('super_admin') || roles.includes('manager');
```

This ensures:
1. When **not impersonating**: Uses both profile flag and roles (existing behavior)
2. When **viewing as a role**: Only checks effective roles, ignoring actual profile

---

## Expected Result

### When Super Admin views as "Front Desk":

**Before fix:**
| Section | Visible in Menu | Problem |
|---------|-----------------|---------|
| Command Center | Yes | Should be hidden |
| Today's Queue | Yes (bottom) | Should be at top, enabled |

**After fix:**
| Section | Visible in Menu |
|---------|-----------------|
| Operations Stats | Yes |
| Today's Queue | Yes |
| Schedule & Tasks | Yes |
| Announcements | Yes |
| Widgets | Yes |

Command Center will no longer appear since `isLeadership` will be `false` when viewing as Front Desk.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardHome.tsx` | Import `useViewAs`, update `isLeadership` calculation to respect impersonation mode |
