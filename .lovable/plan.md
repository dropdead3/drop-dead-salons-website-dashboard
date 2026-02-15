

## Role-Aware Dynamic Welcome Messages

### Problem
The current greeting and subtitle pools are one-size-fits-all. Messages like "Ready to lead" or "Your operations are in motion" feel misplaced for stylists, receptionists, or booth renters. Zura should speak to each persona appropriately.

### Solution
Replace the single `GREETINGS` and `SUBTITLES` arrays with role-segmented message pools. The component already computes `isLeadership`, `hasStylistRole`, `isFrontDesk`, and `isReceptionist` -- we use those flags to pick the right pool at mount time.

### Message pools by role context

**Leadership (super_admin, manager):**
- Greetings: "Welcome back,", "Ready to lead,", "Let's build momentum,", "Great things ahead,", "Another strong day,", "Let's make it count,"
- Subtitles: "Here's what's happening across your operations", "Your team is set up for a strong day", "The numbers are telling a story", "Let's see where things stand", "Everything's moving in the right direction", "Here's your snapshot for today"

**Stylist / Stylist Assistant / Booth Renter:**
- Greetings: "Welcome back,", "Good to see you,", "You're on a roll,", "Another great day ahead,", "Let's make it a great one,", "Time to create,"
- Subtitles: "Here's what's on your schedule", "Your clients are going to love today", "Let's keep the momentum going", "You're set up for a strong day", "Here's your lineup for today", "Let's make every appointment count"

**Front Desk / Receptionist:**
- Greetings: "Welcome back,", "Good to see you,", "The front desk is yours,", "Another great day ahead,", "Let's keep things running smooth,", "Ready to roll,"
- Subtitles: "Here's what's coming in today", "The schedule is looking good", "Let's keep the flow going", "You're set up for a smooth day", "Here's your snapshot for today", "Everything's on track"

**Default (any other role -- admin_assistant, operations_assistant, bookkeeper, etc.):**
- Greetings: "Welcome back,", "Good to see you,", "Another great day ahead,", "Let's make it count,", "You're on a roll,", "Great things ahead,"
- Subtitles: "Here's what's happening today", "Let's keep the momentum going", "You're set up for a strong day", "Everything's moving in the right direction", "Here's your snapshot for today", "Let's see where things stand"

### Technical detail

**File: `src/pages/dashboard/DashboardHome.tsx`**

1. Replace the two flat arrays (`GREETINGS` and `SUBTITLES`) with a single object mapping role contexts to their greeting/subtitle pools:

```text
ROLE_MESSAGES = {
  leadership: { greetings: [...], subtitles: [...] },
  stylist:    { greetings: [...], subtitles: [...] },
  frontDesk:  { greetings: [...], subtitles: [...] },
  default:    { greetings: [...], subtitles: [...] },
}
```

2. Add a helper function `getMessagePool(isLeadership, hasStylistRole, isFrontDesk)` that returns the appropriate pool based on priority order: leadership first, then stylist, then front desk, then default.

3. Move the `useState` lazy initializers for `greeting` and `subtitle` below the role flag computations (lines ~160-171) so they can reference `isLeadership`, `hasStylistRole`, and `isFrontDesk`. The selection will use `useMemo` instead of `useState` since the role flags are available at mount and won't change during the session.

4. No other files need changes. The JSX rendering (lines 265-270) stays the same -- it already uses `{greeting}` and `{subtitle}`.
