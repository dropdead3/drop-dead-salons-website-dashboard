

# Fix Chat with Leadership - Auto-Select Org for Platform Users

## Problem
The Chat tab shows "No managers available" because platform users don't have an organization selected by default. The `useLeadershipMembers` hook returns an empty array when `effectiveOrganization` is `null`.

## Solution
Apply the same auto-select behavior that Team Chat uses: when a platform user opens the Chat tab without an org selected, automatically select a default organization so leadership members are loaded.

## Technical Approach

### Update ChatLeadershipTab Component

Add the same auto-select logic that exists in `TeamChat.tsx`:

```typescript
// In ChatLeadershipTab.tsx
const { isPlatformUser } = useAuth();
const { effectiveOrganization, setSelectedOrganization } = useOrganizationContext();
const { data: organizations } = useOrganizations();

// Auto-select org for platform users (mirrors TeamChat.tsx logic)
useEffect(() => {
  if (isPlatformUser && !effectiveOrganization && organizations?.length > 0) {
    const defaultOrg = organizations.find(o => o.slug === 'drop-dead-salons') || organizations[0];
    setSelectedOrganization(defaultOrg);
  }
}, [isPlatformUser, effectiveOrganization, organizations, setSelectedOrganization]);
```

## Flow Confirmation

The DM flow works correctly:
1. **User clicks manager** → Calls `createDM(userId)`
2. **createDM checks for existing DM** → If found, returns existing channel
3. **If no existing DM** → Creates new DM channel with both users as members
4. **Navigate to Team Chat** → User lands on `/dashboard/team-chat` with the conversation ready

This means clicking the same manager twice will open the same conversation, not create duplicates.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/help-fab/ChatLeadershipTab.tsx` | Add auto-select org logic for platform users |

## Expected Result
- Platform users see leadership members immediately when opening Chat tab
- Regular organization users continue to see their org's managers (no change)
- Clicking a manager creates or opens existing DM, then navigates to Team Chat
