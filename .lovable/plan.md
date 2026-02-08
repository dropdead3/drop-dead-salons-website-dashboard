

# Team Member Management Tab for Chat Settings

## Overview

Add a new "Team" tab to the Team Chat Settings panel that provides a centralized view of all team members and their channel access. Admins can:
- See all team members and which channels they're in
- Add or remove channel access for each member
- Enable/disable chat access entirely per member

---

## User Interface Design

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  TEAM CHAT SETTINGS                                                    [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Channels] [Display] [Permissions] [Auto-Join] [AI Actions] [Team]        │
│                                                              ▲ NEW TAB      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TEAM MEMBER ACCESS                                                         │
│  Manage chat access and channel memberships for your team                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Search by name...]            [Filter by role: All Roles  v]     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Photo] Eric Day                                                   │    │
│  │          Super Admin                                                │    │
│  │          ─────────────────────────────────────────────────────────  │    │
│  │          Channels: #general, #company-wide, #north-mesa, +1 more   │    │
│  │                                                                     │    │
│  │          [Manage Channels]              Chat Access: [ON] [====]   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Photo] Stylist Test Account                                       │    │
│  │          Stylist                                                    │    │
│  │          ─────────────────────────────────────────────────────────  │    │
│  │          Channels: #general, #company-wide                          │    │
│  │                                                                     │    │
│  │          [Manage Channels]              Chat Access: [ON] [====]   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Photo] Former Employee                                            │    │
│  │          Stylist                                                    │    │
│  │          ─────────────────────────────────────────────────────────  │    │
│  │          Channels: (Chat disabled)                                  │    │
│  │                                                                     │    │
│  │          [Manage Channels]              Chat Access: [OFF] [    ]  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Channel Management Dialog

When clicking "Manage Channels", a dialog appears with checkboxes for all available channels:

```text
┌─────────────────────────────────────────────────────────────┐
│  MANAGE CHANNEL ACCESS                                 [X]  │
│  Eric Day                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  System Channels                                            │
│  ─────────────────────────────────────────────────────────  │
│  [x] #company-wide     Organization-wide announcements      │
│  [x] #general          General discussions                  │
│                                                             │
│  Location Channels                                          │
│  ─────────────────────────────────────────────────────────  │
│  [x] #north-mesa       Channel for North Mesa               │
│  [ ] #val-vista-lakes  Channel for Val Vista Lakes          │
│                                                             │
│  Custom Channels                                            │
│  ─────────────────────────────────────────────────────────  │
│  [x] #marketing        (no other custom channels)           │
│                                                             │
│               [Cancel]                    [Save Changes]    │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Database Changes

Add a `chat_enabled` column to `employee_profiles` to track whether a user has chat access:

```sql
ALTER TABLE employee_profiles 
ADD COLUMN chat_enabled BOOLEAN DEFAULT true;
```

No new tables needed - we'll use existing `chat_channel_members` for channel access.

### New Hook: `useTeamChatAccess`

Fetches all team members with their channel memberships and chat status:

```typescript
interface TeamMemberChatAccess {
  userId: string;
  displayName: string;
  fullName: string;
  photoUrl: string | null;
  accountRoles: AppRole[];
  chatEnabled: boolean;
  channels: {
    id: string;
    name: string;
    type: 'public' | 'private' | 'location' | 'dm';
  }[];
}

function useTeamChatAccess() {
  // Fetch all org members with their channel memberships
  // and chat_enabled status
}
```

### New Component: `TeamMembersTab.tsx`

Settings tab component that displays:
- Searchable/filterable list of team members
- Each member card shows:
  - Photo, name, role
  - Current channel memberships (as chips/tags)
  - "Manage Channels" button opening the dialog
  - Chat enabled/disabled toggle switch

### New Component: `ManageChannelsDialog.tsx`

Dialog for bulk managing a user's channel access:
- Lists all non-DM channels in the organization
- Grouped by type (System, Location, Custom)
- Checkboxes to add/remove membership
- Bulk add/remove via mutations

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/team-chat/settings/TeamMembersTab.tsx` | Main tab component with member list |
| `src/components/team-chat/ManageChannelsDialog.tsx` | Dialog for managing a member's channel access |
| `src/hooks/team-chat/useTeamChatAccess.ts` | Hook to fetch member access data and mutations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/team-chat/TeamChatAdminSettingsSheet.tsx` | Add "Team" tab (6th tab) |
| `src/hooks/team-chat/index.ts` | Export new hook |
| Database migration | Add `chat_enabled` column to `employee_profiles` |

---

## Feature Capabilities

| Feature | Description |
|---------|-------------|
| **View all members** | See every team member with their current channel access |
| **Search & filter** | Find members by name or filter by account role |
| **Manage channels** | Add/remove a user from any channel via checkbox interface |
| **Enable/disable chat** | Toggle switch to completely enable/disable chat for a user |
| **Bulk operations** | Channel management dialog allows adding to multiple channels at once |

---

## Security Considerations

- Only Super Admins and Admins can access the Team tab
- Audit log entries for chat enable/disable actions
- Cannot disable chat for Super Admins (self-protection)
- RLS policies on `chat_channel_members` already handle authorization

---

## Benefits

1. **Centralized control** - Manage all user access from one place
2. **Quick onboarding** - Add new hires to all relevant channels instantly
3. **Safe offboarding** - Disable chat access without deleting the user
4. **Visibility** - See who has access to what at a glance
5. **Audit trail** - Track when chat was enabled/disabled for compliance

