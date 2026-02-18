

# Website Settings -- Gap Analysis & Enhancement Plan

## Gaps Found

### 1. General Tab: Announcement Banner & Social Links are NOT wired to the database
The announcement banner toggle and text input are purely decorative -- no `onChange`, no `useState`, no save button. The existing `useAnnouncementBarSettings` hook exists and works but is not imported or used here. Same for social links -- the inputs are static HTML with no persistence.

**Fix:** Wire the announcement banner to `useAnnouncementBarSettings` / `useUpdateAnnouncementBarSettings`. Add a new `site_settings` key `website_social_links` for social URLs with save/load logic.

### 2. Edge Function Auth: `getClaims` may not exist on Supabase JS v2
The `verify-domain` edge function calls `supabase.auth.getClaims(token)` which is not a standard Supabase JS v2 method. This will fail at runtime.

**Fix:** Replace with `supabase.auth.getUser(token)` which is the correct v2 method for validating a JWT and extracting user info.

### 3. Edge Function: No authorization check
The function authenticates the caller (confirms they are logged in) but never checks whether the caller actually belongs to the organization they are verifying. Any authenticated user could verify any org's domain.

**Fix:** After getting the user, check `is_org_admin(user.id, organization_id)` or at minimum verify the user belongs to the org via an RPC call or query.

### 4. Domain input: No validation
The domain input accepts any string. No check for valid domain format (e.g., no spaces, must contain a dot, no protocol prefix, etc.).

**Fix:** Add client-side regex validation before saving (e.g., `/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/`).

### 5. Domain: No "edit/change domain" flow
Once a domain is saved, the only option is to remove it entirely and start over. There's no way to correct a typo without deleting and re-adding.

**Fix:** Add an "Edit" button that pre-fills the input and allows updating the domain in-place (which triggers a new verification token).

### 6. Booking Tab: Missing settings from the plan
The plan mentioned "show/hide specific stylists" and "show/hide specific services" controls. These were not implemented.

**Fix:** Add multi-select or toggle lists for stylist visibility and service visibility (can be stubbed as "Coming Soon" if the booking widget doesn't support it yet).

### 7. SEO Tab: No TikTok Pixel field
Given the Zura Marketing Platform doctrine and TikTok ad channel support, a TikTok Pixel ID field is missing alongside Meta Pixel.

**Fix:** Add `tiktok_pixel_id` to `WebsiteSeoLegalSettings` and a corresponding input field.

### 8. SEO Tab: No cookie consent toggle
The plan mentioned cookie consent management but it was not implemented.

**Fix:** Add a "Show cookie consent banner" toggle with basic configuration (message text, accept/decline behavior).

### 9. Legal Pages: External URLs only -- no built-in editor
Salons without existing legal pages have nowhere to host them. The current UI only accepts URLs.

**Fix (future):** Add an option to use built-in pages (rich text editor stored in `site_settings`) as an alternative to external URLs. For now, add helper text explaining salons can use free legal page generators.

### 10. No "Preview Website" button
The plan mentioned a "View as client" preview capability. Only a link to the Website Editor exists.

**Fix:** Add a "Preview Website" button that opens the public-facing site (using the org's subdomain or custom domain) in a new tab.

## Enhancement Implementation

### Files to edit:
| File | Changes |
|------|---------|
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Wire announcement bar hooks, add social links persistence, add TikTok pixel, add cookie consent toggle, add preview button, add stylist/service visibility stubs |
| `src/hooks/useWebsiteSettings.ts` | Add `tiktok_pixel_id` and `cookie_consent_enabled`/`cookie_consent_message` to `WebsiteSeoLegalSettings`; add `WebsiteSocialLinksSettings` interface |
| `src/components/dashboard/settings/DomainConfigCard.tsx` | Add domain format validation, add edit-domain flow |
| `supabase/functions/verify-domain/index.ts` | Fix auth to use `getUser()`, add org membership authorization check |

### Database:
- Insert new `site_settings` row for `website_social_links` with default empty values
- Update existing `website_seo_legal` default to include `tiktok_pixel_id`, `cookie_consent_enabled`, `cookie_consent_message`

### Priority order:
1. **Fix edge function auth** (broken -- will error at runtime)
2. **Wire announcement banner** to existing hooks (gap -- controls are non-functional)
3. **Add social links persistence** (gap -- inputs are non-functional)
4. **Domain validation & edit flow** (UX gap)
5. **Add TikTok pixel + cookie consent** (enhancement)
6. **Add preview website button** (enhancement)
7. **Stub stylist/service visibility in Booking** (planned feature)

