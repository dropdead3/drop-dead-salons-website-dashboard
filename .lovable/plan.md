
# TeamChat Admin Settings Panel

## Overview

Create a comprehensive Slack-inspired admin settings panel for TeamChat, accessible only to account owners (users with `is_super_admin = true`). This panel will provide centralized control over channel behavior, member experience, and permissions.

## What You'll See

A new settings icon (gear/cog) in the TeamChat sidebar header that opens a full settings sheet with multiple organized sections, similar to Slack's workspace administration.

---

## Settings Categories

### 1. Channel Defaults & Permissions

| Setting | Description |
|---------|-------------|
| Who can create public channels | Super Admin / Admin / Manager / Anyone |
| Who can create private channels | Super Admin / Admin / Manager / Anyone |
| Who can archive channels | Admins only / Channel owners / Anyone |
| Default channels for new members | Multi-select of existing channels (e.g., #general, #company-wide) |

### 2. Role-Based Auto-Join Rules

Configure which roles automatically join which channels when a team member is created/assigned that role:

| Role | Auto-join Channels |
|------|-------------------|
| Super Admin | #company-wide, #general, #managers |
| Admin | #company-wide, #general, #managers |
| Manager | #company-wide, #general, #managers |
| Stylist | #company-wide, #general |
| Receptionist | #company-wide, #general |

This replaces/enhances the current location-based auto-join with role-based auto-join.

### 3. Display Settings

| Setting | Description |
|---------|-------------|
| Display name format | Full name / Display name / First name only |
| Show profile photos | On / Off |
| Show role badges in messages | On / Off |
| Show job title in messages | On / Off |
| Show location badge in messages | On / Off |

### 4. Messaging Permissions

| Setting | Description |
|---------|-------------|
| Who can @everyone / @channel | Admins only / Managers+ / Anyone |
| Who can pin messages | Admins only / Channel admins / Anyone |
| Who can delete others' messages | Admins only / Channel admins |
| Message retention | Forever / 1 year / 6 months / 90 days |
| Allow file attachments | On / Off |
| Max file size (MB) | 5 / 10 / 25 / 50 |

### 5. Notification Defaults

| Setting | Description |
|---------|-------------|
| Default notification setting | All messages / Mentions only / Nothing |
| Allow DND override for urgent | On / Off |

---

## Database Changes

### New Table: `team_chat_settings`

```sql
CREATE TABLE public.team_chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  
  -- Channel permissions
  channel_create_public TEXT DEFAULT 'admin' CHECK (channel_create_public IN ('super_admin', 'admin', 'manager', 'anyone')),
  channel_create_private TEXT DEFAULT 'admin' CHECK (channel_create_private IN ('super_admin', 'admin', 'manager', 'anyone')),
  channel_archive_permission TEXT DEFAULT 'admin' CHECK (channel_archive_permission IN ('admin', 'channel_owner', 'anyone')),
  default_channels TEXT[] DEFAULT ARRAY['general', 'company-wide'],
  
  -- Display settings
  display_name_format TEXT DEFAULT 'display_name' CHECK (display_name_format IN ('full_name', 'display_name', 'first_name')),
  show_profile_photos BOOLEAN DEFAULT true,
  show_role_badges BOOLEAN DEFAULT true,
  show_job_title BOOLEAN DEFAULT false,
  show_location_badge BOOLEAN DEFAULT false,
  
  -- Messaging permissions
  mention_everyone_permission TEXT DEFAULT 'admin' CHECK (mention_everyone_permission IN ('admin', 'manager', 'anyone')),
  pin_message_permission TEXT DEFAULT 'channel_admin' CHECK (pin_message_permission IN ('admin', 'channel_admin', 'anyone')),
  delete_others_messages TEXT DEFAULT 'admin' CHECK (delete_others_messages IN ('admin', 'channel_admin')),
  message_retention_days INTEGER DEFAULT NULL,
  allow_file_attachments BOOLEAN DEFAULT true,
  max_file_size_mb INTEGER DEFAULT 25,
  
  -- Notification defaults
  default_notification_setting TEXT DEFAULT 'all' CHECK (default_notification_setting IN ('all', 'mentions', 'nothing')),
  allow_dnd_override BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New Table: `team_chat_role_auto_join`

```sql
CREATE TABLE public.team_chat_role_auto_join (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, role, channel_id)
);
```

---

## UI Components

### 1. Settings Trigger in Sidebar

Add a gear icon button in the `ChannelSidebar` header (next to "Team Chat" title), visible only to super admins.

### 2. TeamChatAdminSettingsSheet

A new Sheet component with tabbed navigation:

```text
┌──────────────────────────────────────────────────────┐
│ ⚙️ TEAM CHAT SETTINGS                              ✕ │
├──────────────────────────────────────────────────────┤
│ [Channels] [Display] [Permissions] [Auto-Join]       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Channel Creation                                     │
│ ┌──────────────────────────────────────────────────┐│
│ │ Who can create public channels?                  ││
│ │ [▾ Admins and above                          ]   ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Who can create private channels?                 ││
│ │ [▾ Managers and above                        ]   ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ Default Channels for New Members                     │
│ ┌──────────────────────────────────────────────────┐│
│ │ ☑ #general  ☑ #company-wide  ☐ #managers        ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│                              [Save Changes]          │
└──────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/team-chat/TeamChatAdminSettingsSheet.tsx` | Main settings sheet with tabs |
| `src/hooks/team-chat/useTeamChatSettings.ts` | Hook to fetch/update settings |
| `src/hooks/team-chat/useTeamChatRoleAutoJoin.ts` | Hook for role-based auto-join rules |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/team-chat/ChannelSidebar.tsx` | Add admin settings gear icon in header |
| `src/components/team-chat/CreateChannelDialog.tsx` | Check permissions before allowing creation |
| `src/components/team-chat/MessageItem.tsx` | Respect display settings (role badge, title, photo) |
| `src/hooks/team-chat/useAutoJoinLocationChannels.ts` | Integrate role-based auto-join rules |
| `src/components/team-chat/index.ts` | Export new component |

---

## Permission Check

The settings button will only be visible to users where:
```typescript
const { data: profile } = useEmployeeProfile();
const canAccessSettings = profile?.is_super_admin === true;
```

This follows the existing pattern used throughout the app for super admin checks.

---

## Benefits

- **Centralized Control**: Account owners get Slack-like workspace admin capabilities
- **Role-Based Automation**: Reduces manual channel management as team grows
- **Consistent Experience**: Display settings ensure uniform message appearance
- **Scalable Permissions**: Granular control over who can do what
- **Organization-Scoped**: Each organization can have its own settings
