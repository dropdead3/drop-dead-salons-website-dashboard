

# Start DM Dialog UI Improvements

## Changes Overview

Two UI refinements to the Start a Conversation dialog:

1. **Subtle hover background** - Replace the bright accent hover with a softer background
2. **Role display** - Show the member's role badge on the right side of each row

---

## Technical Details

### 1. Update `useTeamMembers` Hook

The hook currently doesn't return role information. We need to fetch roles alongside member data.

**File:** `src/hooks/team-chat/useTeamMembers.ts`

Add role to the returned data:
- After fetching employee profiles, query `user_roles` for all returned user IDs
- Map the primary role (first role) to each member
- Update the `TeamMember` interface to include `role: string | null`

### 2. Update `StartDMDialog` Component  

**File:** `src/components/team-chat/StartDMDialog.tsx`

**Hover effect change:**
- Change `hover:bg-accent` to `hover:bg-muted/50` for a subtler highlight

**Add role display:**
- Add a right-anchored role badge/label next to the name
- Use `ROLE_LABELS` to get the human-readable role name
- Style as muted text or a subtle badge

**Updated member row structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar]  Name                                    Stylist  │
│            email@example.com                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/team-chat/useTeamMembers.ts` | Fetch and return role for each member |
| `src/components/team-chat/StartDMDialog.tsx` | Subtle hover + right-aligned role display |

---

## Expected Result

- Hovering over a member row shows a subtle muted background instead of bright accent
- Each member row displays their role (e.g., "Manager", "Stylist") on the right side
- Cleaner, more professional appearance matching the screenshot reference

