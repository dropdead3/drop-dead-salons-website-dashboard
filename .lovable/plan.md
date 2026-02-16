

# Complete Multi-Tenant Email & Branding Cleanup (Items 1-7)

This plan addresses all remaining gaps from the email infrastructure audit to complete the multi-tenant migration.

---

## 1. Fix `send-inactivity-alerts` (missed function)

**Current state:** Still uses direct `fetch("https://api.resend.com/emails")` with hardcoded `from: "Drop Dead Gorgeous <onboarding@resend.dev>"` (line 238). Also references `SITE_URL` with a `dropdeadsalon.com` fallback.

**Fix:**
- Import and use `sendOrgEmail` from the shared utility
- Resolve `organization_id` from the employee profiles of the inactive participants
- Remove the direct Resend API call
- Remove the hardcoded "Drop Dead Gorgeous" sender

---

## 2. Fix `send-insights-email` (missed function)

**Current state:** Uses `sendEmail()` (platform-level) but has its own 150-line hardcoded HTML template with:
- "Drop Dead Gorgeous" in the footer (line 143)
- Hardcoded `https://dropdeadsalon.com/dashboard` URL (line 296)
- Zura-branded purple gradient header baked into the function

**Fix:**
- Switch from `sendEmail` to `sendOrgEmail` (insights are per-user within an org)
- Strip the custom HTML template wrapper and let `buildBrandedTemplate` handle the chrome
- Keep the insight cards / action items HTML as the inner content
- Replace hardcoded dashboard URL with `SITE_URL` env var

---

## 3. Set `SITE_URL` secret

**Current state:** `SITE_URL` is referenced in 7+ edge functions but is NOT configured as a secret. Every function falls back to either `dropdeadsalon.com` or a `.lovable.app` URL -- inconsistent and wrong for production.

**Fix:** Add `SITE_URL` as a secret. You will need to provide the value (e.g., `https://getzura.com` or your production domain).

---

## 4. Make AI assistant prompts dynamic

**Current state:**
- `ai-assistant/index.ts` (line 10): Hardcoded `"Drop Dead Salon Software"` in system prompt. It does load dynamic config via `loadZuraConfig()` and can override the display name, but the base prompt is still Drop Dead-branded.
- `demo-assistant/index.ts` (line 9): Hardcoded `"Drop Dead Salon Software"` with no dynamic config loading at all.

**Fix:**
- `ai-assistant`: Change base prompt to use generic "Zura" branding. The existing `loadZuraConfig()` mechanism already handles org-specific overrides, so this just fixes the default.
- `demo-assistant`: This is the public-facing product demo. It should stay branded to whatever the platform product name is. Update from "Drop Dead Salon Software" to "Zura" since this is the SaaS product, not a specific tenant.

---

## 5. Fix push notification VAPID contact

**Current state:** `send-push-notification/index.ts` (line 321) uses `"mailto:support@dropdeadhair.com"` as the VAPID subject.

**Fix:** Change to `"mailto:support@getzura.com"` (platform-level contact, not org-specific -- VAPID subject is a platform concern).

---

## 6. Clean up remaining hardcoded "Drop Dead" references

**Current state:** Beyond the functions above, there are references in:
- `test-phorest-connection/index.ts` (line 183): Fallback business name `"Drop Dead Hair Studios"` -- this is Phorest-specific and acceptable as a fallback for that integration, but should ideally use the org name.
- `sync-phorest-data/index.ts`: Comments referencing "Drop Dead Hair Studio" branch name format -- these are legitimate code comments explaining data format, no change needed.

**Fix:** Update `test-phorest-connection` to use a generic fallback like `"Unknown"` instead of hardcoding "Drop Dead Hair Studios".

---

## 7. Build Email Branding Admin UI

**Current state:** The database columns (`email_sender_name`, `email_reply_to`, `email_logo_url`, `email_accent_color`) exist on the `organizations` table but there is NO frontend UI to configure them. The only way to set these values is directly in the database.

**Fix:** Add an "Email Branding" section to the organization settings page with:
- **Sender display name** -- text input (what appears before the `@` in the "from" line)
- **Reply-to email** -- email input (where recipient replies go)
- **Email logo** -- image upload (reuse existing `business-logos` storage bucket)
- **Accent color** -- color picker (header background and accent bar in email template)
- **Preview** -- a small live preview showing the email header/footer with current branding so admins can see what recipients will receive

This will be added as a new card/section within the existing organization settings admin page.

---

## Technical Details

### Files to modify

| File | Change |
|---|---|
| `supabase/functions/send-inactivity-alerts/index.ts` | Replace direct Resend call with `sendOrgEmail`, resolve org ID |
| `supabase/functions/send-insights-email/index.ts` | Switch to `sendOrgEmail`, strip custom template, fix dashboard URL |
| `supabase/functions/ai-assistant/index.ts` | Change base prompt from "Drop Dead Salon Software" to "Zura" |
| `supabase/functions/demo-assistant/index.ts` | Change prompt from "Drop Dead Salon Software" to "Zura" |
| `supabase/functions/send-push-notification/index.ts` | Change VAPID subject to `support@getzura.com` |
| `supabase/functions/test-phorest-connection/index.ts` | Change fallback name from "Drop Dead Hair Studios" to "Unknown" |

### New file

| File | Purpose |
|---|---|
| `src/components/dashboard/settings/EmailBrandingSection.tsx` | Email branding config UI for org admins |

### Secret to add

| Secret | Value needed from you |
|---|---|
| `SITE_URL` | Your production domain (e.g. `https://getzura.com`) |

### Domain verification reminder

`mail.getzura.com` must be verified in your Resend dashboard for any of these emails to actually deliver. This is a manual step in the Resend console (add domain, set DNS records).

