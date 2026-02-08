
# Replace Support Tab with "Chat with Leadership"

## Overview
Replace the ticket-based Support tab with a direct messaging interface that shows available managers and leadership team members. When clicked, it navigates to Team Chat and opens a DM with that person.

## Why This is Better
- **Immediate response**: Chat is real-time vs. waiting for ticket review
- **Reuses existing infrastructure**: DM channels, Team Chat, presence system
- **No orphaned tickets**: Current ticket system has no UI for managers to respond
- **More personal**: Direct human connection vs. impersonal ticket system

## Technical Approach

### Replace SupportTab with ChatLeadershipTab

**File:** `src/components/dashboard/help-fab/ChatLeadershipTab.tsx`

Show a list of available managers/admins filtered from `employee_profiles` + `user_roles`:

```text
┌─────────────────────────────────────────┐
│  Chat with Leadership                   │
│                                         │
│  👤 Sarah (Manager)                     │  
│     Online • Tap to chat               │
│  ─────────────────────────────────      │
│  👤 Mike (Admin)                        │
│     Away • Tap to chat                  │
│  ─────────────────────────────────      │
│  👤 Lisa (Manager)                      │
│     Offline • Tap to chat               │
└─────────────────────────────────────────┘
```

### Implementation Details

1. **Fetch Leadership Members**
   - Query `user_roles` for roles: `manager`, `admin`, `super_admin`
   - Join with `employee_profiles` for names, photos
   - Exclude current user
   - Show their online status if presence data is available

2. **On Click Handler**
   - Call `createDM(userId)` from existing `useDMChannels` hook
   - Navigate to `/dashboard/team-chat`
   - The DM will automatically be active (via the hook's `setActiveChannel`)

3. **Update HelpFAB.tsx**
   - Replace `SupportTab` import with `ChatLeadershipTab`
   - Rename tab label from "Support" to "Chat"

### New Hook: `useLeadershipMembers`

**File:** `src/hooks/team-chat/useLeadershipMembers.ts`

```typescript
// Fetches employees with leadership roles (manager, admin, super_admin)
// Returns: { members, isLoading }
```

This is cleaner than modifying `useTeamMembers` because:
- Pre-filters to leadership roles only
- Includes role display for each member
- Simpler API without unnecessary filters

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/help-fab/ChatLeadershipTab.tsx` | Leadership chat list |
| `src/hooks/team-chat/useLeadershipMembers.ts` | Fetch managers/admins |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/HelpFAB.tsx` | Replace Support tab with Chat tab |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/dashboard/help-fab/SupportTab.tsx` | No longer needed |
| `src/hooks/useSupportTickets.ts` | No longer needed |

## User Flow

1. User clicks Help FAB
2. Switches to "Chat" tab
3. Sees list of managers/admins
4. Clicks on a person
5. Gets navigated to Team Chat with that DM open
6. Can immediately start typing their message

## Edge Cases

- **No leadership found**: Show friendly message "No managers available"
- **User is a manager**: Still show other managers/admins to chat with
- **Already has DM with person**: Opens existing conversation (handled by `useDMChannels`)
