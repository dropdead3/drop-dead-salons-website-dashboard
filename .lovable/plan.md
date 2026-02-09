

# Add Quick Login PIN Card to Settings Page

## The Problem

The `UserPinSettings` component was created but never integrated into the Settings page. It needs to be added so users can set their personal PIN for quick dashboard login.

## Solution

Add the `UserPinSettings` component to the **System** category in Settings, right after the existing Security card.

## File to Modify

### `src/pages/dashboard/admin/Settings.tsx`

**Change 1: Add import (around line 86)**
```typescript
import { UserPinSettings } from '@/components/dashboard/settings/UserPinSettings';
```

**Change 2: Add component to system settings (after line 1246, the closing `</Card>` of Security)**
```typescript
{/* Quick Login PIN */}
<UserPinSettings />
```

## Result

After this change, when you navigate to **Settings > System**, you'll see:
1. Appearance card
2. Notifications card  
3. Security card
4. **Quick Login PIN card** ← New!

The PIN card will allow you to set your 4-digit PIN (3746) which can then be used with the lock button in the sidebar.

## Visual Location

```text
Settings > System tab
┌─────────────────────────────┐
│ APPEARANCE                  │
│ Color themes, dark mode...  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ NOTIFICATIONS               │
│ Staffing alerts, reminders  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ SECURITY                    │
│ Email verification...       │
└─────────────────────────────┘

┌─────────────────────────────┐  ← THIS WILL BE ADDED
│ 🔒 QUICK LOGIN PIN          │
│ Status: Not Set             │
│ [Set PIN]                   │
└─────────────────────────────┘
```

