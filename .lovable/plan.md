
## One-Way Calendar Sync: Appointments to External Calendars

### What This Does
Your team members will be able to subscribe to a personal calendar feed URL that automatically shows their Zura appointments in Apple Calendar, Google Calendar, or Outlook -- without any personal calendar events flowing back into Zura. It's a true one-way, read-only sync.

### How It Works

The standard for this is an **iCalendar feed** (`.ics` URL). All three major calendar apps natively support subscribing to a URL that serves calendar data. Once subscribed, the calendar app periodically polls the URL (typically every 15-60 minutes) and updates automatically.

```text
+------------------+       polls every ~30 min        +-------------------+
|  Apple Calendar   | <------------------------------ |                   |
|  Google Calendar  | <----- subscribes to URL ------  |  Zura Calendar    |
|  Outlook          | <------------------------------ |  Feed (backend)   |
+------------------+                                  +-------------------+
         |                                                     |
   Shows appointments                                  Reads from
   as read-only events                                appointments table
         |                                                     |
   Personal events                                     Never reads from
   stay private                                        external calendars
```

### User Experience

1. User goes to **Calendar Settings** (or their profile)
2. Clicks **"Subscribe to Calendar"**
3. Gets a unique, private feed URL (contains a secure token so only they can access it)
4. Chooses Apple, Google, or Outlook -- each has a slightly different subscription method:
   - **Apple Calendar**: Opens `webcal://` link (one-click subscribe)
   - **Google Calendar**: Opens Google Calendar with the feed URL pre-filled
   - **Outlook**: Opens Outlook's "subscribe by URL" page or downloads `.ics`
5. Appointments appear in their external calendar automatically going forward

### What Gets Synced
- Appointment date, time, and duration
- Client name and service name
- Location
- Status (confirmed, cancelled, etc.)

### What Does NOT Happen
- No personal events from Apple/Google/Outlook flow into Zura
- No write access -- external calendars cannot modify Zura appointments
- The feed is read-only by design (iCalendar subscription standard)

---

### Technical Implementation

**1. Database: Calendar feed tokens table**

New table `calendar_feed_tokens` to store each user's unique feed URL token:
- `id`, `user_id`, `token` (unique, secure random string), `is_active`, `created_at`
- RLS: users can only manage their own tokens

**2. Backend function: `calendar-feed`**

A new backend function that:
- Accepts a token via query parameter (no auth header needed -- calendar apps can't send one)
- Looks up the user from the token
- Queries their appointments (upcoming + recent)
- Returns a valid `.ics` iCalendar file with all their appointments as VEVENT entries
- Sets `verify_jwt = false` (calendar apps authenticate via the secret token in the URL)

**3. Frontend: Calendar Sync UI**

A new `CalendarSubscribeModal` component accessible from Calendar Settings:
- Generates a token on first use (or shows existing one)
- Provides one-click subscribe buttons for Apple, Google, and Outlook
- Copy-to-clipboard for the raw feed URL
- Option to regenerate token (invalidates old subscriptions for security)

**4. Files to create/modify**

| File | Action |
|------|--------|
| `calendar_feed_tokens` table | Create via migration |
| `supabase/functions/calendar-feed/index.ts` | Create -- serves iCal feed |
| `src/components/dashboard/CalendarSubscribeModal.tsx` | Create -- subscription UI |
| `src/hooks/useCalendarFeedToken.ts` | Create -- manage feed tokens |
| Calendar settings or top bar | Modify -- add entry point to modal |

**5. Security considerations**
- Feed tokens are long random strings (64+ chars), making them unguessable
- Users can revoke/regenerate tokens at any time
- Feed only returns data for the token owner's appointments
- No write operations exposed
