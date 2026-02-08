

# Fix: Chat Tab Crashing in Help FAB

## Problem
When clicking the "Chat" tab in the Help FAB, the app crashes with an error because the `ChatLeadershipTab` component is trying to use presence tracking (to show online/offline status) but the required provider isn't available outside of Team Chat.

## Root Cause
The `ChatLeadershipTab` uses `usePlatformPresenceContext()` which requires being wrapped by `PlatformPresenceProvider`. However, the Help FAB is rendered in `DashboardLayout` which doesn't include this provider - it only exists on the Team Chat page.

## Solution
Make the presence context usage optional - if the provider isn't available, simply show all members without online/offline status. This is a graceful degradation that keeps the feature functional.

## Technical Changes

### 1. Create a Safe Presence Hook
**File:** `src/contexts/PlatformPresenceContext.tsx`

Add a new export `usePlatformPresenceContextSafe()` that returns `null` when used outside the provider instead of throwing an error:

```typescript
export function usePlatformPresenceContextSafe() {
  return useContext(PlatformPresenceContext);
}
```

### 2. Update ChatLeadershipTab
**File:** `src/components/dashboard/help-fab/ChatLeadershipTab.tsx`

- Import `usePlatformPresenceContextSafe` instead of `usePlatformPresenceContext`
- Handle the case where presence is `null`:
  - If presence data is available, show online indicators as before
  - If not available, hide online indicators or show all as "unknown"

## Files to Modify

| File | Change |
|------|--------|
| `src/contexts/PlatformPresenceContext.tsx` | Add `usePlatformPresenceContextSafe` function |
| `src/components/dashboard/help-fab/ChatLeadershipTab.tsx` | Use safe context hook, handle null case |

## Expected Result
- Chat tab works on all dashboard pages
- On pages without presence provider: members shown without online/offline status
- On Team Chat page: full online/offline status shown (if user navigates there later)

