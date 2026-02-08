

# Fix: Platform User Access to Team Chat

## Problem

Platform users (like you, Alex Day) don't have an organization assigned to their profile. The Team Chat requires an `effectiveOrganization` to load channels, but for platform users this is `null` unless they manually select an organization.

---

## Solution Options

### Option A: Auto-Select Default Organization (Recommended)

When a platform user opens Team Chat without an organization selected, automatically select the default organization ("Drop Dead Salons") so they can immediately see and use channels.

| Change | File |
|--------|------|
| Detect missing org in Team Chat | `src/pages/dashboard/TeamChat.tsx` |
| Auto-select default org for platform users | Uses `setSelectedOrganization` from context |

### Option B: Show Prompt to Select Organization

Display a message prompting the platform user to select an organization before using Team Chat.

| Change | File |
|--------|------|
| Add organization selector prompt | `src/components/team-chat/TeamChatContainer.tsx` |

---

## Recommended Implementation (Option A)

### Changes to TeamChat.tsx

```typescript
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useEffect } from 'react';

export default function TeamChat() {
  const { isPlatformUser } = useAuth();
  const { effectiveOrganization, setSelectedOrganization } = useOrganizationContext();
  const { data: organizations } = useOrganizations();

  // Auto-select first organization for platform users if none selected
  useEffect(() => {
    if (isPlatformUser && !effectiveOrganization && organizations?.length > 0) {
      // Select the default organization (Drop Dead Salons)
      const defaultOrg = organizations.find(o => o.slug === 'drop-dead-salons') || organizations[0];
      setSelectedOrganization(defaultOrg);
    }
  }, [isPlatformUser, effectiveOrganization, organizations, setSelectedOrganization]);

  // ... rest of component
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/TeamChat.tsx` | Auto-select organization for platform users |

---

## Result

| Before | After |
|--------|-------|
| Platform user sees empty channel list | Platform user automatically views "Drop Dead Salons" channels |
| Must manually switch org in header | Team Chat works immediately |
| Confusing empty state | Channels load as expected |

---

## Alternative: User Action Required

If auto-selection is not desired, you can manually:
1. Click the organization switcher in the dashboard header
2. Select "Drop Dead Salons" (or any organization)
3. Team Chat will then show that organization's channels

