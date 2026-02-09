
# Unified PIN System: User PINs for Quick Login and Kiosk Access

## Overview

Create a unified personal PIN system where each employee has their own 4-digit PIN that serves multiple purposes:
1. **Dashboard Quick Login** - Lock icon in sidebar allows quick user switching on shared devices
2. **Kiosk Settings Access** - Primary Owners and Super Admins can unlock kiosk settings with their PIN
3. **Full Audit Trail** - All PIN changes are logged

---

## Architecture Change

### Current State
- Single organization-level `exit_pin` in `organization_kiosk_settings`
- Anyone with the PIN can access kiosk settings

### New State
- Each employee has a personal `login_pin` on their `employee_profiles` record
- Kiosk settings: Only Primary Owners/Super Admins' PINs work for access
- Dashboard lock: Any employee can unlock with their own PIN (switches to their session)

---

## Database Changes

### 1. Add PIN Column to Employee Profiles

```sql
ALTER TABLE public.employee_profiles
ADD COLUMN login_pin TEXT DEFAULT NULL;

-- Add PIN changelog table for audit trail
CREATE TABLE public.employee_pin_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_profile_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

CREATE INDEX idx_employee_pin_changelog_profile ON employee_pin_changelog(employee_profile_id);
CREATE INDEX idx_employee_pin_changelog_date ON employee_pin_changelog(changed_at DESC);
```

### 2. RLS Policies

```sql
-- Employee PIN: Users can read/update their own; super admins can update any
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- For PIN changelog: Only the user themselves, primary owner, and super admins
CREATE POLICY "Users can view own PIN changelog, admins can view all"
ON public.employee_pin_changelog FOR SELECT
TO authenticated
USING (
  employee_profile_id IN (
    SELECT id FROM employee_profiles WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE user_id = auth.uid() 
    AND (is_primary_owner = true OR is_super_admin = true)
  )
);

CREATE POLICY "Users can log own PIN changes, admins can log any"
ON public.employee_pin_changelog FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND (
    employee_profile_id IN (
      SELECT id FROM employee_profiles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM employee_profiles 
      WHERE user_id = auth.uid() 
      AND (is_primary_owner = true OR is_super_admin = true)
    )
  )
);
```

### 3. Helper Function for PIN Validation

```sql
CREATE OR REPLACE FUNCTION public.validate_user_pin(_organization_id uuid, _pin text)
RETURNS TABLE(user_id uuid, display_name text, photo_url text, is_super_admin boolean, is_primary_owner boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ep.user_id,
    COALESCE(ep.display_name, ep.full_name) as display_name,
    ep.photo_url,
    ep.is_super_admin,
    ep.is_primary_owner
  FROM public.employee_profiles ep
  WHERE ep.organization_id = _organization_id
    AND ep.login_pin = _pin
    AND ep.is_active = true
    AND ep.is_approved = true
  LIMIT 1
$$;
```

---

## Files to Create

### 1. Hook: `src/hooks/useUserPin.ts`

Handles all PIN operations:

```typescript
// Key exports:
- useUserPin(userId?) - Get user's PIN status (has PIN set, not the actual PIN)
- useSetUserPin() - Mutation to set/change own PIN with validation
- useAdminSetUserPin() - For super admins to set/reset others' PINs
- usePinChangelog(profileId?) - Get PIN change history
- useValidatePin() - Validate a PIN and return matching user
```

### 2. Hook: `src/hooks/useDashboardLock.ts`

Manages the lock screen state:

```typescript
// Key exports:
- useDashboardLock() - Lock state, lock/unlock functions
- DashboardLockProvider - Context provider for lock state
```

### 3. Component: `src/components/dashboard/DashboardLockScreen.tsx`

Full-screen PIN entry when dashboard is locked:

```text
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [Organization Logo]                        │
│                                                         │
│            Enter PIN to unlock                          │
│                                                         │
│               ○ ○ ○ ○                                   │
│                                                         │
│           ┌───┬───┬───┐                                 │
│           │ 1 │ 2 │ 3 │                                 │
│           ├───┼───┼───┤                                 │
│           │ 4 │ 5 │ 6 │                                 │
│           ├───┼───┼───┤                                 │
│           │ 7 │ 8 │ 9 │                                 │
│           ├───┼───┼───┤                                 │
│           │ ⌫ │ 0 │   │                                 │
│           └───┴───┴───┘                                 │
│                                                         │
│     [Sign out completely]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Component: `src/components/dashboard/SidebarLockButton.tsx`

Lock icon for the sidebar footer:

```typescript
// Shows in sidebar footer, next to Settings
// Clicking locks the dashboard and shows the lock screen
// Icon: Lock (lucide-react)
```

### 5. Component: `src/components/dashboard/settings/UserPinSettings.tsx`

PIN management in user settings:

```text
┌─────────────────────────────────────────────────────────┐
│ QUICK LOGIN PIN                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your 4-digit PIN for quick dashboard login.            │
│                                                         │
│  Status: [Set] / [Not set]                              │
│                                                         │
│  [Set PIN] / [Change PIN]                               │
│                                                         │
│  ⚠ This PIN is also used to access kiosk settings      │
│    (Super Admins and Account Owners only)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6. Component: `src/components/dashboard/settings/AdminPinManagement.tsx`

For Super Admins to manage team PINs (in Access & Permissions Hub):

```text
┌─────────────────────────────────────────────────────────┐
│ TEAM PIN MANAGEMENT                                     │
├─────────────────────────────────────────────────────────┤
│ [Search team members...]                                │
│                                                         │
│  Jane Smith (Super Admin)     PIN: Set    [Reset]       │
│  John Doe (Stylist)           PIN: Set    [Reset]       │
│  Sarah Jones (Receptionist)   PIN: Not set [—]          │
│                                                         │
│  Note: You cannot reset the Account Owner's PIN         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/SidebarNavContent.tsx` | Add lock button to footer section |
| `src/components/dashboard/DashboardLayout.tsx` | Wrap with lock context, show lock screen when locked |
| `src/components/kiosk/KioskSettingsDialog.tsx` | Use `validate_user_pin` instead of org-level PIN |
| `src/pages/dashboard/admin/Settings.tsx` | Add PIN settings section for users |
| `src/pages/dashboard/admin/AccessHub.tsx` | Add admin PIN management section |

---

## User Flows

### Flow 1: Setting Your Own PIN

1. User goes to Settings > Account
2. Clicks "Set PIN" or "Change PIN"
3. Enters new 4-digit PIN twice for confirmation
4. PIN is saved to their employee_profile
5. Change is logged to employee_pin_changelog

### Flow 2: Locking the Dashboard

1. User clicks lock icon in sidebar footer
2. Dashboard immediately shows lock screen
3. Current session is NOT destroyed (just hidden)
4. Any team member can enter their PIN to unlock
5. If different user's PIN: switch to that user's session
6. If same user's PIN: resume current session

### Flow 3: Kiosk Settings Access

1. Admin taps hidden settings icon on kiosk
2. PIN entry screen appears
3. System validates PIN against all org employees
4. Only accepts PINs from users where `is_super_admin = true` OR `is_primary_owner = true`
5. If valid, grants settings access
6. Logs which admin accessed settings

### Flow 4: Super Admin Resetting Someone's PIN

1. Super Admin goes to Access Hub > Team PINs
2. Finds team member in list
3. Clicks "Reset PIN"
4. Enters new PIN for that user (or clears it)
5. System checks: Cannot reset Primary Owner's PIN
6. Change is logged with super admin's ID as `changed_by`

---

## Access Control Summary

| Action | Who Can Do It |
|--------|---------------|
| Set/change own PIN | Any employee |
| View own PIN changelog | Any employee |
| Reset other's PIN | Super Admin (except Primary Owner) |
| View team PIN changelog | Primary Owner, Super Admin |
| Access kiosk settings via PIN | Primary Owner, Super Admin |
| Lock/unlock dashboard | Any employee with a PIN set |

---

## Security Considerations

1. **PINs are stored as plaintext** - This is acceptable for quick-login PINs as they're short-lived session convenience, not password-level security
2. **Primary Owner protection** - Super Admins cannot reset the Primary Owner's PIN
3. **Audit trail** - Every PIN change is logged with who changed it and when
4. **Session switching** - Uses Supabase's session management (PIN lookup returns user_id, then we use admin API or custom token to switch)
5. **Kiosk restriction** - Only elevated users' PINs work for kiosk settings

---

## Migration Path

1. Keep existing `exit_pin` in `organization_kiosk_settings` as fallback
2. Kiosk first tries user PINs; if none match, falls back to org PIN
3. Eventually deprecate org-level PIN once all admins have set personal PINs

---

## Implementation Order

1. Create database migration (PIN column + changelog table + RLS + function)
2. Create `useUserPin` hook
3. Create `useDashboardLock` context and hook
4. Create `DashboardLockScreen` component
5. Create `SidebarLockButton` component
6. Create `UserPinSettings` component for personal settings
7. Create `AdminPinManagement` component for Access Hub
8. Modify `KioskSettingsDialog` to use new PIN validation
9. Integrate lock button into sidebar footer
10. Wrap dashboard with lock provider
