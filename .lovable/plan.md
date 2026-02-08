
# Enable Browser Push Notifications

## Current Status

You have **most of the infrastructure already built**! The push notification system is about 80% complete:

| Component | Status |
|-----------|--------|
| Service Worker | ✅ Ready |
| Subscribe/Unsubscribe UI | ✅ Ready |
| Push subscriptions table | ✅ Ready |
| Edge function to send | ⚠️ Needs Web Push encryption |
| **VAPID Keys** | ❌ **Missing - BLOCKER** |
| Chat notification triggers | ❌ Not built |
| Chat notification preferences | ❌ Not built |

---

## Step 1: Generate and Configure VAPID Keys

VAPID (Voluntary Application Server Identification) keys are **required** for Web Push to work. You need to generate a key pair:

### How to Generate Keys

Run this command in any terminal:
```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BNxRW...
Private Key: DFk2H...
```

### What You'll Need to Provide

1. **VITE_VAPID_PUBLIC_KEY** - Goes in the frontend (I'll add this)
2. **VAPID_PUBLIC_KEY** - Backend secret (I'll request this)
3. **VAPID_PRIVATE_KEY** - Backend secret (I'll request this)

---

## Step 2: Fix Web Push Encryption

The current edge function uses a simplified approach that won't work reliably. I'll update it to use proper **RFC 8291 Web Push encryption**.

```text
┌────────────────┐         ┌─────────────────┐         ┌───────────────┐
│  Your Server   │ ──────► │  Push Service   │ ──────► │ User Browser  │
│  (Edge Func)   │ VAPID   │ (FCM/Mozilla)   │         │  (Service     │
│                │ signed  │                 │         │   Worker)     │
└────────────────┘         └─────────────────┘         └───────────────┘
```

**Technical changes:**
- Add proper payload encryption using p256dh and auth keys
- Use VAPID JWT authentication
- Add web-push npm package for Deno

---

## Step 3: Add Chat Notification Preferences

Extend the notification preferences to include chat-specific options:

| Preference | Description |
|------------|-------------|
| `dm_notifications_enabled` | Get notified for new direct messages |
| `mention_notifications_enabled` | Get notified when someone @mentions you |
| `channel_notifications_enabled` | Get notified for new messages in channels |

Users can customize which chat events trigger push notifications.

---

## Step 4: Integrate Chat with Push Notifications

Create a trigger that sends push notifications when:

1. **Direct Message received** → Notify recipient if not online
2. **@Mentioned in a channel** → Notify mentioned user
3. **New message in subscribed channel** → Notify based on preferences

```text
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  User sends     │ ──► │  Database        │ ──► │  Edge Function   │
│  message        │     │  Trigger         │     │  send-push       │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │  Push to         │
                                               │  recipient(s)    │
                                               └──────────────────┘
```

---

## Implementation Plan

### Database Changes
1. Add chat notification preference columns to `notification_preferences`
2. Create database trigger on `chat_messages` table for push notifications

### Edge Function Updates
1. Fix `send-push-notification` with proper Web Push encryption
2. Create `notify-chat-message` edge function for chat-specific logic

### Frontend Updates
1. Add VAPID public key to environment
2. Add chat notification preferences to notification settings page

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/send-push-notification/index.ts` | Update with proper Web Push |
| `supabase/functions/notify-chat-message/index.ts` | Create - Chat notification handler |
| `src/hooks/useNotificationPreferences.ts` | Add chat preferences |
| `src/pages/dashboard/NotificationPreferences.tsx` | Add chat notification UI |
| Database migration | Add columns + trigger |

---

## Next Steps

Before I can implement this, I need you to:

1. **Generate VAPID keys** by running: `npx web-push generate-vapid-keys`
2. **Share the keys** when prompted - I'll securely store them as backend secrets

Would you like me to proceed with the implementation once you have the VAPID keys?
