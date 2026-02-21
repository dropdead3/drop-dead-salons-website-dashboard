

# Terminology Enforcement + Brand Tokenization

## Phase 1: Terminology Drift Report

### Category A -- Hardcoded Brand Name "Zura" (55 files, ~665 occurrences)

These are instances where the platform name "Zura" is hardcoded as a string literal instead of being drawn from a tokenized constant. No brand token system (`PLATFORM_NAME`) exists today.

| File | Line(s) | Current Usage | Issue |
|------|---------|---------------|-------|
| `src/pages/PlatformLanding.tsx` | 30, 146 | `"Zura"`, `"Zura Platform"` | Hardcoded brand in global landing page |
| `src/pages/UnifiedLogin.tsx` | 327, 561 | `"Get started with Zura"`, `"Zura Platform"` | Hardcoded brand in auth flows |
| `src/components/ErrorBoundary.tsx` | 36 | `"Zura encountered a rendering issue"` | Hardcoded brand in error fallback |
| `src/components/dashboard/help-fab/AIHelpTab.tsx` | 77, 79 | `"I'm Zura, your AI assistant"` | Hardcoded in tenant-facing help UI |
| `src/components/dashboard/PlatformFeedbackDialog.tsx` | 84 | `"help us improve Zura"` | Hardcoded in feedback dialog |
| `src/components/dashboard/PersonalInsightsDrawer.tsx` | 233 | `"ZURA PERSONAL INSIGHTS"` | Hardcoded in insights UI |
| `src/components/dashboard/IntegrationsTab.tsx` | 187 | `"your Zura appointments"` | Hardcoded in integrations copy |
| `src/components/dashboard/sales/GoalLocationRow.tsx` | 255 | `"Powered by Zura AI"` | Hardcoded in sales UI |
| `src/components/dashboard/sales/ShareToDMDialog.tsx` | 53 | `"Zura flagged that..."` | Hardcoded in message templates |
| `src/pages/dashboard/admin/ZuraConfigPage.tsx` | 19-20 | `"Zura Configuration"`, `"how Zura communicates"` | Hardcoded in admin config |
| `src/pages/dashboard/admin/ManagementHub.tsx` | 423 | `"Zura Configuration"` | Hardcoded in management hub |
| `src/pages/dashboard/Campaigns.tsx` | 87 | `"Zura AI insights"` | Hardcoded in campaigns |
| `src/pages/dashboard/NotificationPreferences.tsx` | 335, 347 | `"Zura Insights Email"`, `"your Zura insights"` | Hardcoded in notification settings |
| `src/components/executive-brief/SilenceState.tsx` | 78 | `"Before Zura can surface levers"` | Hardcoded in executive brief |
| `src/components/platform/account/EmailBrandingSection.tsx` | 330 | `"Sent via Zura"` | Hardcoded in email footer |

### Category B -- Terminology Conflation (Platform vs Organization)

| File | Line | Current | Issue | Fix |
|------|------|---------|-------|-----|
| `src/components/platform/CreateOrganizationDialog.tsx` | 138 | `"Set up a new organization on the platform"` | Correct usage -- no fix needed | N/A |
| `src/components/dashboard/help-fab/AIHelpTab.tsx` | 79 | `"using the platform"` | Tenant user sees "platform" when they should see the product name or nothing | Replace with brand token |
| `src/components/dashboard/MobileSubmitDrawer.tsx` | 63 | `"improve the platform"` | Tenant user sees "platform" generically | Replace with brand token |
| `src/pages/PlatformLanding.tsx` | 65 | `"Salon Management Platform"` | Correct -- describes what the system is | N/A |

### Category C -- SEO Component Has Hardcoded Tenant Data at Global Level

| File | Issue |
|------|-------|
| `src/components/SEO.tsx` | Contains hardcoded `BUSINESS_INFO` for "Drop Dead Salon" with specific addresses, phone numbers, reviews. This is tenant data baked into the global system. It should be dynamically pulled from the organization's settings or removed from the platform-level codebase entirely. |

**This is a cross-tenant data leak risk** -- the SEO component renders one specific tenant's schema markup for every visitor, regardless of organization context.

### Category D -- Correct Usage (No Action Needed)

The following are architecturally correct uses of "platform":
- `src/components/platform/*` -- These are the platform admin layer (global system UI). Correct.
- `platform_roles` table -- Global system roles. Correct.
- `usePlatformBranding` -- Global system branding. Correct.
- `PlatformContextBanner` -- Shows when platform admin is impersonating an org. Correct.
- `PLATFORM_THEME_TOKENS` in `usePlatformBranding.ts` -- Global system theme tokens. Correct.

---

## Phase 2: Corrections Plan

### 2A. Create Brand Token Infrastructure

**New file: `src/lib/brand.ts`**

```typescript
/**
 * Global platform identity token.
 * This is the PLATFORM name (the software system).
 * Never use this for Organization or tenant-level entities.
 */
export const PLATFORM_NAME = 'Zura';
export const PLATFORM_NAME_FULL = 'Zura Platform';

/**
 * AI assistant identity (configurable per org via zura_personality_config).
 * This fallback is used when no org-level config exists.
 */
export const AI_ASSISTANT_NAME_DEFAULT = 'Zura';
```

### 2B. Replace All Hardcoded "Zura" Strings with Token

Every file in Category A will import `PLATFORM_NAME` from `src/lib/brand.ts` and use the token instead of the literal string. Template literals will be used for interpolation (e.g., `` `${PLATFORM_NAME} encountered a rendering issue` ``).

Files to update (17 files):
1. `src/pages/PlatformLanding.tsx`
2. `src/pages/UnifiedLogin.tsx`
3. `src/components/ErrorBoundary.tsx`
4. `src/components/dashboard/help-fab/AIHelpTab.tsx`
5. `src/components/dashboard/PlatformFeedbackDialog.tsx`
6. `src/components/dashboard/PersonalInsightsDrawer.tsx`
7. `src/components/dashboard/IntegrationsTab.tsx`
8. `src/components/dashboard/sales/GoalLocationRow.tsx`
9. `src/components/dashboard/sales/ShareToDMDialog.tsx`
10. `src/pages/dashboard/admin/ZuraConfigPage.tsx`
11. `src/pages/dashboard/admin/ManagementHub.tsx`
12. `src/pages/dashboard/Campaigns.tsx`
13. `src/pages/dashboard/NotificationPreferences.tsx`
14. `src/components/executive-brief/SilenceState.tsx`
15. `src/components/platform/account/EmailBrandingSection.tsx`
16. `src/components/dashboard/MobileSubmitDrawer.tsx`
17. `src/hooks/usePlatformBranding.ts` (toast message only)

### 2C. Fix SEO Cross-Tenant Data Leak

The `src/components/SEO.tsx` file will be flagged but **not refactored in this pass** -- it requires a separate architectural decision about whether SEO is rendered per-org from database or removed from the global codebase. This is a Phase 2+ concern that should be addressed as part of the public website multi-tenancy work.

### 2D. Tenant-Facing "Platform" Copy Corrections

| File | Current | After |
|------|---------|-------|
| `AIHelpTab.tsx` | `"using the platform"` | `"using ${PLATFORM_NAME}"` |
| `MobileSubmitDrawer.tsx` | `"improve the platform"` | `"improve ${PLATFORM_NAME}"` |

---

## Phase 3: Brand Tokenization Scope

**What gets tokenized (Platform identity only):**
- `PLATFORM_NAME` -- used in UI copy, error messages, footers, landing pages
- `PLATFORM_NAME_FULL` -- used in copyright lines
- `AI_ASSISTANT_NAME_DEFAULT` -- fallback for AI assistant name

**What does NOT get tokenized:**
- "Organization" -- always a tenant entity, never tokenized
- "Location" -- always a business unit within an org
- "User" -- always a human with credentials
- Any tenant-level configuration (org names, slugs, settings)

---

## Cross-Tenant Risk Assessment

| Risk | Status | Detail |
|------|--------|--------|
| RLS isolation | OK | All tables use `organization_id` + RLS policies |
| Recommendation engine leakage | OK | AI insights are scoped to org via `organization_id` in queries |
| Executive briefs | OK | Scoped to org/location level |
| Alert scoping | OK | Alerts tied to org-level thresholds |
| SEO data leak | **AT RISK** | `SEO.tsx` has hardcoded "Drop Dead Salon" tenant data at global level |
| Global/tenant config separation | OK | `site_settings` is platform-level, `organization.settings` is tenant-level |
| Cross-tenant data in UI | OK | All queries filter by `effectiveOrganization.id` |

---

## Output Summary

| Metric | Value |
|--------|-------|
| Terminology Drift Instances | ~665 across 55 files |
| Hardcoded Brand Strings to Tokenize | 17 files |
| Cross-Tenant Risk Items | 1 (SEO.tsx -- flagged, deferred) |
| Conflation Errors (Platform/Org) | 2 minor copy issues |
| Architecture Integrity Score | **8/10** (deducted for SEO leak and missing brand token layer) |
| Tokenization Readiness After Fix | White-label ready for platform name swap |

---

## Technical Implementation

### New File
- `src/lib/brand.ts` -- Single source of truth for platform identity tokens

### Modified Files (17 total)
All modifications are string replacements: hardcoded `"Zura"` becomes `PLATFORM_NAME` (or `PLATFORM_NAME_FULL` for copyright lines). No architectural changes, no database changes, no new dependencies.

### What This Enables
- Single-constant brand swap for white-labeling
- Clean semantic separation: Platform (global) vs Organization (tenant)
- Investor-grade terminology discipline
- No risk of global token changes impacting organization data structures

