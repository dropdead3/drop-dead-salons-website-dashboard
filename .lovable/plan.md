
## Move Phorest Sync Button Next to Customize Button

### What Changes

The Phorest sync icon (the circular refresh arrow with the status dot) currently sits in the top navigation bar alongside "View As" and the bell icon. It will be moved to sit right next to the "Customize" button in the analytics filter bar area on the dashboard home page.

### Implementation

**Two files will be modified:**

1. **`src/components/dashboard/DashboardLayout.tsx`**
   - Remove the `<PhorestSyncPopout />` from the top nav bar controls section (around line 1191-1193)
   - Also remove it from the ellipsis overflow dropdown (around line 1229-1232)
   - The top bar becomes cleaner with just the access badge, View As toggle, and notifications

2. **`src/pages/dashboard/DashboardHome.tsx`**
   - Import `PhorestSyncPopout` component
   - Add it inside the `leadingContent` prop of `AnalyticsFilterBar`, wrapping both the sync popout and the existing `DashboardCustomizeMenu` in a flex container so they sit side-by-side
   - Only render the sync button for admin/super_admin/manager roles (same guard as currently used)

### Technical Detail

The `leadingContent` prop change in DashboardHome.tsx (around line 742):

```tsx
leadingContent={
  <div className="flex items-center gap-1">
    {(actualRoles.includes('admin') || actualRoles.includes('super_admin') || actualRoles.includes('manager')) && (
      <PhorestSyncPopout />
    )}
    <DashboardCustomizeMenu
      roleContext={{ isLeadership, hasStylistRole, isFrontDesk, isReceptionist }}
    />
  </div>
}
```

This places the sync icon immediately to the left of the customize gear icon in the filter bar, matching the user's intent. The role-based visibility guard is preserved.
