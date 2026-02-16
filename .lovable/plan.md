

# Multi-Tenant Email Infrastructure

## The Problem

Right now, **every edge function has its own hardcoded sender address** -- and they're a mess. Across ~27 functions we found:

- `onboarding@resend.dev` (Resend sandbox -- won't deliver to real users)
- `noreply@lovable.app` (not your domain)
- `noreply@dropdeadsalons.com` (wrong domain)
- `noreply@dropdead.salon` (wrong domain)
- `noreply@dropdeadsalon.com` (correct, but hardcoded to Drop Dead)
- Various sender names: "Drop Dead 75", "Drop Dead Gorgeous", "Coaching", "Feedback Alert", "Platform Weekly Digest", etc.

As a SaaS platform, when Salon XYZ signs up, their staff shouldn't receive emails branded "Drop Dead." Every email needs to pull branding from the organization that owns the data.

## How It Will Work

```text
Platform owns ONE Resend account + ONE verified sending domain (e.g. mail.getzura.com)

Emails are sent FROM:    "Salon XYZ <notifications@mail.getzura.com>"
Emails REPLY-TO:         "contact@salonxyz.com" (from org settings)
Email BODY contains:     Salon XYZ logo, colors, name (from org settings)
```

Organizations never need their own Resend account. The platform handles delivery; the org just provides branding.

## Changes

### 1. Add email branding columns to `organizations` table

New columns:
- `email_sender_name` (text, nullable) -- e.g. "Drop Dead Salon". Falls back to `name`.
- `email_reply_to` (text, nullable) -- e.g. "contact@dropdeadsalon.com". Falls back to `primary_contact_email`.
- `email_logo_url` (text, nullable) -- URL for logo in email headers. Falls back to `logo_url`.
- `email_accent_color` (text, default `#000000`) -- brand color for email templates.

### 2. Upgrade the shared email utility (`_shared/email-sender.ts`)

Transform it into an **org-aware email builder**:

- New function: `sendOrgEmail(supabase, organizationId, payload)` that:
  1. Loads org branding from the `organizations` table (cached per request)
  2. Sets `from` to `"{org.email_sender_name} <notifications@mail.getzura.com>"`
  3. Sets `reply_to` to `org.email_reply_to`
  4. Wraps `html` content in a branded template with org logo + accent color
- Keep existing `sendEmail()` for platform-level emails (billing, trial expiration) that come from Zura itself
- New function: `buildBrandedTemplate(orgBranding, innerHtml)` for consistent email chrome

### 3. Refactor all edge functions (27 files)

Replace every hardcoded `from:` / `resend.emails.send()` call with the shared utility:

**Category A -- Org-level emails** (use `sendOrgEmail`):
These send to staff/clients within an organization and should carry org branding.
- `notify-sync-failure`, `check-staffing-levels`, `check-lead-sla`, `notify-headshot-request`
- `send-daily-reminders`, `send-training-reminders`, `send-handbook-reminders`
- `send-meeting-report`, `send-accountability-reminders`, `send-feedback-request`
- `notify-low-score`, `notify-assignment-response`, `reassign-assistant`
- `check-client-inactivity`, `send-inactivity-alerts`, `send-insights-email`
- `send-birthday-reminders`, `generate-rent-invoices`, `check-insurance-expiry`
- `send-program-reminders`, `send-test-email`, `notify-rent-change`
- `notify-stylist-checkin`, `kiosk-wrong-location-notify`, `check-payroll-deadline`

**Category B -- Platform-level emails** (use `sendEmail` with Zura branding):
These are about the platform/billing relationship and should come from Zura.
- `trial-expiration`, `onboarding-drip`, `dunning-automation`
- `weekly-digest`, `send-platform-invitation`, `send-changelog-digest`

### 4. Seed Drop Dead's email config

Insert the branding for your org so it works immediately:
- `email_sender_name`: "Drop Dead"
- `email_reply_to`: "contact@dropdeadsalon.com"
- `email_logo_url`: (your existing logo_url)
- `email_accent_color`: your brand color

### 5. Add org email settings to admin UI

Add an "Email Branding" section to the existing organization settings page where admins can configure:
- Sender display name
- Reply-to email
- Logo for emails
- Accent color

---

## Technical Details

### Shared utility signature

```text
// Platform emails (billing, trials, platform notices)
sendEmail(payload: EmailPayload): Promise<EmailResult>
  from: "Zura <notifications@mail.getzura.com>"

// Org-branded emails (staff/client notifications)
sendOrgEmail(supabase, orgId, payload): Promise<EmailResult>
  1. SELECT email_sender_name, email_reply_to, email_logo_url, email_accent_color, name, logo_url, primary_contact_email FROM organizations WHERE id = orgId
  2. from: "{email_sender_name || name} <notifications@mail.getzura.com>"
  3. reply_to: email_reply_to || primary_contact_email
  4. html: buildBrandedTemplate(branding, payload.html)
```

### Branded email template structure

```text
+------------------------------------------+
| [Org Logo]              Org Name         |
+------------------------------------------+
| accent color bar                         |
+------------------------------------------+
|                                          |
|  [Inner HTML content from each function] |
|                                          |
+------------------------------------------+
| Sent via Zura | Unsubscribe             |
+------------------------------------------+
```

### Migration SQL

```sql
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email_sender_name text,
  ADD COLUMN IF NOT EXISTS email_reply_to text,
  ADD COLUMN IF NOT EXISTS email_logo_url text,
  ADD COLUMN IF NOT EXISTS email_accent_color text DEFAULT '#000000';
```

### Domain decision needed

The sending domain (what goes after `@` in the from address) must be verified in Resend. Options:
- `mail.getzura.com` -- platform-branded (recommended for SaaS)
- `notifications.getzura.com` -- alternative
- Whatever your actual platform domain will be

You'll need to confirm the platform domain so we can set the correct `from` address across all functions.

