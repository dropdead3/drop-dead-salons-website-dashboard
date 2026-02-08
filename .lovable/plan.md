
# Fix Role Filter in Channel Members Sheet

## The Problem

The role filter dropdown in the Channel Members panel is currently filtering by the **chat channel role** (Owner, Channel Admin, Member) instead of the user's **account-level role** (Stylist, Manager, Receptionist, Stylist Assistant, etc.).

As shown in the screenshot, all members display "Member" as their role, but they should display their actual job roles like "Manager", "Stylist", "Receptionist", etc.

---

## Solution Overview

Update the Channel Members feature to:
1. **Fetch account roles** alongside channel membership data
2. **Display account roles** as the primary role indicator (e.g., "Stylist", "Manager")
3. **Filter by account roles** using the actual job roles from the system
4. **Keep channel role as secondary info** (show crown/shield icons for channel owner/admin)

---

## Visual Result

```text
Before:                          After:
┌────────────────────────┐      ┌────────────────────────┐
│ Eric Day 👑            │      │ Eric Day 👑            │
│ Owner                  │      │ Super Admin (Owner)    │
├────────────────────────┤      ├────────────────────────┤
│ Manager Test Account   │      │ Manager Test Account   │
│ Member                 │      │ Manager                │
├────────────────────────┤      ├────────────────────────┤
│ Stylist Test Account   │      │ Stylist Test Account   │
│ Member                 │      │ Stylist                │
└────────────────────────┘      └────────────────────────┘

Filter Dropdown:                 Filter Dropdown:
- All Roles                      - All Roles
- Owners                         - Super Admin
- Channel Admins                 - Manager
- Members                        - Stylist
                                 - Receptionist
                                 - Stylist Assistant
                                 - ...
```

---

## Technical Changes

### 1. Update useChannelMembers Hook

Modify the query to join with `user_roles` table to fetch each member's account role:

```typescript
const { data, error } = await supabase
  .from('chat_channel_members')
  .select(`
    id,
    user_id,
    role,
    joined_at,
    profile:employee_profiles!chat_channel_members_employee_fkey (
      display_name,
      full_name,
      photo_url
    ),
    account_role:user_roles!inner (
      role
    )
  `)
  .eq('channel_id', channelId);
```

Update the `ChannelMember` interface to include account role.

### 2. Update ChannelMembersSheet Component

**Filter dropdown changes:**
- Fetch roles using `useRoles()` hook to get all account roles
- Replace static filter options with dynamic role list
- Filter members by `accountRole` instead of channel `role`

**Display changes:**
- Show account role as primary (e.g., "Stylist")
- Show channel role as secondary indicator (crown for owner, shield for admin)

### 3. Keep Channel Admin Indicators

The crown (owner) and shield (admin) icons will remain to show channel-specific permissions, but the text will show the account role.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/team-chat/useChannelMembers.ts` | Add user_roles join to fetch account role |
| `src/components/team-chat/ChannelMembersSheet.tsx` | Update filter to use account roles, update display |

---

## Benefits

- Users can filter channel members by their job function (Stylist, Manager, etc.)
- Easier to find specific team members in large channels
- Maintains channel admin/owner visibility with icons
- Uses the existing `useRoles()` hook for dynamic role data
