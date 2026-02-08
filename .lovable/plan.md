

# Include Account Owner as Welcome Sender Option

## Problem

Currently, the "Add Welcome Sender" dialog excludes the currently logged-in user from the sender list. This means if the Account Owner wants to send a welcome message to new hires, they can't select themselves.

## Solution

Modify the `useLeadershipMembers` hook to include the current user as an option, with a special designation (e.g., "You") or prioritized at the top of the list.

---

## Technical Changes

### Update `useLeadershipMembers` Hook

**File:** `src/hooks/team-chat/useLeadershipMembers.ts`

Remove the filter that excludes the current user:
```typescript
// Before: .neq('user_id', user?.id ?? '')
// After: Remove this line
```

Add a flag `isCurrentUser` to each member so the UI can highlight them differently.

Update the interface:
```typescript
export interface LeadershipMember {
  user_id: string;
  display_name: string;
  full_name: string | null;
  photo_url: string | null;
  role: string;
  isCurrentUser?: boolean; // NEW
}
```

Sort to put current user first in the list.

### Update `WelcomeSenderDialog` Component

**File:** `src/components/team-chat/settings/WelcomeSenderDialog.tsx`

- Display "(You)" next to the current user's name
- Apply subtle visual distinction (e.g., border or badge)
- Current user appears at the top of the list

**Updated member row for current user:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar]  Your Name (You)                    Account Owner │
└─────────────────────────────────────────────────────────────┘
│  [Avatar]  Manager Name                             Manager │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/team-chat/useLeadershipMembers.ts` | Remove exclusion filter, add `isCurrentUser` flag, sort current user first |
| `src/components/team-chat/settings/WelcomeSenderDialog.tsx` | Show "(You)" label for current user |

---

## Expected Result

- Account Owner sees themselves in the sender list
- Current user is labeled with "(You)" for clarity
- Current user appears at the top of the list for easy selection
- Account Owner can now configure welcome messages from themselves

