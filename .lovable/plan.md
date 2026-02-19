

## Add Session Persistence to Sidebar Greeting

### Problem
The greeting ("WELCOME BACK, ERIC") currently shows every time the component mounts (e.g., on page refresh or navigation). It should only appear once per session, and then reappear when the dashboard is unlocked via PIN.

### Approach
Use `sessionStorage` to track whether the greeting has been shown. The dashboard lock/unlock flow will clear this flag so the greeting reappears after unlocking.

### Changes

**1. `src/components/dashboard/SidebarGreeting.tsx`**
- On mount, check `sessionStorage` for a `greeting-shown` key
- If already shown, initialize `isVisible` as `false` (skip the greeting entirely)
- When the greeting is displayed, immediately set the `greeting-shown` key in `sessionStorage`
- Keep the existing 30-second auto-dismiss timer

**2. `src/contexts/DashboardLockContext.tsx`**
- In the `unlock` callback, clear the `sessionStorage` `greeting-shown` key so the greeting will show again after PIN unlock
- This ties into the existing quick-switch/unlock flow naturally

### Result
- First load of session: greeting appears, auto-dismisses after 30 seconds
- Subsequent navigation/remounts within same session: greeting stays hidden
- After dashboard unlock (PIN entry): greeting reappears with a fresh welcome
- Browser tab close and reopen (new session): greeting appears again

