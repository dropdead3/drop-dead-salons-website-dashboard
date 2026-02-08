
# Add Dashboard Navigation to Team Chat

## Overview

Wrap the Team Chat page in the existing `DashboardLayout` component so the dashboard sidebar navigation is always visible on desktop. This provides consistent navigation and eliminates the need for a separate "back to dashboard" button.

---

## Current State

The Team Chat page renders its own standalone container without the dashboard sidebar:

```tsx
// Current: TeamChat.tsx
<PlatformPresenceProvider>
  <div className="h-[calc(100vh-4rem)]">
    <TeamChatContainer />
  </div>
</PlatformPresenceProvider>
```

Other dashboard pages like `DashboardHome` wrap their content in `DashboardLayout`:

```tsx
// Pattern from DashboardHome
<DashboardLayout>
  {/* page content */}
</DashboardLayout>
```

---

## Solution

Wrap the Team Chat content in `DashboardLayout` and adjust the height calculation to account for the dashboard header:

| File | Change |
|------|--------|
| `src/pages/dashboard/TeamChat.tsx` | Wrap content in `DashboardLayout` |
| `src/components/team-chat/TeamChatContainer.tsx` | Adjust height to fill available space |

---

## Changes

### 1. TeamChat.tsx

```tsx
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TeamChatContainer } from '@/components/team-chat';
import { PlatformPresenceProvider } from '@/contexts/PlatformPresenceContext';

export default function TeamChat() {
  return (
    <DashboardLayout>
      <PlatformPresenceProvider>
        <div className="h-[calc(100vh-4rem)]">
          <TeamChatContainer />
        </div>
      </PlatformPresenceProvider>
    </DashboardLayout>
  );
}
```

### 2. TeamChatContainer.tsx

Adjust the container to better fit within the dashboard layout by using flexible height that respects the dashboard footer and header:

```tsx
// Update height to account for dashboard header (4rem) + footer padding
<div className="flex h-[calc(100vh-8rem)] bg-background">
```

---

## Result

| Before | After |
|--------|-------|
| Full-screen chat with no dashboard nav | Chat embedded within dashboard layout |
| No way to navigate back except browser | Full sidebar navigation always visible |
| Chat has its own channel sidebar only | Both dashboard nav + channel sidebar visible |

The user will see:
- Dashboard sidebar on the left (collapsible, 288px wide)
- Team Chat channel sidebar next to it
- Message area in the remaining space
- All standard dashboard header controls (notifications, profile, etc.)
