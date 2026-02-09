
# Show Clock-In Prompt After Every Successful Unlock

## Change

One line added to `src/components/dashboard/DashboardLayout.tsx` in the `handleUnlock` function (around line 1133):

```typescript
const handleUnlock = (user?: { user_id: string; display_name: string }) => {
  unlock(user);
  // Clear any previous dismissal so prompt shows again (only if not clocked in)
  sessionStorage.removeItem('clock-in-prompt-dismissed');
  // Trigger clock-in prompt after unlock
  setClockInTrigger(prev => !prev);
};
```

The existing `ClockInPromptDialog` already skips the prompt when `isClockedIn` is true, so users who locked the dashboard without clocking out will never see the prompt. This change only affects users who are not clocked in -- they will always be re-prompted after a successful PIN unlock.
