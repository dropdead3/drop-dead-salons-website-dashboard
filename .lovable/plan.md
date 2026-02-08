
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

## Implementation Status: ✅ COMPLETE

### Database Tables Created

- `team_chat_settings` - Organization-level chat configuration
- `team_chat_role_auto_join` - Role-to-channel auto-join mappings

### Files Created

| File | Purpose |
|------|---------|
| `src/components/team-chat/TeamChatAdminSettingsSheet.tsx` | Main settings sheet with tabs |
| `src/components/team-chat/settings/ChannelPermissionsTab.tsx` | Channel creation & default channels |
| `src/components/team-chat/settings/DisplaySettingsTab.tsx` | Name format & profile display options |
| `src/components/team-chat/settings/MessagingPermissionsTab.tsx` | Mentions, pins, deletion, attachments |
| `src/components/team-chat/settings/AutoJoinRulesTab.tsx` | Role-based auto-join configuration |
| `src/hooks/team-chat/useTeamChatSettings.ts` | Hook to fetch/update settings |
| `src/hooks/team-chat/useTeamChatRoleAutoJoin.ts` | Hook for role-based auto-join rules |

### Files Modified

| File | Changes |
|------|---------|
| `src/components/team-chat/ChannelSidebar.tsx` | Added admin settings gear icon in header |
| `src/components/team-chat/index.ts` | Export new component |
| `src/hooks/team-chat/index.ts` | Export new hooks |

---

## Permission Check

The settings button is only visible to users where:
```typescript
const { data: profile } = useEmployeeProfile();
const canAccessSettings = profile?.is_super_admin === true;
```

---

## Next Steps (Future Enhancements)

To fully enforce these settings throughout the app:

1. **CreateChannelDialog.tsx** - Check `channel_create_public`/`channel_create_private` permissions before allowing creation
2. **MessageItem.tsx** - Respect display settings (role badge, title, photo, name format)
3. **useAutoJoinLocationChannels.ts** - Integrate role-based auto-join rules from `team_chat_role_auto_join`
4. **MessageInput.tsx** - Check `allow_file_attachments` and `max_file_size_mb` before uploads
5. **Pinning/deletion** - Check `pin_message_permission` and `delete_others_messages` permissions
