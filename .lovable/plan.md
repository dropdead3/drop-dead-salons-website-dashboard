
# Comprehensive Platform & Dashboard Feature Build

This plan implements **5 major features** across Platform Admin and Business Dashboard, tackling all "coming soon" placeholders identified in the codebase.

---

## Feature Overview

| # | Feature | Location | Priority |
|---|---------|----------|----------|
| 1 | Account User Management | AccountDetail.tsx - Users Tab | High |
| 2 | Import History with Rollback | AccountDetail.tsx - Migration Tab | High |
| 3 | Organization Settings | AccountDetail.tsx - Settings Tab | Medium |
| 4 | Appointment Edit Dialog | Today's Queue | High |
| 5 | Platform Security Settings | PlatformSettings.tsx - Security Tab | Medium |

---

## Feature 1: Account User Management

### What Gets Built
A complete user management interface for platform admins to view and manage organization employees.

### Current State
```
Users Tab → "User management coming soon"
```

### New Implementation

**Components to Create:**
- `AccountUsersTab.tsx` - Main tab component
- `AccountUserCard.tsx` - Individual user row with role badges
- `InviteOrgUserDialog.tsx` - Invite new user on behalf of org

**Hook to Create:**
- `useOrganizationUsers.ts` - Fetch users + roles for an organization

**Functionality:**
- List all employees for the organization
- Show user roles with colored badges
- Show active/inactive status
- Display last login timestamp
- Role assignment capabilities
- Invite new team members
- Remove users from organization

### Visual Design
```text
+------------------------------------------------------------+
| Users (12)                              [+ Invite User]     |
+------------------------------------------------------------+
| [Avatar] John Smith                                         |
|   john@salon.com                    [Super Admin] [Active]  |
|   Last active: 2 hours ago              [Edit] [Remove]     |
+------------------------------------------------------------+
| [Avatar] Jane Doe                                           |
|   jane@salon.com                    [Manager] [Active]      |
|   Last active: Yesterday                [Edit] [Remove]     |
+------------------------------------------------------------+
```

### Database Query Pattern
```typescript
// Hook: useOrganizationUsers
const { data: profiles } = await supabase
  .from('employee_profiles')
  .select('user_id, full_name, display_name, email, photo_url, is_active, last_sign_in_at')
  .eq('organization_id', organizationId)
  .order('full_name');

// Get roles for these users
const { data: roles } = await supabase
  .from('user_roles')
  .select('user_id, role')
  .in('user_id', userIds);
```

---

## Feature 2: Import History with Rollback

### What Gets Built
Connect the Migration tab to real `import_jobs` data with rollback functionality.

### Current State
```
Import History Card → "No imports yet for this organization"
```

### New Implementation

**Changes Required:**
- Update `useImportJobs` hook to properly filter by organization
- Add database migration to add `organization_id` to `import_jobs`
- Reuse existing `ImportHistoryCard` component
- Add entity type breakdown stats

**Functionality:**
- Show all imports for this organization
- Display import status (completed, failed, dry_run, rolled_back)
- Show success/error counts
- Rollback button for eligible imports
- Filter by entity type
- Link to start new import

### Visual Design
```text
+------------------------------------------------------------+
| Import History                              [New Import]    |
+------------------------------------------------------------+
| Filter: [All Types ▼]                                       |
+------------------------------------------------------------+
| ● Clients from phorest         Jan 30, 2026 2:15 PM        |
|   ✓ 156 imported, 3 failed         [View Details] [Rollback]|
+------------------------------------------------------------+
| ● Services from csv            Jan 30, 2026 1:45 PM        |
|   ✓ 45 imported                    [View Details]          |
+------------------------------------------------------------+
| ○ Staff from phorest           Jan 29, 2026 10:00 AM       |
|   ↩ Rolled back                    [View Details]          |
+------------------------------------------------------------+
```

### Database Changes
```sql
-- Add organization_id to import_jobs for direct filtering
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_import_jobs_organization 
ON public.import_jobs(organization_id);
```

---

## Feature 3: Organization Settings

### What Gets Built
Per-organization configuration panel for feature flags, notifications, and defaults.

### Current State
```
Settings Tab → "Settings configuration coming soon"
```

### New Implementation

**Components to Create:**
- `AccountSettingsTab.tsx` - Main settings component
- Uses existing settings patterns from business dashboard

**Settings Categories:**
1. **Feature Flags** - Enable/disable features per org
2. **Notifications** - Email and SMS preferences
3. **Defaults** - Default location, timezone, currency
4. **Branding** - Logo, colors (links to their dashboard)

### Visual Design
```text
+------------------------------------------------------------+
| Organization Settings                                       |
+------------------------------------------------------------+
| FEATURE FLAGS                                               |
| [x] Enable 75 Hard program                                  |
| [x] Enable client portal                                    |
| [ ] Enable online booking                                   |
| [ ] Enable inventory management                             |
+------------------------------------------------------------+
| NOTIFICATIONS                                               |
| Email Digest: [Weekly ▼]                                    |
| SMS Reminders: [Enabled ▼]                                  |
+------------------------------------------------------------+
| DEFAULTS                                                    |
| Default Location: [Main Salon ▼]                            |
| Timezone: [America/New_York ▼]                              |
| Currency: [USD ▼]                                           |
+------------------------------------------------------------+
```

### Storage Approach
Store in `organizations.settings` JSONB column (already exists):
```typescript
interface OrgSettings {
  feature_flags: {
    enable_75_hard: boolean;
    enable_client_portal: boolean;
    enable_online_booking: boolean;
  };
  notifications: {
    email_digest: 'daily' | 'weekly' | 'monthly' | 'never';
    sms_reminders: boolean;
  };
  defaults: {
    default_location_id: string | null;
    timezone: string;
    currency: string;
  };
}
```

---

## Feature 4: Appointment Edit Dialog

### What Gets Built
A full-featured edit dialog for appointments from Today's Queue.

### Current State
```
Edit button → toast("Edit functionality coming soon")
```

### New Implementation

**Components to Create:**
- `EditAppointmentDialog.tsx` - Main dialog component
- Reuses patterns from `QuickBookingPopover` and `AppointmentDetailSheet`

**Editable Fields:**
- Date and time
- Assigned staff member
- Service (if allowed)
- Notes
- Status

**Hook Updates:**
- Extend `useRescheduleAppointment` or create `useUpdateAppointment`

### Visual Design
```text
+--------------------------------------------+
| Edit Appointment                     [X]   |
+--------------------------------------------+
| CLIENT                                     |
| Jane Smith                                 |
| jane@email.com • (555) 123-4567            |
+--------------------------------------------+
| DATE & TIME                                |
| [Jan 31, 2026]  [2:00 PM] - [3:30 PM]      |
+--------------------------------------------+
| STAFF                                      |
| [Sarah Johnson ▼]                          |
+--------------------------------------------+
| SERVICE                                    |
| Balayage Highlights         $185           |
| 90 min                                     |
+--------------------------------------------+
| NOTES                                      |
| [Additional notes here...]                 |
+--------------------------------------------+
|           [Cancel]    [Save Changes]       |
+--------------------------------------------+
```

### Backend Integration
Uses existing `update-phorest-appointment-time` edge function:
```typescript
const { data, error } = await supabase.functions.invoke('update-phorest-appointment-time', {
  body: {
    appointment_id: appointmentId,
    new_date: selectedDate,
    new_time: selectedTime,
    new_staff_id: selectedStaffId,
  },
});
```

---

## Feature 5: Platform Security Settings

### What Gets Built
Security configuration panel for platform-wide authentication and access controls.

### Current State
```
Security Tab → "Security settings coming soon..."
```

### New Implementation

**Components to Create:**
- `PlatformSecurityTab.tsx` - Main security settings

**Security Settings:**
1. **Password Policies**
   - Minimum length
   - Require special characters
   - Password expiration days

2. **Session Management**
   - Session timeout duration
   - Max concurrent sessions
   - Force logout all users

3. **Two-Factor Authentication**
   - Require 2FA for platform admins
   - Require 2FA for org admins

4. **Audit Logging**
   - View recent security events
   - Export audit logs

### Visual Design
```text
+------------------------------------------------------------+
| Security Settings                                           |
+------------------------------------------------------------+
| PASSWORD POLICIES                                           |
| Minimum password length: [12]                               |
| [x] Require special characters                              |
| [x] Require uppercase and lowercase                         |
| Password expires after: [90] days                           |
+------------------------------------------------------------+
| SESSION MANAGEMENT                                          |
| Session timeout: [30 minutes ▼]                             |
| Max concurrent sessions: [3]                                |
| [Force Logout All Platform Users]                           |
+------------------------------------------------------------+
| TWO-FACTOR AUTHENTICATION                                   |
| [x] Require 2FA for platform admins                         |
| [ ] Require 2FA for organization admins                     |
+------------------------------------------------------------+
| SECURITY AUDIT                                              |
| Recent events: [View Log]                                   |
| [Export Last 30 Days]                                       |
+------------------------------------------------------------+
```

### Storage
Create new table or use `site_settings` with platform scope:
```sql
-- Platform security settings table
CREATE TABLE IF NOT EXISTS public.platform_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_password_length INTEGER DEFAULT 12,
  require_special_chars BOOLEAN DEFAULT true,
  require_mixed_case BOOLEAN DEFAULT true,
  password_expiry_days INTEGER DEFAULT 90,
  session_timeout_minutes INTEGER DEFAULT 30,
  max_concurrent_sessions INTEGER DEFAULT 3,
  require_2fa_platform_admins BOOLEAN DEFAULT true,
  require_2fa_org_admins BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

---

## Implementation Order

### Phase 1: Platform Admin Core (Features 1, 2)
1. Add `organization_id` to `import_jobs` table
2. Create `useOrganizationUsers` hook
3. Build `AccountUsersTab` component
4. Update Migration tab with real import history
5. Connect rollback functionality

### Phase 2: Appointment Edit (Feature 4)
1. Create `EditAppointmentDialog` component
2. Integrate with `useRescheduleAppointment`
3. Update `TodaysQueueSection` to open dialog
4. Add staff reassignment capability

### Phase 3: Settings & Security (Features 3, 5)
1. Create `AccountSettingsTab` component
2. Create `PlatformSecurityTab` component
3. Add database table for security settings
4. Implement audit log viewer

---

## File Changes Summary

| File | Action | Feature |
|------|--------|---------|
| `src/hooks/useOrganizationUsers.ts` | **Create** | 1 |
| `src/components/platform/account/AccountUsersTab.tsx` | **Create** | 1 |
| `src/components/platform/account/AccountUserCard.tsx` | **Create** | 1 |
| `src/components/platform/account/InviteOrgUserDialog.tsx` | **Create** | 1 |
| `src/hooks/useImportJobs.ts` | **Edit** | 2 |
| `src/pages/dashboard/platform/AccountDetail.tsx` | **Edit** | 1, 2, 3 |
| `src/components/platform/account/AccountSettingsTab.tsx` | **Create** | 3 |
| `src/components/dashboard/schedule/EditAppointmentDialog.tsx` | **Create** | 4 |
| `src/components/dashboard/TodaysQueueSection.tsx` | **Edit** | 4 |
| `src/components/platform/settings/PlatformSecurityTab.tsx` | **Create** | 5 |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | **Edit** | 5 |
| Database Migration | **Create** | 2, 5 |

---

## Technical Considerations

### RLS Policies
- `employee_profiles` already has org-level RLS
- New security settings table needs platform-admin-only access
- Import jobs update needs RLS for organization_id filtering

### Existing Patterns Used
- `ImportHistoryCard` - Reused for migration tab
- `useAllUsersWithRoles` - Pattern for user + role fetching
- `useRescheduleAppointment` - Backend for appointment updates
- Platform UI components (PlatformCard, PlatformButton, etc.)

### Edge Function Updates
- No new edge functions required
- Uses existing `update-phorest-appointment-time`
- Uses existing `rollback-import`

---

## Estimated Scope

| Feature | Complexity | Estimated Changes |
|---------|------------|-------------------|
| Account User Management | Medium | ~400 lines |
| Import History + Rollback | Low | ~150 lines |
| Organization Settings | Medium | ~300 lines |
| Appointment Edit Dialog | Medium-High | ~450 lines |
| Platform Security Settings | Medium | ~350 lines |
| **Total** | | **~1,650 lines** |

This comprehensive build addresses all identified gaps and creates a fully-featured platform administration experience with operational improvements for the business dashboard.
