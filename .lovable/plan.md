
# Add Notification Preferences to Bell Icon Popover

## Current Issue
The "Notification Preferences" link is only in the user profile dropdown in `DashboardLayout.tsx`, but:
- It doesn't appear in the Platform Admin area (`PlatformHeader.tsx`)
- It's not intuitively placed - users expect notification settings from the bell icon

## Solution
Add a "Notification Preferences" link/button to the **footer of the NotificationsPanel** component, right next to the existing "View all updates" link. This ensures it's accessible from everywhere the bell icon appears.

## Changes

### File: `src/components/dashboard/NotificationsPanel.tsx`

Update the footer section (lines 575-582) to include two links:

```text
Current:
┌─────────────────────────────────────┐
│       View all updates →            │
└─────────────────────────────────────┘

Updated:
┌─────────────────────────────────────┐
│  ⚙ Preferences    │  View updates → │
└─────────────────────────────────────┘
```

**Implementation:**
- Add a Settings icon and "Preferences" link to `/dashboard/notifications`
- Use a 2-column grid layout in the footer
- Keep the existing "View all updates" link to `/dashboard/changelog`

This single change ensures:
1. Notification preferences are accessible from the bell icon in **all layouts**
2. The UX is intuitive - users clicking the bell can manage their notification settings
3. Push notification testing becomes discoverable
