
# Bookkeeper/Accountant Role Implementation Plan

## Overview

Add a dedicated "Bookkeeper" role to the system that allows external accounting professionals to access payroll operations, sales data, and financial reports without having full administrative access. This role will be invite-only by admins/managers and will have a focused permission set for financial operations.

---

## Current System Analysis

**Existing Role Infrastructure:**
- `app_role` enum in Supabase contains: `admin`, `manager`, `stylist`, `receptionist`, `assistant`, `stylist_assistant`, `admin_assistant`, `operations_assistant`, `super_admin`, `booth_renter`
- Roles are stored in the `roles` table with metadata (icon, color, category)
- User roles are tracked in `user_roles` table
- Permissions are assigned via `role_permissions` table
- Invitation system exists via `staff_invitations` table

**Relevant Existing Permissions:**
| Permission | Category | Purpose |
|------------|----------|---------|
| `manage_payroll` | Payroll | Run payroll and manage settings |
| `view_payroll_reports` | Payroll | View payroll history |
| `manage_employee_compensation` | Payroll | Edit pay rates |
| `view_all_stats` | Management | View team statistics |
| `view_transactions` | finances | View transaction history |
| `view_rent_analytics` | analytics | Access rent revenue data |
| `view_all_locations_analytics` | Management | Multi-location analytics |

---

## Technical Implementation

### 1. Database Migration

**Add `bookkeeper` to `app_role` enum:**

```sql
-- Add bookkeeper to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bookkeeper';
```

**Insert role metadata into `roles` table:**

```sql
INSERT INTO public.roles (
  name, 
  display_name, 
  description, 
  color, 
  icon, 
  category, 
  sort_order, 
  is_system, 
  is_active
) VALUES (
  'bookkeeper',
  'Bookkeeper',
  'External accounting access for payroll, sales data, and financial reports',
  'emerald',
  'Calculator',
  'operations',
  15,
  true,
  true
) ON CONFLICT (name) DO NOTHING;
```

**Create new bookkeeper-specific permissions:**

```sql
-- New permission for viewing sales analytics (separate from view_all_stats)
INSERT INTO public.permissions (name, display_name, description, category)
VALUES 
  ('view_sales_analytics', 'View Sales Analytics', 'Access sales dashboards and revenue reports', 'finances'),
  ('export_financial_data', 'Export Financial Data', 'Download CSV/PDF reports for payroll and sales', 'finances')
ON CONFLICT (name) DO NOTHING;
```

**Assign default permissions to bookkeeper role:**

```sql
-- Get the bookkeeper role's permission assignments
INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 
  'bookkeeper'::app_role,
  p.id,
  NULL
FROM public.permissions p
WHERE p.name IN (
  -- Payroll permissions
  'manage_payroll',
  'view_payroll_reports',
  'manage_employee_compensation',
  -- Financial/Sales permissions
  'view_transactions',
  'view_sales_analytics',
  'view_all_stats',
  'view_all_locations_analytics',
  'view_rent_analytics',
  'export_financial_data',
  -- Basic access
  'view_command_center'
)
ON CONFLICT DO NOTHING;
```

---

### 2. Role Configuration

| Property | Value |
|----------|-------|
| **Name** | `bookkeeper` |
| **Display Name** | Bookkeeper |
| **Description** | External accounting access for payroll, sales data, and financial reports |
| **Icon** | Calculator |
| **Color** | emerald (green-ish, representing money/accounting) |
| **Category** | operations |
| **System Role** | Yes (prevents accidental deletion) |

---

### 3. Permission Matrix for Bookkeeper

| Permission | Included | Reason |
|------------|----------|--------|
| `manage_payroll` | Yes | Run payroll cycles |
| `view_payroll_reports` | Yes | Access payroll history |
| `manage_employee_compensation` | Yes | Configure pay rates |
| `view_all_stats` | Yes | Team performance data |
| `view_transactions` | Yes | Transaction records |
| `view_rent_analytics` | Yes | Renter revenue tracking |
| `view_all_locations_analytics` | Yes | Multi-location data |
| `view_sales_analytics` | Yes (new) | Sales dashboards |
| `export_financial_data` | Yes (new) | Download reports |
| `view_command_center` | Yes | Basic dashboard access |

**Explicitly EXCLUDED permissions:**
- `view_clients` (no client PII access)
- `manage_team` (no HR functions)
- `view_handbooks` (internal docs)
- `manage_announcements` (internal comms)
- `view_assistant_schedule` (operational)
- All platform admin permissions

---

### 4. Invitation Flow Enhancement

The existing `InviteStaffDialog` already supports all roles from the `roles` table via `useRoleUtils().roleOptions`. Once the bookkeeper role is added to the database, it will automatically appear in the role selector.

**Optional Enhancement:** Add a visual distinction for external roles:

```typescript
// In InviteStaffDialog, consider grouping roles
const externalRoles = ['bookkeeper', 'booth_renter'];
const isExternalRole = externalRoles.includes(role);
```

---

### 5. Navigation & Access Control

**Bookkeeper's Dashboard Experience:**

When a bookkeeper logs in, they should see a focused navigation:

| Section | Visible |
|---------|---------|
| Command Center | Yes (limited widgets) |
| Payroll Hub | Yes (full access) |
| Sales Dashboard | Yes (view only) |
| Analytics Hub | Yes (financial metrics) |
| Team Directory | Limited (names/photos only) |
| Schedule | No |
| Client Directory | No |
| Settings | No |

**Implementation:** The existing permission-based navigation filtering will handle this automatically via `VisibilityGate` and sidebar configuration.

---

### 6. Security Considerations

1. **No Employee Profile Creation:** Bookkeepers use the standard invitation flow but may not need full employee profiles. Consider optional profile creation.

2. **Audit Logging:** All bookkeeper actions (payroll runs, data exports) should be logged via existing audit mechanisms.

3. **Session Management:** Standard session handling applies; no special requirements.

4. **RLS Policies:** Existing RLS policies on financial tables should work since bookkeeper users will have the appropriate role in `user_roles`.

---

### 7. Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/XXXXX.sql` | Add enum value, role record, and permissions |

**No code changes required** - the existing infrastructure handles:
- Role display via `useRoleUtils()` and `roles` table
- Permission checking via `useAuth().hasPermission()`
- Invitation flow via `useStaffInvitations()`
- Navigation filtering via sidebar visibility configuration

---

### 8. Visual Design

**Role Badge:**
- Color: Emerald green (financial/accounting association)
- Icon: Calculator (lucide-react)
- Category: Operations

**Sample Badge Rendering:**
```
┌─────────────────┐
│ 🧮 Bookkeeper   │  ← Emerald green badge with Calculator icon
└─────────────────┘
```

---

## Implementation Steps

| Step | Task | Complexity |
|------|------|------------|
| 1 | Create database migration with enum addition | Low |
| 2 | Insert role metadata into `roles` table | Low |
| 3 | Create new financial permissions | Low |
| 4 | Assign default permissions to bookkeeper | Low |
| 5 | Test invitation flow with bookkeeper role | Low |
| 6 | Verify navigation visibility | Low |

---

## Testing Checklist

- [ ] Bookkeeper appears in role selector when inviting staff
- [ ] New bookkeeper can sign up via invitation link
- [ ] Bookkeeper can access Payroll Hub
- [ ] Bookkeeper can access Sales Dashboard
- [ ] Bookkeeper can run payroll cycles
- [ ] Bookkeeper cannot access Client Directory
- [ ] Bookkeeper cannot access Settings
- [ ] Bookkeeper actions are logged in audit trail

---

## Future Enhancements

1. **Dedicated Bookkeeper Dashboard:** A focused landing page showing only financial KPIs
2. **Accountant Sub-Role:** Separate read-only "Accountant" role for external auditors
3. **External Access Portal:** Dedicated login flow for external professionals
4. **Data Export Automation:** Scheduled report delivery to bookkeeper email
5. **Multi-Org Bookkeeper:** Allow one bookkeeper to access multiple organizations
