

# Zura Insights Email Reports

## What You Get

A beautiful, branded email digest that delivers your personalized Zura insights straight to your inbox. Users can choose their frequency (daily, weekly, or Monday morning), and the email content is role-gated -- the exact same security rules from the personal/business insights system apply, so stylists only see their own data and leadership sees the org-level view.

## Email Design

The email will use a polished, mobile-responsive HTML template with:
- Drop Dead Gorgeous branding (gradient header, logo)
- Sentiment indicator (positive/neutral/concerning) with color coding
- Clean card-style insight blocks with category icons rendered as Unicode/emoji
- Numbered action items with priority badges
- A "View in App" button linking to the dashboard
- Footer with unsubscribe link and "Powered by Zura AI" branding
- Dark-on-light color scheme (emails don't support dark mode well)

## How It Works

1. User goes to Notification Preferences and enables "Zura Insights Email" with a frequency selector (daily / weekly / Monday briefing)
2. A scheduled edge function runs on a cron, finds users whose next delivery is due, generates fresh insights (reuses existing `ai-personal-insights` and `ai-business-insights` logic), renders them into the HTML email template, and sends via Resend
3. Each delivery is logged so we can track success/failure and avoid duplicate sends

## Technical Implementation

### 1. Database Migration

Add columns to the existing `notification_preferences` table:

```text
insights_email_enabled    boolean  default false
insights_email_frequency  text     default 'weekly'   -- 'daily', 'weekly', 'monday'
insights_email_last_sent  timestamptz  nullable
insights_email_next_at    timestamptz  nullable
```

This avoids creating a new table -- it naturally extends the existing notification preferences.

### 2. Update Notification Preferences UI

Add a new "Zura Insights Email" card to `src/pages/dashboard/NotificationPreferences.tsx`:
- Toggle to enable/disable
- Frequency selector (Daily digest, Weekly summary, Monday briefing)
- Shows next delivery time when enabled
- Preview button that triggers an immediate test send

### 3. Update the Hook

Add the new fields to `useNotificationPreferences` and `useUpdateNotificationPreferences` in `src/hooks/useNotificationPreferences.ts`.

### 4. New Edge Function: `send-insights-email`

This function handles both scheduled (cron) and on-demand (test/preview) sends:

- **Scheduled mode**: Query `notification_preferences` for users where `insights_email_enabled = true` and `insights_email_next_at <= now()`
- **On-demand mode**: Accept a `userId` parameter for immediate test sends
- For each user:
  - Determine role tier (leadership vs. personal)
  - Fetch the latest cached insights from `ai_business_insights` or `ai_personal_insights`
  - If no cached insights exist or they're stale, call the appropriate insights function internally
  - Render the HTML email template with the insight data
  - Send via the existing `sendEmail` utility from `_shared/email-sender.ts`
  - Update `insights_email_last_sent` and calculate `insights_email_next_at`

### 5. HTML Email Template

Built directly in the edge function as a template literal (emails need inline styles, not external CSS). The template includes:

- Responsive layout (max-width 600px, mobile-friendly)
- Gradient header bar with "Zura Insights" branding
- Summary line with sentiment color
- Insight cards with category labels, titles, and descriptions
- Action items as a numbered list with priority indicators
- "Open Dashboard" CTA button
- Unsubscribe link that calls an API to disable the email preference

### 6. Cron Job

Set up a `pg_cron` job that runs every hour, calling the `send-insights-email` function. The function itself checks which users are due for delivery based on their `insights_email_next_at` timestamp, so the cron frequency just determines the maximum delay.

### 7. Unsubscribe Edge Function

A simple `unsubscribe-insights-email` function that accepts a signed token in the URL, verifies it, and sets `insights_email_enabled = false`. This ensures one-click unsubscribe from the email itself without requiring login.

## Files to Create

1. `supabase/functions/send-insights-email/index.ts` -- main email generation and sending
2. `supabase/functions/unsubscribe-insights-email/index.ts` -- one-click unsubscribe handler

## Files to Modify

3. `src/pages/dashboard/NotificationPreferences.tsx` -- add Zura Insights Email card with frequency selector
4. `src/hooks/useNotificationPreferences.ts` -- add new preference fields
5. `supabase/config.toml` -- register new edge functions

## Database Changes

6. Migration: add 4 columns to `notification_preferences` table

## Security

- Unsubscribe tokens are signed with a server-side secret so they can't be forged
- Email content respects the same role-tier data access rules as the in-app insights
- No organizational financials leak to non-leadership users in emails
- Users can only trigger test sends for their own email address

