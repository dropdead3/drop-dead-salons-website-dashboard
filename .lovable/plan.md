

# Redesign Organization Switcher: Navigate, Don't Just Toggle

## Problem
The "Platform View" dropdown currently only switches context state in memory -- it doesn't navigate anywhere. This makes it confusing: clicking "Platform View" does nothing visible, and selecting an organization just changes a variable without taking you to that org's dashboard.

## New Behavior

### When "Platform View" is clicked (or selected from dropdown)
- Navigate to `/dashboard/platform/overview` -- the Platform Admin Hub
- Clear any org-specific context (already happens)
- User lands on the cross-tenant platform dashboard

### When a specific organization is selected
- Set the org context (already happens)
- Navigate to `/dashboard` -- the main organization dashboard
- User now sees everything from that organization's perspective as an account owner
- The Platform Context Banner remains visible at top so they can exit back

## Technical Changes

### File: `src/components/platform/OrganizationSwitcher.tsx`

Update the `handleSelect` function to also call `navigate()`:

```
// When selecting "Platform View" (null org):
handleSelect(null) => {
  setSelectedOrganization(null);
  navigate('/dashboard/platform/overview');
}

// When selecting a specific org:
handleSelect(org) => {
  setSelectedOrganization(org);
  navigate('/dashboard');  // land on that org's main dashboard
}
```

This requires importing `useNavigate` from `react-router-dom`.

### File: `src/components/dashboard/DashboardLayout.tsx`

No changes needed -- the context bar visibility and Platform Context Banner already respond to the org context state correctly.

### Files Changed
| File | Change |
|---|---|
| `src/components/platform/OrganizationSwitcher.tsx` | Add `useNavigate`, navigate to `/dashboard/platform/overview` on "Platform View" selection, navigate to `/dashboard` on org selection |

One file, minimal change -- the switcher just needs to navigate in addition to switching context.

