

# Universal Client Email Unsubscribe System

## Overview

Add a CAN-SPAM/GDPR-compliant unsubscribe mechanism to all client-facing marketing emails (re-engagement, bulk outreach). The unsubscribe confirmation page will include a clear reminder that appointment-related notifications remain active, encouraging clients to stay connected for booking updates.

## Current State

- **Insights emails** (internal/staff): Already have their own unsubscribe flow via `unsubscribe-insights-email` edge function. No changes needed.
- **Client marketing emails** (re-engagement, bulk outreach via `sendOrgEmail`): No unsubscribe mechanism. This is the gap.

## What Gets Built

### 1. Database: `client_email_preferences` Table

Tracks per-client, per-organization marketing email opt-out status.

```
client_email_preferences
  id               UUID (PK)
  organization_id  UUID (FK -> organizations)
  client_id        UUID (FK -> phorest_clients)
  marketing_opt_out BOOLEAN DEFAULT false
  opt_out_at       TIMESTAMPTZ
  created_at       TIMESTAMPTZ
  UNIQUE(organization_id, client_id)
```

RLS: Service role only (edge functions manage this, not browser clients).

### 2. Edge Function: `unsubscribe-client-email`

A new edge function that handles GET requests with signed tokens (same HMAC pattern as the existing insights unsubscribe). Renders a branded HTML confirmation page with:

- Confirmation message: "You've been unsubscribed from marketing emails."
- Reassurance callout: "You'll still receive appointment confirmations, reminders, and booking updates -- no action needed."
- A subtle link back to the salon's website (if configured in social links).

### 3. Shared Utility: Signed URL Builder

Extract the HMAC token-signing logic (currently duplicated in `send-insights-email`) into a shared helper in `_shared/`, so both the insights and client unsubscribe flows use the same pattern.

New file: `supabase/functions/_shared/signed-url.ts`
- `buildSignedUrl(functionName, payload)` -- returns a full signed URL
- `verifySignedPayload(payload, sig)` -- returns decoded payload or throws

### 4. Email Sender Integration

Modify `sendOrgEmail` to accept an optional `clientId` parameter. When provided:

1. Check `client_email_preferences` -- skip sending if opted out
2. Generate a signed unsubscribe URL
3. Inject the unsubscribe link into the email footer (inside `buildBrandedTemplate`)
4. Add `List-Unsubscribe` and `List-Unsubscribe-Post` headers to the Resend API call (required by Gmail/Yahoo 2024+ sender guidelines)

### 5. Callers Updated

- `check-client-inactivity`: Pass `client_id` to `sendOrgEmail`, check opt-out before sending
- `process-client-automations`: Same treatment for bulk outreach

## File Changes

### New: `supabase/migrations/...add_client_email_preferences.sql`
- Create `client_email_preferences` table with unique constraint and RLS enabled (no browser policies -- service role only)

### New: `supabase/functions/_shared/signed-url.ts`
- `buildSignedUrl(baseUrl, functionName, payload)` -- HMAC-signs and returns URL
- `verifySignedPayload(payload, sig)` -- verifies and decodes

### New: `supabase/functions/unsubscribe-client-email/index.ts`
- GET handler: verify signature, set `marketing_opt_out = true`, render confirmation page
- Confirmation page includes appointment notification reassurance message
- Styled consistently with the existing insights unsubscribe page (purple gradient icon, clean layout)

### Modified: `supabase/functions/_shared/email-sender.ts`
- `OrgEmailPayload` gains optional `clientId?: string`
- `sendOrgEmail` checks opt-out status when `clientId` is provided
- `buildBrandedTemplate` accepts optional `unsubscribeUrl` and renders it in the footer
- Resend API call includes `List-Unsubscribe` header when URL is present

### Modified: `supabase/functions/check-client-inactivity/index.ts`
- Pass `client_id` when calling `sendOrgEmail`

### Modified: `supabase/functions/send-insights-email/index.ts`
- Refactor to use shared `buildSignedUrl` utility (removes duplicated HMAC logic)

## Unsubscribe Confirmation Page Copy

```
Title: "Unsubscribed"
Body: "You've been removed from marketing emails from [Salon Name]."

Callout box:
"Your appointment reminders and booking confirmations are not affected.
You'll continue to receive notifications about your upcoming visits."
```

## Technical Details

### Token Payload Structure
```json
{ "cid": "<client_id>", "oid": "<org_id>", "ts": 1234567890 }
```

### Opt-Out Check Flow
```
sendOrgEmail called with clientId
  -> query client_email_preferences for (org_id, client_id)
  -> if marketing_opt_out = true, skip send, return { success: true, skipped: true }
  -> else proceed with send, inject unsubscribe footer
```

### List-Unsubscribe Headers (Gmail/Yahoo compliance)
```
List-Unsubscribe: <https://...functions/v1/unsubscribe-client-email?payload=...&sig=...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

