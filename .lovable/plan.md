

# Phase 1-3: Brand Tokenization Audit, Platform Integrity Check, and Correction Plan

---

## Phase 1 -- Brand Tokenization Report

### Token Inventory (No Collisions, No Duplicates)

Two centralized token sources exist:

| File | Tokens Defined | Purpose |
|------|---------------|---------|
| `src/lib/brand.ts` | `PLATFORM_NAME`, `PLATFORM_NAME_FULL`, `PLATFORM_DESCRIPTOR`, `PLATFORM_CATEGORY`, `AI_ASSISTANT_NAME_DEFAULT`, `EXECUTIVE_BRIEF_NAME`, `MARKETING_OS_NAME`, `SIMULATION_ENGINE_NAME`, `AUTOMATION_LAYER_NAME` | Frontend |
| `supabase/functions/_shared/brand.ts` | `PLATFORM_NAME`, `PLATFORM_NAME_FULL`, `AI_ASSISTANT_NAME_DEFAULT`, `PLATFORM_URL` | Edge functions |

**No token collisions.** Both files define `PLATFORM_NAME`, `PLATFORM_NAME_FULL`, and `AI_ASSISTANT_NAME_DEFAULT` with identical values -- this is intentional since edge functions (Deno) cannot import from `src/`. The comment "Mirror of src/lib/brand.ts -- keep these in sync" documents the relationship.

**Gap:** Edge function `brand.ts` is missing `EXECUTIVE_BRIEF_NAME`, `MARKETING_OS_NAME`, `PLATFORM_DESCRIPTOR`. These are not currently needed in edge functions, but should be added for completeness.

### Remaining Hardcoded Brand Strings (18 items)

These strings survived the Phase 1 refactor and still reference "Zura" directly instead of using tokens:

| # | File | Hardcoded String | Required Token |
|---|------|-----------------|----------------|
| 1 | `src/components/dashboard/settings/ServiceAddonAssignmentsCard.tsx:228` | `"During booking, Zura surfaces these..."` | `PLATFORM_NAME` |
| 2 | `src/hooks/usePlatformFeedback.ts:69` | `"the Zura team will review..."` | `PLATFORM_NAME` |
| 3 | `src/components/dashboard/sales/compare/CompareTabContent.tsx:20` | `'zura-compare-mode'` (localStorage key) | Acceptable -- internal key, not user-facing |
| 4 | `src/components/kiosk/KioskProvider.tsx:80` | `'zura-kiosk-device-token'` (localStorage key) | Acceptable -- internal key, not user-facing |
| 5 | `supabase/functions/onboarding-drip/index.ts:17` | `'Welcome to Zura!'` | `PLATFORM_NAME` |
| 6 | `supabase/functions/onboarding-drip/index.ts:124` | `"Welcome to Zura, ${org.name}!"` | `PLATFORM_NAME` |
| 7 | `supabase/functions/send-insights-email/index.ts:255` | `"Zura Insights"` | `PLATFORM_NAME` |
| 8 | `supabase/functions/unsubscribe-insights-email/index.ts:62` | `"Zura Insights emails"` | `PLATFORM_NAME` |
| 9 | `supabase/functions/send-test-email/index.ts:25` | `"https://getzura.com/dashboard"` | `PLATFORM_URL` |
| 10 | `supabase/functions/send-test-email/index.ts:30` | `"https://getzura.com/staff-login"` | `PLATFORM_URL` |
| 11 | `supabase/functions/send-push-notification/index.ts:321` | `"mailto:support@getzura.com"` | `PLATFORM_URL` derived |
| 12 | `supabase/functions/_shared/email-sender.ts:64` | `"mail.getzura.com"` | `PLATFORM_URL` derived |
| 13 | `supabase/functions/_shared/email-sender.ts:223` | `"Zura"` (fallback sender name) | `PLATFORM_NAME` |
| 14 | `supabase/functions/_shared/email-sender.ts:304` | `"Zura"` (fallback org name) | `PLATFORM_NAME` |

**Component/file names** containing "Zura" (e.g., `ZuraAvatar.tsx`, `ZuraConfigPage.tsx`, `useZuraConfig.ts`, `ZuraNavigationContext.tsx`) are Phase 2 scope (code-only identifiers, not user-facing strings). They do not affect rendering.

### Corrections Required (Phase 1 Completion)

**14 string replacements** across 9 files to eliminate all user-facing hardcoded brand references:

1. **`ServiceAddonAssignmentsCard.tsx`** -- Import `PLATFORM_NAME`, replace hardcoded string in CardDescription
2. **`usePlatformFeedback.ts`** -- Import `PLATFORM_NAME`, replace toast description
3. **`onboarding-drip/index.ts`** -- Import `PLATFORM_NAME` from `_shared/brand.ts`, replace subject line and email body
4. **`send-insights-email/index.ts`** -- Import `PLATFORM_NAME`, replace subject line string
5. **`unsubscribe-insights-email/index.ts`** -- Import `PLATFORM_NAME`, replace unsubscribe confirmation text
6. **`send-test-email/index.ts`** -- Import `PLATFORM_URL`, replace hardcoded URLs
7. **`send-push-notification/index.ts`** -- Import `PLATFORM_URL`, derive mailto address
8. **`_shared/email-sender.ts`** -- Replace fallback sender name and org name with `PLATFORM_NAME`; derive domain from `PLATFORM_URL`
9. **`_shared/brand.ts`** (edge functions) -- Add `EXECUTIVE_BRIEF_NAME`, `MARKETING_OS_NAME`, `PLATFORM_DESCRIPTOR` for parity

---

## Phase 2 -- Platform Integrity Audit

### 1. Structural Violations

**Commission Gate:** `gate_commission_model` correctly wraps `Payroll.tsx` via `EnforcementGateBanner`. Payouts cannot proceed without commission architecture defined. **No violation.**

**KPI Gate:** `gate_kpi_architecture` correctly wraps lever brief and weekly lever section. KPI surfaces are blocked without structured definitions. **No violation.**

**Baselines Gate:** `gate_baselines` correctly wraps forecasting in `SalesTabContent.tsx`. AI forecasting is blocked without baselines. **No violation.**

**Margin Gate:** `gate_margin_baselines` is defined in `useEnforcementGate.ts` but **not currently wired** to any UI surface. This is acceptable since expansion analytics surfaces do not exist yet.

**Pricing Gate:** No enforcement gate exists for standardized pricing logic. Pricing publish appears unblocked. **Low-severity gap** -- pricing standardization is not yet a built feature, so no structural violation exists in practice.

### 2. Confidence Violations

**Lever Engine:** The `WeeklyLeverBrief` component displays confidence level (`high`, `medium`, `low`) with visual differentiation. The `SilenceState` component renders when no high-confidence lever is detected ("No high-confidence lever detected this period"). **No violation** -- low-confidence levers are not surfaced as primary recommendations.

**Multi-lever overload:** The lever engine returns `is_primary` flag to distinguish primary from secondary levers. UI renders one primary lever. **No violation.**

**Cascade alerts:** No cascade alert pattern detected. Alerts are scoped per domain. **No violation.**

### 3. Alert Noise

**No real-time alerts exist that should be weekly brief content.** The system uses:
- Weekly lever brief (correct cadence)
- Enforcement gate banners (structural, always-on -- correct)
- Toast notifications for user actions (transactional -- correct)

**No violation.**

### 4. Phase Map Drift

**Simulation Engine:** `SIMULATION_ENGINE_NAME` token is defined but no simulation UI or logic exists. **No drift.**

**Automation:** Client automation rules (`client_automation_rules` table, `useClientAutomations.ts`) exist for client outreach. This is **Phase 1 scope** (structured visibility + enforcement), not Phase 4 guardrailed automation -- these are owner-configured rules, not autonomous behavior. **No violation.**

**Autonomous behavior:** No autonomous actions detected. All recommendations follow Recommend flow only. **No drift.**

### 5. Persona Complexity Drift

**Enterprise surfaces exposed to solo operators:** The platform uses role-based permission gating (`VisibilityGate`, `usePermission`). Multi-location dashboards are gated behind `manage_locations` permission. **No violation detected** at the code level, though runtime verification would require testing with an actual solo operator account.

**Metric overload for early-stage users:** KPI templates are defined but require explicit setup via the KPI Builder (gated by `gate_kpi_architecture`). No metrics auto-activate. **No violation.**

### 6. UI Discipline Violations

**Token drift:** The design token system (`design-tokens.ts`) and enforcement rules (`design-rules.ts`) are comprehensive. Card header rules are documented in `CARD_HEADER_DESIGN_RULES.md`. No systematic spacing or alignment violations detected at the code level.

**Non-canonical component use:** All analytics cards follow the documented header pattern. **No violation detected** without visual inspection (200% zoom audit requires runtime testing).

---

## Phase 3 -- Correction Plan

### Brand Tokenization Corrections

| Action | Files | Count |
|--------|-------|-------|
| Replace hardcoded "Zura" in user-facing strings | 7 files (2 frontend, 5 edge functions) | 12 replacements |
| Replace hardcoded "getzura.com" URLs | 3 edge function files | 4 replacements |
| Add missing tokens to edge function `brand.ts` | 1 file | 3 token additions |
| **Total** | **9 files** | **19 changes** |

### Structural Violations Detected

| Finding | Severity | Risk |
|---------|----------|------|
| No pricing enforcement gate | Low | No pricing standardization feature exists yet; gate can be added when pricing logic ships |
| `gate_margin_baselines` unwired | Info | Expansion analytics not yet built; gate is ready when needed |

### No Corrections Needed

- Confidence qualification: Properly implemented
- Alert noise: Clean separation between real-time and weekly cadence
- Phase map: No drift detected
- Persona complexity: Properly gated by permissions
- UI discipline: Token system enforced

### Residual Risk Areas

1. **Edge function brand.ts sync** -- Manual sync required between `src/lib/brand.ts` and `supabase/functions/_shared/brand.ts`. Risk: future token additions may miss the edge function mirror. Mitigation: comment in both files documents the relationship.
2. **Component/file renames deferred** -- Files named `ZuraAvatar`, `useZuraConfig`, etc. still exist. These are code identifiers only and do not affect users, but they create cognitive friction during development if rebranding occurs.

### System Integrity Score

**8 / 10**

Deductions:
- -1: 14 hardcoded brand strings remain in user-facing surfaces
- -1: Edge function `brand.ts` missing 3 tokens for full parity

The platform's structural enforcement (gates, confidence qualification, phase boundaries) is solid. The remaining work is string-level tokenization cleanup -- no architectural or behavioral changes needed.

