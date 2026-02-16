

# Enhanced Email Preview and Test Email

## Overview

Upgrade the Email Branding tab with two major features: (1) a rich, accurate email preview that mirrors the actual `buildBrandedTemplate()` output from the backend, and (2) a "Send Test Email" button that sends a real branded email to the admin so they can see exactly what recipients will receive.

## What Changes

### 1. Enhanced Live Preview (in `EmailBrandingSettings.tsx`)

Replace the current simplified preview with an accurate replica of the `buildBrandedTemplate()` function from `supabase/functions/_shared/email-sender.ts`. The current preview is a rough approximation -- the enhanced version will match the actual email output pixel-for-pixel:

- Outer wrapper with `#f4f4f5` background (matches email body bg)
- Header block with accent color, centered logo/org name (same logic as backend: logo image or fallback text)
- 4px gradient accent bar
- White content area with border, containing realistic sample content (not just skeleton lines) -- e.g., a greeting, a paragraph, and a CTA button
- Footer with "Sent via Zura" link, matching the real template's styling
- Desktop/mobile toggle to preview at 600px vs 360px width

### 2. Send Test Email Button (in `EmailBrandingSettings.tsx`)

Add a "Send Test Email" action next to Save Branding:

- Opens a small inline dialog/popover asking for recipient email (pre-filled with the logged-in user's email)
- Calls a new edge function `send-branding-test-email` that:
  - Authenticates the user and checks admin role
  - Fetches the org's current saved branding from the `organizations` table
  - Wraps sample content in `buildBrandedTemplate()` (the real branded template)
  - Sends via `sendOrgEmail` with a `[BRANDING TEST]` subject prefix
- Shows success/error toast after sending
- Note: This is distinct from the existing `send-test-email` function which sends a specific template -- this one tests the branding wrapper itself

### 3. New Edge Function: `send-branding-test-email`

**File:** `supabase/functions/send-branding-test-email/index.ts`

Purpose: Send a branded test email using the org's current branding settings with generic sample content (not tied to a specific template). This lets admins verify logo, color, sender name, and reply-to before going live.

Request body: `{ recipient_email: string }`

Flow:
1. Authenticate user via Bearer token
2. Check admin role via `user_roles` table
3. Get user's `organization_id` from `employee_profiles`
4. Call `sendOrgEmail()` with sample HTML content (greeting, paragraph, sample button)
5. Return success/error

### 4. Component UI Layout (Updated)

```text
+----------------------------------------------+
| EMAIL BRANDING                               |
| Customize how your outbound emails appear    |
|                                              |
| [Sender Name]        [Reply-To Email]        |
| [Logo Upload]        [Accent Color]          |
|                                              |
| [Show Preview]  [Send Test] [Save Branding]  |
+----------------------------------------------+
|                                              |
| EMAIL PREVIEW                 [Desktop|Mobile]|
| +------------------------------------------+ |
| |     [accent-color header with logo]      | |
| |     ================================     | |
| |                                          | |
| |  Hi there,                               | |
| |                                          | |
| |  This is a preview of how your branded   | |
| |  emails will appear to recipients...     | |
| |                                          | |
| |  [ View Dashboard ]  (accent CTA button) | |
| |                                          | |
| |     -------- footer --------             | |
| |     Sent via Zura                        | |
| +------------------------------------------+ |
+----------------------------------------------+
```

## Gap Analysis and Enhancements

### Gaps Identified

1. **Unsaved branding in test email**: The existing `send-test-email` uses saved DB values. The new test email will also use saved values, so the UI should warn admins to save first if there are unsaved changes.

2. **Preview uses local state, email uses DB state**: The preview reflects unsaved edits (good for design iteration), but the test email reflects what is saved. The UI will make this distinction clear with a note: "Test email uses your last saved branding."

3. **No email deliverability feedback**: After sending a test email, admins have no way to know if it landed in spam. This is a future enhancement (delivery status tracking).

### Suggested Future Enhancements

1. **Dark mode email preview** -- Toggle to see how the email renders in dark mode email clients (Gmail, Apple Mail dark mode invert colors).

2. **Template-specific preview** -- Let admins pick a real template (birthday, strike, onboarding) and preview it with branding applied, not just generic content.

3. **Custom footer text** -- Add a field for custom footer content (e.g., salon address, phone number) that appears above the "Sent via Zura" line.

4. **Email signature integration** -- Connect the Signatures tab presets so admins can preview signatures within the branded wrapper.

## Technical Details

### Files to Create

| File | Purpose |
|---|---|
| `supabase/functions/send-branding-test-email/index.ts` | Edge function to send a branded test email with sample content |

### Files to Modify

| File | Change |
|---|---|
| `src/components/dashboard/settings/EmailBrandingSettings.tsx` | Enhanced preview matching real template output, desktop/mobile toggle, send test email button with recipient input |

### Dependencies
- Uses existing `sendOrgEmail()` and `buildBrandedTemplate()` from `_shared/email-sender.ts`
- Uses existing `business-logos` storage bucket
- Uses existing `organizations` table columns
- No new database migrations needed
- No new secrets needed (uses existing RESEND_API_KEY)

