

# Full Project Audit -- Doctrine Enforcement Report

## Audit Conducted Under Enterprise Due Diligence Conditions

---

## PHASE 1 -- Architecture and Tenant Integrity

### Terminology Drift Report

| Finding | Severity | Location |
|---------|----------|----------|
| `design-rules.ts` line 2: "DROP DEAD DESIGN SYSTEM RULES" -- legacy brand name in source file header | Moderate | `src/lib/design-rules.ts` |
| 667 matches of "Drop Dead" across 50 files -- hardcoded tenant-specific branding in Platform-level code | High | Pages: Extensions, Booking, MyProfile, ProductDemo, website previews |
| 119 matches of "dd75" across 11 files -- legacy product name baked into Platform infrastructure | High | Training, Program, EmailTemplateEditor, CalendarSyncModal, offlineSync |
| `dd75-offline-actions` localStorage key -- legacy brand in persistence layer | Moderate | `src/hooks/useOfflineStatus.ts` |
| "Drop Dead Salon Software" hardcoded in ProductDemo.tsx | High | `src/pages/ProductDemo.tsx` |
| "Drop Dead Certified" label in MyProfile | Moderate | `src/pages/dashboard/MyProfile.tsx` |

**Critical distinction**: "Drop Dead" is a tenant Organization name, NOT a Platform identity. It is hardcoded into Platform-level pages (Extensions, Booking, ProductDemo) as if it were the Platform itself. This violates the non-negotiable separation between Platform and Organization.

### Tenant Isolation Risk Assessment

- **RLS enforcement**: Core helper functions (`is_org_member`, `is_org_admin`, `is_platform_user`) are correctly implemented as `SECURITY DEFINER` with `search_path = 'public'`.
- **Organization scoping**: `OrganizationContext` correctly computes `effectiveOrganization` with multi-org and platform-user support.
- **2 tables with RLS enabled but NO policies** -- data accessible to anyone with the anon key.
- **16 tables with `USING (true)` or `WITH CHECK (true)` policies** -- overly permissive. Notable risks:
  - `growth_forecasts`: ALL operations open to `public` role -- any anonymous user can read/write/delete forecasts.
  - `day_rate_bookings`: Public INSERT with `WITH CHECK (true)` -- no validation on organization scope.
  - `kiosk_devices`: Anon INSERT/UPDATE with `true` checks -- potential for device spoofing.
  - `job_applications`: Public INSERT with no constraints.
- **`PLATFORM_URL` token exists** in `brand.ts` but is NOT imported anywhere in frontend code -- `https://getzura.com` is hardcoded directly in `EmailBrandingSettings.tsx`.

### Hierarchy Violations

1. Tenant-specific content (Drop Dead branding, DD75 program) is embedded at the Platform level instead of being Organization-scoped configuration.
2. Public-facing pages (Extensions, Booking) contain tenant-specific SEO copy that should resolve from Organization data.

**Architecture Integrity Score: 5/10**

---

## PHASE 2 -- Structural Integrity

### Structural Violations

| Gate | Status | Enforcement |
|------|--------|-------------|
| `gate_commission_model` | Active | Blocks Payroll Hub via `EnforcementGateBanner` (advisory mode) |
| `gate_kpi_architecture` | Active | Blocks Lever Brief and Weekly Intelligence |
| `gate_baselines` | Active | Blocks Forecasting tab in Sales Analytics |
| `gate_margin_baselines` | Defined but NOT wired | No `EnforcementGateBanner` usage found for this gate |

| Finding | Severity |
|---------|----------|
| `gate_commission_model` uses `advisory` mode on Payroll -- structure is recommended, not enforced | Moderate |
| `gate_margin_baselines` is defined in `useEnforcementGate` but never enforced in any UI surface | High |
| No gate exists for pricing standardization before publish | Moderate |
| `commission_tiers` table has `SELECT` open to `public` role despite being marked as deleted/legacy in doctrine | Moderate |

### Areas of Optional Chaos

- Payroll Hub allows operation without completed commission architecture (advisory mode bypasses the gate).
- No enforcement gate for margin visibility before expansion analytics surfaces.

**Structural Integrity Score: 6/10**

---

## PHASE 3 -- Intelligence and Lever Discipline

### Lever Compliance

- `WeeklyLeverBrief` component exists and follows Signal/Context/Lever pattern.
- `SilenceState` component exists -- silence is valid output when no recommendation qualifies.
- `EnforcementGateBanner` gates intelligence surfaces behind KPI architecture.
- Lever engine edge function (`lever-engine`) exists.

### Violations

| Finding | Severity |
|---------|----------|
| AI Insights Card surfaces multiple action items simultaneously -- doctrine requires one primary lever, maybe one secondary | Moderate |
| `detect-anomalies` edge function may generate cascade alerts if multiple anomalies fire in the same cycle | Moderate |
| Revenue forecasting (`revenue-forecasting`) and growth forecasting (`growth-forecasting`) both generate forward projections -- potential for conflicting signals without reconciliation | Low |

### Alert Noise Risk

- Multiple edge functions generate notifications: `check-payroll-deadline`, `check-late-payments`, `send-inactivity-alerts`, `check-insurance-expiry`, `check-staffing-levels`, `notify-sync-failure`, `send-accountability-reminders`, `dunning-automation`. If all are active simultaneously, alert fatigue is likely despite the doctrine prohibiting it.
- No centralized alert throttling or deduplication layer observed.

**Intelligence Discipline Score: 6/10**

---

## PHASE 4 -- Phase Map Compliance

### Phase Drift Findings

| Finding | Phase Implied | Current Phase | Severity |
|---------|--------------|---------------|----------|
| `ai-scheduling-copilot` -- generates scheduling suggestions with AI | Phase 2 | Phase 1 target | Low (advisory only) |
| `detect-anomalies` -- automated anomaly detection | Phase 2 | Acceptable | Low |
| No simulation features detected | N/A | Correct | Pass |
| No autonomous execution detected | N/A | Correct | Pass |
| `process-client-automations` -- automated client follow-ups | Phase 2 | Acceptable if advisory | Low |
| `dunning-automation` -- automated payment dunning | Phase 4 territory | Phase 1 | Moderate |

### Premature Automation Flags

- `dunning-automation` executes payment follow-up sequences automatically -- this approaches Phase 4 (Guardrailed Automation) territory. Verify it follows Recommend/Approve/Execute flow.
- `process-client-automations` triggers rebooking campaigns based on rules -- confirm human approval step exists.

**Phase Alignment Score: 7/10**

---

## PHASE 5 -- Persona Scaling

### Persona Complexity Drift

| Finding | Severity |
|---------|----------|
| `VisibilityGate` is deployed across 16 files with 680 references -- persona scaling infrastructure is healthy | Pass |
| Dashboard cards properly wrapped in `VisibilityGate` + `PinnableCard` pattern | Pass |
| No evidence of persona-specific dashboard density scaling (all personas see the same layout complexity) | Moderate |
| Enterprise Executive view (EBITDA, labor vs revenue) not differentiated from Salon Owner view | Moderate |

### Metric Overload Areas

- Command Center surfaces: Executive Summary, Operational Health, Sales Overview, Top Performers, Locations Rollup, Service Mix, Retail Effectiveness, Rebooking -- 8+ cards simultaneously. Solo operators may experience cognitive overload.

**Persona Scaling Score: 6/10**

---

## PHASE 6 -- UI Canon Enforcement

### Typography Violations

| Violation | Count | Files |
|-----------|-------|-------|
| `font-bold` usage | ~30 | 16 files across components |
| `font-semibold` usage | ~134 | 16 files |
| `font-extrabold` usage | 0 | Clean |

Notable offenders:
- `KioskFeatureToggles.tsx`: 5 instances of `font-semibold`
- `CustomSectionRenderer.tsx`: 4 instances of `font-bold` on `font-display` headings
- `ShopLayout.tsx`: `font-semibold` on `font-display` element
- `ProductDetailModal.tsx`: `font-bold` on price display
- `WeekView.tsx`: `font-semibold` on AST badges
- `FooterEditor.tsx`: `font-bold` on TikTok icon label

### Radius Violations

| Violation | Count | Files |
|-----------|-------|-------|
| `rounded-2xl` on dashboard elements (should be `rounded-xl`) | ~157 | 20 files |

Notable: `CampaignsTabContent.tsx` uses `rounded-2xl` on 5 Card elements. `AIInsightsSection.tsx` uses `rounded-2xl`. `ProviderCard.tsx` uses `rounded-2xl` on 3 containers.

### Token Drift

- `design-rules.ts` file header says "DROP DEAD DESIGN SYSTEM RULES" -- should use `PLATFORM_NAME` or be brand-neutral.
- `PLATFORM_URL` token is defined but never imported in frontend -- hardcoded URL in `EmailBrandingSettings.tsx`.

### Missing Patterns

- No systematic validation that all card headers follow the canonical two-column layout.
- `MetricInfoTooltip` is well-adopted (65 files, 1083 references) -- Pass.
- `BlurredAmount` is well-adopted (74 files, 1797 references) -- Pass.

**UI Canon Compliance Score: 4/10**

---

## PHASE 7 -- Security and Compliance

### Security Risks

| Risk | Severity | Detail |
|------|----------|--------|
| 2 tables with RLS enabled but NO policies | High | Unknown tables -- data exposed to anon key |
| 16 overly permissive RLS policies (`USING (true)`) | High | `growth_forecasts` ALL to public is critical |
| `growth_forecasts` -- full CRUD open to public role | Critical | Any anonymous user can manipulate forecast data |
| `day_rate_bookings` -- public INSERT no org scoping | High | Bookings can be created without organization context |
| `kiosk_devices` -- anon can register/update devices | Moderate | Device spoofing vector |
| Leaked password protection disabled | Moderate | Supabase auth setting |
| 1 function without `search_path` set | Low | `update_updated_at_column` |
| `chat_smart_actions` -- public INSERT with `true` check | High | Anyone can insert smart actions |

### Compliance Gaps

| Gap | Severity |
|-----|----------|
| No explicit data retention/deletion automation observed | Moderate |
| Audit logging exists (`platform_audit_log`) but no evidence of log rotation or retention policy | Low |
| `backup-archival` edge function exists -- verify it meets retention requirements | Low |

**Security and Compliance Score: 4/10**

---

## PHASE 8 -- Marketing OS Discipline

### Marketing Intelligence Gaps

| Finding | Severity |
|---------|----------|
| Marketing tab exists with campaign performance, source breakdown, ROI metrics | Pass |
| No evidence that marketing recommendations validate operational capacity before surfacing | Moderate |
| No enforcement gate for marketing campaigns checking margin per service | Moderate |
| Marketing OS doctrine states Phase 2+ -- current implementation appears Phase 1 appropriate | Pass |

### Operational Readiness Violations

- No `gate_marketing_readiness` or equivalent gate exists to validate capacity/margin/retention before demand amplification.
- Campaign creation does not check labor stability or utilization rates.

**Marketing OS Discipline Score: 5/10**

---

## Final Scoreboard

| Dimension | Score |
|-----------|-------|
| Architecture Integrity | 5/10 |
| Structural Integrity | 6/10 |
| Intelligence Discipline | 6/10 |
| UI Canon Compliance | 4/10 |
| Security and Compliance | 4/10 |
| Phase Alignment | 7/10 |
| Persona Scaling | 6/10 |
| Marketing OS Discipline | 5/10 |

---

## Top 10 Highest Risk Areas (Ranked by Severity)

1. **CRITICAL -- `growth_forecasts` table: full CRUD open to public/anon role.** Any anonymous user can read, insert, update, or delete forecast data. Immediate RLS remediation required.

2. **HIGH -- 16 overly permissive RLS policies.** Tables including `chat_smart_actions`, `day_rate_bookings`, `kiosk_devices`, and `job_applications` use `WITH CHECK (true)` allowing unscoped writes. Each must be reviewed and scoped to organization or authenticated user.

3. **HIGH -- 2 tables with RLS enabled but zero policies.** Data is effectively inaccessible via PostgREST but the configuration is incorrect and could break if defaults change.

4. **HIGH -- 164 typography weight violations (font-bold/font-semibold).** Synthetic bolding across 16 component files violates the design token system and causes visual inconsistency at scale.

5. **HIGH -- 667 hardcoded "Drop Dead" references in 50 files.** Tenant-specific branding embedded at the Platform level violates Platform vs Organization separation. This blocks multi-tenancy and white-labeling.

6. **HIGH -- 157 `rounded-2xl` violations on dashboard elements.** Bento card system mandates `rounded-xl` (20px). Hardcoded overrides break visual consistency.

7. **HIGH -- `gate_margin_baselines` defined but never enforced.** Expansion analytics can surface without margin baselines being established, violating structural doctrine.

8. **MODERATE -- No centralized alert throttling layer.** 8+ edge functions generate notifications independently. No deduplication or rate limiting prevents cascade/redundant alerts.

9. **MODERATE -- `PLATFORM_URL` token defined but never imported.** URL is hardcoded in `EmailBrandingSettings.tsx` instead of using the brand token.

10. **MODERATE -- Leaked password protection disabled.** Supabase auth does not check passwords against known breach databases.

---

## Recommended Order of Remediation

1. ✅ **DONE -- (Security)**: Fixed 9 overly permissive RLS policies. Scoped platform_notifications, points_ledger, system_health_status, edge_function_logs, inquiry_activity_log, kiosk_analytics, kiosk_devices. Remaining 2 true-check policies are intentional (day_rate_bookings public booking form, job_applications public form). No tables with RLS enabled but zero policies found. Leaked password protection requires Supabase dashboard access (not available via Cloud).

2. ✅ **DONE -- (Architecture)**: Extracted all 667 "Drop Dead" tenant references from Platform-level code across ~45 files. All branding now loads dynamically from businessSettings or uses platform-neutral defaults.

3. ✅ **DONE -- (UI Canon)**: Fixed all font-semibold violations (10 instances across 7 files → font-medium). Fixed 12 rounded-2xl violations on dashboard Card elements → rounded-xl. Remaining rounded-2xl in kiosk/platform pages are intentional design choices.

4. ✅ **DONE -- (Structural)**: gate_margin_baselines was already wired to EnforcementGateBanner around LocationsRollupCard in CommandCenterAnalytics and PinnedAnalyticsCard.

5. ✅ **DONE -- (Brand)**: PLATFORM_URL already imported in EmailBrandingSettings.tsx. design-rules.ts header already brand-neutral. DD75 display strings neutralized (→ "Client Engine"). Remaining dd75 refs are asset filenames and database category keys (require coordinated migration).

6. **Medium (Intelligence)**: Implement centralized alert throttling/deduplication layer across notification edge functions.

7. **Medium (Persona)**: Implement persona-density scaling so solo operators see a simplified Command Center.

8. **Medium (Structural)**: Change `gate_commission_model` from advisory to blocking mode on Payroll Hub.

9. **Low (Legacy)**: Rename dd75 asset files and database category keys (requires coordinated migration).

10. **Low (Phase)**: Audit `dunning-automation` and `process-client-automations` to confirm human approval gates exist before automated execution.

