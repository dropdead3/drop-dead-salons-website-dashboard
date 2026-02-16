

# Email Compliance and Preference Center -- Gaps and Enhancements

## Gaps Found

### Gap 1: `send-feedback-request` Sends Client Emails Without Unsubscribe Check

This function emails clients directly (feedback requests after appointments) but does NOT pass `clientId` to `sendOrgEmail`. If a client has opted out of marketing, they would still receive this email. Feedback requests are borderline -- they are triggered by a specific transaction (appointment), which makes them closer to transactional, but they are technically optional solicitations. Best practice: check opt-out and include an unsubscribe link.

**Fix:** Pass `clientId` to `sendOrgEmail` in this function, same as the re-engagement and automation callers.

### Gap 2: No Re-Subscribe Path

The current unsubscribe page is a dead end. Once a client clicks unsubscribe, there is no way for them to re-opt-in. CAN-SPAM does not require a re-subscribe mechanism, but from a business perspective it is a missed opportunity.

**Fix:** Add a "Changed your mind?" link on the unsubscribe confirmation page that re-opts the client in using the same signed token (a second endpoint or a query parameter like `?action=resubscribe`).

### Gap 3: No Token Expiration

The signed unsubscribe URLs have a `ts` (timestamp) in the payload but nothing validates it. Links generated years ago will still work. This is fine for unsubscribe (CAN-SPAM requires links to work for 30 days minimum), but it means there's no replay protection or link rotation.

**Fix:** Add optional expiration validation in `verifySignedPayload` -- accept links up to 365 days old, reject older ones with a "link expired" message and instructions to contact the salon.

### Gap 4: No Physical Address in Footer

CAN-SPAM requires a physical mailing address in every commercial email. The current `buildBrandedTemplate` footer has social links and attribution but no postal address field.

**Fix:** Add an `email_physical_address` field to the organizations table (or use an existing address field) and render it in the email footer. This is a legal requirement.

### Gap 5: No Email Send Logging for Client Emails

Staff insights emails update `insights_email_last_sent` and `insights_email_next_at`. Client marketing emails have `reengagement_outreach` logging, but there is no unified email log. If a client disputes receiving emails, there is no audit trail.

**Fix:** Create a lightweight `email_send_log` table that records every client-facing email: `(organization_id, client_id, email_type, sent_at, message_id, status)`. The `sendOrgEmail` function writes to it after successful sends.

### Gap 6: No Rate Limiting on Client Emails

A client could receive a re-engagement email, an automation email, and a feedback request all on the same day. There is no frequency cap to prevent email fatigue.

**Fix:** Before sending any client email, check the `email_send_log` for recent sends to the same client. If they received an email within the last 48 hours, skip or queue the new one.

### Gap 7: Unsubscribe Confirmation Page Has No Branding Context

The current `unsubscribe-client-email` page shows the salon name but does not pull the salon's logo or accent color. The insights unsubscribe page also lacks branding. Both should feel like they belong to the salon, not a generic page.

**Fix:** Fetch `email_logo_url` and `email_accent_color` from the organizations table (already queried) and apply them to the confirmation page header.

## Recommended Changes

### Database

1. Add `email_physical_address TEXT` column to the `organizations` table
2. Create `email_send_log` table:
   - `id UUID PK`
   - `organization_id UUID`
   - `client_id UUID`
   - `email_type TEXT` (marketing, feedback, transactional)
   - `message_id TEXT` (from Resend)
   - `sent_at TIMESTAMPTZ DEFAULT now()`
   - Index on `(organization_id, client_id, sent_at)`

### Edge Functions

1. **`_shared/email-sender.ts`**
   - After successful Resend send with `clientId`, insert into `email_send_log`
   - Add physical address to `buildBrandedTemplate` footer
   - Add 48-hour rate limit check before sending client emails

2. **`send-feedback-request/index.ts`**
   - Pass `clientId` to `sendOrgEmail` so opt-out is respected and unsubscribe link is injected

3. **`unsubscribe-client-email/index.ts`**
   - Add re-subscribe support via `?action=resubscribe` query parameter
   - Add token age validation (reject links older than 365 days)
   - Pull org logo and accent color for branded confirmation page

4. **`_shared/signed-url.ts`**
   - Add optional `maxAgeMs` parameter to `verifySignedPayload` for token expiration

### Frontend

5. **Organization Settings (Email Branding section)**
   - Add a "Business Address" field for CAN-SPAM compliance
   - This goes in the existing email branding settings area on the admin settings page

## Priority Order

1. Physical address in footer (legal requirement)
2. `send-feedback-request` opt-out check (compliance gap)
3. Email send logging (audit trail)
4. Rate limiting (client experience)
5. Token expiration (security hardening)
6. Re-subscribe path (business value)
7. Branded unsubscribe page (polish)

## Technical Notes

- The `email_send_log` table should use RLS with service-role-only access (same as `client_email_preferences`)
- Rate limiting logic goes in `sendOrgEmail` before the Resend API call, after the opt-out check
- The physical address field should be presented in the settings UI with helper text explaining "Required by CAN-SPAM for all commercial emails"
- Re-subscribe uses the same HMAC verification, just toggles `marketing_opt_out` back to `false` and clears `opt_out_at`

