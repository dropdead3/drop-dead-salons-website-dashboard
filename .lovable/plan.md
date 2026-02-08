

# Role-Based Welcome Senders

## Overview

Instead of tying welcome messages to a specific user (who might leave or change roles), attach them to a **role**. The system will dynamically find whoever currently holds that role and send the welcome message from them.

**Key Benefits:**
- If a Manager leaves, messages automatically come from the new Manager
- If no one has the role, that welcome rule is automatically inactive (no errors)
- More maintainable and resilient to team changes

---

## How It Works

```text
Current Flow (user-based):
┌─────────────────────────────┐
│ Rule: Send from Sarah Chen  │ ──→ Sarah leaves ──→ Rule breaks!
└─────────────────────────────┘

New Flow (role-based):
┌─────────────────────────────┐
│ Rule: Send from "Manager"   │ ──→ Sarah leaves ──→ New manager sends
└─────────────────────────────┘
                              ──→ No manager? ──→ Rule auto-deactivates
```

---

## Database Changes

**Modify `team_chat_welcome_rules` table:**
- Replace `sender_user_id` with `sender_role` (app_role type)
- Drop the unique constraint on `(organization_id, sender_user_id)`
- Add new unique constraint on `(organization_id, sender_role)` to prevent duplicate role configs

**Migration SQL:**
```sql
-- Add sender_role column
ALTER TABLE public.team_chat_welcome_rules 
ADD COLUMN sender_role TEXT NOT NULL DEFAULT 'manager';

-- Drop old unique constraint
ALTER TABLE public.team_chat_welcome_rules 
DROP CONSTRAINT IF EXISTS team_chat_welcome_rules_organization_id_sender_user_id_key;

-- Add new unique constraint  
ALTER TABLE public.team_chat_welcome_rules
ADD CONSTRAINT team_chat_welcome_rules_org_role_unique 
UNIQUE(organization_id, sender_role);

-- Eventually drop sender_user_id (after migration)
ALTER TABLE public.team_chat_welcome_rules 
DROP COLUMN IF EXISTS sender_user_id;
```

---

## UI Changes

### WelcomeSenderDialog
Replace the user picker with a **role selector**:

```text
Before (user picker):
┌─────────────────────────────────────────────────────────────┐
│  Select Sender                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search team members...                              │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [Avatar] Sarah Chen (You)                   Super Admin│ │
│  │ [Avatar] Mike Johnson                          Manager │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

After (role picker):
┌─────────────────────────────────────────────────────────────┐
│  Select Sender Role                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ○ Super Admin    - Complete system access              │ │
│  │ ● Manager        - Can manage team, view reports       │ │
│  │ ○ Admin          - Full access to all features         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Currently filling this role:                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Avatar] Mike Johnson                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### WelcomeDMsTab
Update the rule cards to show role instead of user:

```text
┌─────────────────────────────────────────────────────────────┐
│ [≡]  👔 Manager                                      [Edit] │
│      "Welcome to the team, [new_member_name]! 👋..."        │
│      Currently: Mike Johnson • Sends to: All roles          │
└─────────────────────────────────────────────────────────────┘
│ [≡]  👑 Super Admin                           (No one) [!]  │
│      "Hey [new_member_name]! I'm the owner..."              │
│      Currently: Unassigned • Sends to: Stylists             │
└─────────────────────────────────────────────────────────────┘
```

When no one has the role, show a warning badge "No one assigned" and the rule appears dimmed.

---

## Edge Function Updates

**`send-welcome-dms` function changes:**
1. Read `sender_role` instead of `sender_user_id`
2. Query `user_roles` to find users with that role in the organization
3. Pick the first matching user (or primary owner for super_admin)
4. If no user has the role, skip the rule (auto-deactivate behavior)
5. Send message from the resolved user

```typescript
// Pseudocode for role resolution
async function resolveSenderForRole(orgId: string, role: string): Promise<User | null> {
  const { data: usersWithRole } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', role);
  
  if (!usersWithRole?.length) return null; // No one has this role
  
  // Get the first user's profile from this org
  const { data: sender } = await supabase
    .from('employee_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .in('user_id', usersWithRole.map(u => u.user_id))
    .single();
    
  return sender;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add migration to change schema from `sender_user_id` to `sender_role` |
| `src/hooks/team-chat/useWelcomeDMRules.ts` | Update types and queries for role-based rules |
| `src/components/team-chat/settings/WelcomeSenderDialog.tsx` | Replace user picker with role selector |
| `src/components/team-chat/settings/WelcomeDMsTab.tsx` | Update display to show role + current holder |
| `supabase/functions/send-welcome-dms/index.ts` | Resolve sender from role at runtime |

---

## New Hook: useRoleMembers

Create a helper hook to get which users currently hold a specific role in the organization:

**File:** `src/hooks/team-chat/useRoleMembers.ts`

```typescript
export function useRoleMembers(role: string) {
  // Returns array of users who have this role in the current org
  // Used to show "Currently: Mike Johnson" in the UI
}
```

---

## Expected Behavior

| Scenario | Result |
|----------|--------|
| Manager configured, Mike is Manager | Welcome sent from Mike |
| Manager configured, Mike leaves, Jane becomes Manager | Welcome sent from Jane |
| Manager configured, no one has Manager role | Rule is skipped (no error) |
| Super Admin configured, owner exists | Welcome sent from owner |

---

## Summary

This change makes the welcome DM system more resilient by:
1. Decoupling messages from specific users
2. Auto-resolving the sender at message time
3. Gracefully handling vacant roles
4. Showing admins who currently fills each role

