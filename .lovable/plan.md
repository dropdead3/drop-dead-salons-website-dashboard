
# Continue Multi-Tenant Email Refactor (Remaining ~19 Functions)

All remaining edge functions still use hardcoded `from` addresses (Resend sandbox, wrong domains, "Drop Dead" branding). This batch completes the migration to the shared `sendOrgEmail` / `sendEmail` utilities.

---

## Category A: Org-Level Functions (use `sendOrgEmail`)

These send to staff/clients within an organization and need dynamic org branding. Each will:
- Import `sendOrgEmail` from `../_shared/email-sender.ts`
- Remove `Resend` import and direct `resend.emails.send()` / `fetch("https://api.resend.com/...")` calls
- Pass the `organization_id` so branding is pulled automatically
- Strip inline HTML wrappers (the branded template handles that)

| Function | Current `from` | Org ID Source |
|---|---|---|
| `notify-low-score` | `Feedback Alert <noreply@dropdeadsalons.com>` | From `feedback.organization` join |
| `check-expired-assignments` | `Drop Dead 75 <onboarding@resend.dev>` (x2) | Need to join through `assistant_requests` to org |
| `assign-assistant` | `Drop Dead 75 <onboarding@resend.dev>` | Same join pattern |
| `notify-assignment-response` | `Drop Dead 75 <onboarding@resend.dev>` (x2) | Same join pattern |
| `reassign-assistant` | `Drop Dead 75 <onboarding@resend.dev>` (x2) | Same join pattern |
| `check-client-inactivity` | `Salon <noreply@dropdead.salon>` | From `campaign.organization_id` |
| `send-birthday-reminders` | `Drop Dead Gorgeous <onboarding@resend.dev>` | Need to add org awareness |
| `generate-rent-invoices` | `Drop Dead Gorgeous <noreply@dropdeadsalons.com>` | From `contract.organization_id` |
| `check-insurance-expiry` | `Drop Dead Gorgeous <noreply@dropdeadsalons.com>` | From `renter.organization_id` |
| `send-test-email` | `Drop Dead Gorgeous <onboarding@resend.dev>` | From authenticated user's org |
| `notify-rent-change` | Already uses `sendEmail` | Switch to `sendOrgEmail` with org from contract |
| `check-payroll-deadline` | Uses platform `sendEmail` | Switch to `sendOrgEmail` with `settings.organization_id` |
| `kiosk-wrong-location-notify` | `notifications@dropdeadsalons.com` | From `body.organization_id` |
| `process-client-automations` | `Drop Dead Salons <noreply@notifications.dropdeadsalons.com>` | From `rule.organization_id` |
| `check-lead-sla` | Already refactored sender but has hardcoded URL | Fix dashboard URL |
| `notify-headshot-request` | Already refactored sender but has hardcoded URL | Fix dashboard URL |
| `send-program-reminders` | No email (in-app only) | No changes needed |

## Category B: Platform-Level Functions (use `sendEmail` with Zura branding)

These are about the platform/billing relationship and should come from `Zura <notifications@mail.getzura.com>`.

| Function | Current `from` |
|---|---|
| `trial-expiration` | `Platform <noreply@lovable.app>` |
| `onboarding-drip` | `Platform Onboarding <onboarding@lovable.app>` |
| `weekly-digest` | `Platform Weekly Digest <digest@lovable.app>` |
| `send-platform-invitation` | `Platform <noreply@dropdeadsalons.com>` |
| `send-changelog-digest` | `updates@updates.dropdeadstudio.com` |

---

## Technical Details

### For each org-level function, the pattern is:

```
// BEFORE
import { Resend } from "https://esm.sh/resend@2.0.0";
const resend = new Resend(resendApiKey);
await resend.emails.send({
  from: "Drop Dead 75 <onboarding@resend.dev>",
  to: [email],
  subject: "...",
  html: "<div>...</div>",
});

// AFTER
import { sendOrgEmail } from "../_shared/email-sender.ts";
await sendOrgEmail(supabase, organizationId, {
  to: [email],
  subject: "...",
  html: "<p>Inner content only</p>",  // No wrapper needed
});
```

### For platform-level functions:

```
// BEFORE
await resend.emails.send({
  from: 'Platform <noreply@lovable.app>',
  to: [email],
  ...
});

// AFTER
import { sendEmail } from "../_shared/email-sender.ts";
await sendEmail({
  to: [email],
  subject: "...",
  html: "...",
  // from defaults to "Zura <notifications@mail.getzura.com>"
});
```

### Hardcoded URL fixes

Several already-refactored functions still have hardcoded URLs like `https://dropdeadsalon.com/dashboard/...`. These will be updated to use `SITE_URL` environment variable or the Supabase URL pattern, making them org-aware.

### Organization ID resolution

Some functions (assistant-related ones, birthday reminders) don't currently track `organization_id`. For these, the org will be resolved via:
- `employee_profiles.organization_id` for the relevant user
- Falling back gracefully if no org is found (sends without branding)

---

## Files to modify (19 total)

1. `notify-low-score/index.ts`
2. `check-expired-assignments/index.ts`
3. `assign-assistant/index.ts`
4. `notify-assignment-response/index.ts`
5. `reassign-assistant/index.ts`
6. `check-client-inactivity/index.ts`
7. `send-birthday-reminders/index.ts`
8. `generate-rent-invoices/index.ts`
9. `check-insurance-expiry/index.ts`
10. `send-test-email/index.ts`
11. `notify-rent-change/index.ts`
12. `check-payroll-deadline/index.ts`
13. `kiosk-wrong-location-notify/index.ts`
14. `process-client-automations/index.ts`
15. `trial-expiration/index.ts`
16. `onboarding-drip/index.ts`
17. `weekly-digest/index.ts`
18. `send-platform-invitation/index.ts`
19. `send-changelog-digest/index.ts`

Plus URL fixes in `check-lead-sla` and `notify-headshot-request`.
