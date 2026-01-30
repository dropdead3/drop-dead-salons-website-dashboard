
# Platform Account Profile Editor with Online Presence

## Summary

Create a profile editing system for platform team members with a dedicated "My Account" page in the platform settings, featuring profile photo upload and real-time online presence tracking that shows which team members are currently active.

---

## Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| Platform Team List | Exists | Shows initials only, no photos, no online status |
| Profile Data | Exists | Uses `employee_profiles` table with `photo_url` column |
| Photo Upload Hook | Exists | `useUploadProfilePhoto` uploads to `employee-photos` bucket |
| Online Presence | Missing | No real-time tracking infrastructure |

---

## Solution Architecture

```text
+---------------------------+       +------------------------+
|  Platform Settings        |       |  PlatformSidebar       |
|  > Account Tab (NEW)      |       |  Current User Avatar   |
+---------------------------+       |  + Online Indicator    |
            |                       +------------------------+
            v
+---------------------------+       +------------------------+
|  PlatformAccountEditor    | <---> |  employee_profiles     |
|  - Photo upload           |       |  (existing table)      |
|  - Name, email, phone     |       +------------------------+
|  - Display preferences    |
+---------------------------+
            |
            v
+---------------------------+       +------------------------+
|  usePlatformPresence      | <---> |  Supabase Realtime     |
|  (Presence channel)       |       |  Presence Channel      |
+---------------------------+       +------------------------+
            |
            v
+---------------------------+
|  PlatformTeamManager      |
|  - Photo avatars          |
|  - Online status dots     |
|  - "X online" counter     |
+---------------------------+
```

---

## Features

### 1. Platform Account Profile Editor

A new "Account" tab in Platform Settings allowing team members to edit:

| Field | Type | Description |
|-------|------|-------------|
| Profile Photo | Image Upload | Uses existing `employee-photos` bucket |
| Display Name | Text | Preferred name shown in platform |
| Full Name | Text | Legal name for records |
| Email | Text | Contact email (read-only from auth) |
| Phone | Text | Optional contact phone |

### 2. Online Presence Tracking

Real-time visibility of who is currently logged in to the platform:

| Feature | Implementation |
|---------|---------------|
| Online indicator | Green dot on avatar when active |
| Team list status | Shows "Online" badge next to active users |
| Presence count | "3 online" counter in team header |
| Auto-disconnect | Clears presence on logout/tab close |

---

## Database Changes

No new tables required. The existing `employee_profiles` table already has all necessary columns:
- `photo_url` - Profile photo URL
- `full_name` - Full name
- `display_name` - Preferred display name
- `email` - Email address
- `phone` - Phone number

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/platform/settings/PlatformAccountTab.tsx` | Profile editing form with photo upload |
| `src/hooks/usePlatformPresence.ts` | Supabase Realtime Presence hook |
| `src/components/platform/ui/OnlineIndicator.tsx` | Reusable online status dot component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Add "Account" tab |
| `src/components/platform/PlatformTeamManager.tsx` | Add photos and online indicators |
| `src/components/platform/layout/PlatformSidebar.tsx` | Add current user avatar with online status |
| `src/components/platform/layout/PlatformLayout.tsx` | Initialize presence tracking |

---

## Technical Details

### Presence Hook Pattern

The `usePlatformPresence` hook will use Supabase Realtime Presence:

```typescript
// Subscribes to 'platform_presence' channel
// Tracks: { user_id, full_name, photo_url, online_at }
// Returns: { onlineUsers: Map, isOnline: (userId) => boolean }

const channel = supabase.channel('platform_presence', {
  config: { presence: { key: user.id } }
});

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    setOnlineUsers(state);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        full_name: profile.full_name,
        photo_url: profile.photo_url,
        online_at: new Date().toISOString()
      });
    }
  });
```

### Profile Editor Component

```typescript
// Uses existing hooks:
// - useEmployeeProfile() for fetching
// - useUpdateEmployeeProfile() for saving
// - useUploadProfilePhoto() for image upload

// Form fields:
// - Avatar with camera overlay for upload
// - Display name input
// - Full name input  
// - Email (read-only, from auth)
// - Phone input (optional)
```

### Online Indicator Component

```typescript
// Small component for consistent online status display
<OnlineIndicator 
  isOnline={true} 
  size="sm" // sm | md | lg
  className="..." 
/>
// Renders: green pulsing dot (online) or gray dot (offline)
```

---

## UI Design

### Account Tab Layout

```
+------------------------------------------+
|  Account Settings                        |
|  Manage your platform profile            |
+------------------------------------------+
|                                          |
|   +--------+   Full Name                 |
|   |        |   [Alex Maxwell Day    ]    |
|   | PHOTO  |                             |
|   |        |   Display Name              |
|   | [cam]  |   [Alex              ]      |
|   +--------+                             |
|                                          |
|   Email (from your account)              |
|   alexmaxday@gmail.com                   |
|                                          |
|   Phone                                  |
|   [555-123-4567           ]              |
|                                          |
|   [     Save Changes     ]               |
|                                          |
+------------------------------------------+
```

### Team List with Online Status

```
+------------------------------------------+
|  Platform Team           [3 online]      |
+------------------------------------------+
|  +----+  Alex Maxwell Day    Owner       |
|  |PHOTO| alexmaxday@gmail.com   [ONLINE] |
|  | ●  |  Added: Jan 30, 2026             |
|  +----+                                  |
+------------------------------------------+
|  +----+  Jane Developer      Developer   |
|  |JD  | jane@example.com                 |
|  | ○  |  Added: Jan 25, 2026             |
|  +----+                                  |
+------------------------------------------+

● = Green online indicator
○ = Gray offline indicator
```

### Sidebar User Section

```
+------------------+
|  +----+          |
|  |PHOTO|  Alex   |
|  | ●  |  Owner   |
|  +----+          |
+------------------+
```

---

## Implementation Order

1. **Create OnlineIndicator component** - Reusable status dot
2. **Create usePlatformPresence hook** - Realtime presence tracking
3. **Create PlatformAccountTab** - Profile editor form
4. **Update PlatformSettings** - Add Account tab
5. **Update PlatformLayout** - Initialize presence on mount
6. **Update PlatformTeamManager** - Add photos and online indicators
7. **Update PlatformSidebar** - Add current user avatar with status

---

## Theme Compatibility

All new components will use the existing platform theme system:
- CSS variables: `--platform-bg-card`, `--platform-text-primary`, etc.
- Light/dark mode support via `usePlatformTheme`
- Consistent styling with existing platform components
