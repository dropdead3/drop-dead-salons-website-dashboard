

# Platform Admin Dashboard Access Feature

## Summary

Implement functionality that allows platform admins to access and view an organization's actual dashboard as if they were a user of that organization. This "View Dashboard" action will switch the context so platform users can navigate the full organization dashboard experience for support and troubleshooting purposes.

---

## Current State Analysis

**Existing Infrastructure:**
- `OrganizationContext` with `selectedOrganization`, `isImpersonating`, and `setSelectedOrganization`
- `OrganizationSwitcher` component for platform users to select organizations
- `PlatformContextBanner` showing "Viewing as: {org.name}" with "Exit View" button
- `logPlatformAction` function for audit logging to `platform_audit_log`
- `isPlatformUser` flag in AuthContext to identify platform team members
- Platform routes are separate from organization routes (`/dashboard/platform/*` vs `/dashboard/*`)

**What the Feature Needs:**
- A "View Dashboard" action in the Accounts list and Account Detail page
- Set the selected organization in context and redirect to the main dashboard
- Platform users see the org's dashboard with the context banner showing they're in impersonation mode
- Audit logging when entering/exiting org view mode

---

## User Flow

1. Platform admin navigates to Accounts list or Account Detail
2. Clicks "View Dashboard" action (dropdown menu or button)
3. System:
   - Sets `selectedOrganization` in OrganizationContext
   - Logs the action to `platform_audit_log`
   - Redirects to `/dashboard` (main dashboard)
4. User sees the organization's dashboard with `PlatformContextBanner` visible
5. Banner shows "Viewing as: {org.name}" with:
   - "Account Details" link (back to platform account page)
   - "Exit View" button (clears context, returns to platform)

---

## Implementation Details

### 1. Add "View Dashboard" to Accounts Table Actions

Update the dropdown menu in the accounts list to include a new action:

```text
Dropdown Menu:
├── View Details (existing)
├── Edit Account (existing)
├── Start Import (existing)
├── ─────────────
└── View Dashboard (NEW) ← Opens org's dashboard
```

### 2. Add "View Dashboard" Button to Account Detail Header

Add a prominent button in the Account Detail header actions:

```text
Header Actions:
├── [Logo] [Status Badge]
├── [Import Data] button (existing)
├── [Edit Account] button (existing)
└── [View Dashboard] button (NEW) ← Primary action with Layout icon
```

### 3. Create Helper Hook for Dashboard Access

Create a reusable hook `useAccessOrganizationDashboard` that:
- Sets the organization in context
- Logs the access action
- Navigates to the dashboard

### 4. Enhance PlatformContextBanner

The existing banner already handles the UI well. Just ensure:
- "Account Details" links to the correct account page
- "Exit View" clears context and navigates to platform overview

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/Accounts.tsx` | Add "View Dashboard" dropdown item with LayoutDashboard icon |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Add "View Dashboard" button to header actions |
| `src/hooks/useOrganizations.ts` | Add optional `useAccessOrganizationDashboard` hook (or inline logic) |
| `src/components/platform/PlatformContextBanner.tsx` | Minor enhancement: ensure exit navigates to platform overview |

---

## Technical Implementation

### Accounts.tsx - Add to Dropdown Menu

Add new menu item after "Start Import":

```tsx
<DropdownMenuItem onClick={(e) => {
  e.stopPropagation();
  setSelectedOrganization(org);
  logPlatformAction(org.id, 'dashboard_accessed', 'organization', org.id, {
    organization_name: org.name,
    action: 'view_dashboard',
  });
  navigate('/dashboard');
}}>
  <LayoutDashboard className="h-4 w-4 mr-2" />
  View Dashboard
</DropdownMenuItem>
```

### AccountDetail.tsx - Add Button to Header

Add between Import Data and Edit Account buttons:

```tsx
<PlatformButton 
  variant="secondary" 
  onClick={() => {
    setSelectedOrganization(organization);
    logPlatformAction(organization.id, 'dashboard_accessed', 'organization', organization.id, {
      organization_name: organization.name,
      action: 'view_dashboard',
    });
    navigate('/dashboard');
  }}
>
  <LayoutDashboard className="h-4 w-4 mr-2" />
  View Dashboard
</PlatformButton>
```

### PlatformContextBanner.tsx - Ensure Proper Exit Navigation

Update exit handler to navigate back to platform:

```tsx
const handleExitView = () => {
  clearSelection();
  navigate('/dashboard/platform/overview');
};
```

---

## Security Considerations

1. **Authorization**: Only users with platform roles can access this feature (enforced by existing route protection)
2. **Audit Trail**: Every dashboard access is logged to `platform_audit_log` with:
   - Organization ID
   - Action type: `dashboard_accessed`
   - User details (automatically captured by RPC)
   - Timestamp
3. **Data Isolation**: Organization data RLS policies remain intact - platform users see data based on their permissions

---

## UI/UX Details

**Dropdown Menu Item:**
- Icon: `LayoutDashboard` (from lucide-react)
- Text: "View Dashboard"
- Separator line before this item to visually group platform-specific actions

**Account Detail Button:**
- Position: After "Import Data", before "Edit Account"
- Variant: `secondary` (outlined style)
- Icon + text: `<LayoutDashboard /> View Dashboard`

**Context Banner (existing):**
- Shows: "Viewing as: {Organization Name} ({slug})"
- Actions: "Account Details" link, "Exit View" button
- Style: Violet gradient background with border

---

## Audit Log Entry Format

```json
{
  "organization_id": "uuid",
  "user_id": "platform-user-uuid",
  "action": "dashboard_accessed",
  "entity_type": "organization",
  "entity_id": "uuid",
  "details": {
    "organization_name": "Drop Dead Salons",
    "action": "view_dashboard"
  },
  "created_at": "timestamp"
}
```

