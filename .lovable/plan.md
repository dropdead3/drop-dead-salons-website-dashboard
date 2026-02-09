
# Enhance Lock Screen Flow: Navigate to User's Schedule After PIN Entry

## Overview

Modify the existing dashboard lock screen to navigate directly to the Schedule page after successful PIN entry, similar to Phorest's quick-login flow. The lock button is already in place in the sidebar footer.

## Current vs. Desired Behavior

| Current | Desired (Phorest-style) |
|---------|------------------------|
| Lock screen unlocks and stays on current page | Lock screen unlocks and navigates to `/dashboard/schedule` |
| Lock button only shows if user has PIN | Lock button always visible (anyone can lock for security) |
| Same user resumes session | User who enters PIN becomes the active session |

## Files to Modify

### 1. `src/components/dashboard/DashboardLockScreen.tsx`

**Changes:**
- Accept a navigation callback or use `useNavigate` directly
- After successful PIN validation, navigate to `/dashboard/schedule`
- Pass the validated user's ID via URL param or context so schedule can pre-filter

```typescript
// Add navigation after unlock
const navigate = useNavigate();

// In the success handler:
.then((result) => {
  if (result) {
    setValidatedUser({...});
    
    setTimeout(() => {
      onUnlock();
      // Navigate to schedule with user filter
      navigate('/dashboard/schedule', { 
        state: { 
          quickLoginUserId: result.user_id,
          quickLoginUserName: result.display_name 
        } 
      });
    }, 500);
  }
})
```

### 2. `src/components/dashboard/SidebarLockButton.tsx`

**Changes:**
- Remove the condition that hides the button when user has no PIN
- Anyone can lock the dashboard (for shared device security)
- The PIN entry will then require a valid PIN to unlock

```typescript
// Remove this condition:
// if (!pinStatus?.hasPin) {
//   return null;
// }

// Always show the lock button
```

### 3. `src/pages/dashboard/Schedule.tsx`

**Changes:**
- Read navigation state to check if this is a quick-login redirect
- If `quickLoginUserId` is in state, pre-select that staff member in the filter
- Show a subtle toast or greeting: "Welcome back, [Name]!"

```typescript
const location = useLocation();
const quickLoginState = location.state as { 
  quickLoginUserId?: string;
  quickLoginUserName?: string;
} | undefined;

// On mount, if quickLoginUserId is present:
useEffect(() => {
  if (quickLoginState?.quickLoginUserId) {
    setSelectedStaffIds([quickLoginState.quickLoginUserId]);
    toast.success(`Welcome back, ${quickLoginState.quickLoginUserName}!`);
    // Clear the state to prevent re-triggering
    window.history.replaceState({}, document.title);
  }
}, []);
```

### 4. `src/contexts/DashboardLockContext.tsx`

**Changes:**
- Optionally store the validated user info so other components can access who just logged in
- This enables future features like clock-in prompts (shown in Phorest screenshot #2)

```typescript
interface DashboardLockContextValue {
  isLocked: boolean;
  lock: () => void;
  unlock: (user?: { user_id: string; display_name: string }) => void;
  lastUnlockedUser?: { user_id: string; display_name: string };
}
```

## User Flow After Implementation

```text
1. Staff clicks Lock icon in sidebar footer
   ↓
2. Dashboard shows full-screen PIN entry
   ↓
3. Staff enters their 4-digit PIN
   ↓
4. System validates PIN against organization members
   ↓
5. If valid:
   - Show user avatar/name briefly (500ms)
   - Navigate to /dashboard/schedule
   - Pre-filter schedule to show that user's column
   - Show "Welcome back, [Name]!" toast
   ↓
6. If invalid:
   - Shake animation on PIN dots
   - Show "Incorrect PIN" message
   - Clear PIN input for retry
```

## Security Considerations

- Lock button visible to all (enables shared device security)
- Only valid PINs unlock (validates against `employee_profiles.login_pin`)
- PIN validation uses existing `validate_user_pin` RPC function
- Session switching handled via navigation state (not actual Supabase session swap - that's a future enhancement)

## Future Enhancement (Not in this scope)

The second Phorest screenshot shows a clock-in prompt after PIN entry. This could be added later:
- Check if user is clocked in when they unlock
- If not clocked in, show a dialog: "Hey [Name]! You're not clocked in. Clock in now?"
- This would integrate with a time tracking system

## Implementation Order

1. Update `SidebarLockButton.tsx` - Remove PIN requirement to show button
2. Update `DashboardLockContext.tsx` - Add `lastUnlockedUser` state
3. Update `DashboardLockScreen.tsx` - Add navigation after unlock
4. Update `Schedule.tsx` - Handle quick-login state and pre-filter
