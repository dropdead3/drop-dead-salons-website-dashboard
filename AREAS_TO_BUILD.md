# Areas to Build and Enhance

A consolidated list of build and enhancement opportunities for the Zura project, drawn from plans and rules. Use this as a backlog or prioritization guide.

---

## 1. Reports and analytics (by org type)

**Source:** Enhanced reports plan (`.cursor/plans/enhanced_reports_analytics_by_org_type_*.plan.md`)

### Phase 1 – Close obvious gaps

- **Financial report generators** – Revenue Trend, Commission, Goal Progress, and Year-over-Year are defined as report cards but have no generator (click does nothing). Wire them in `ReportsTabContent` to generators that use existing hooks: `useSalesTrend`, `useSalesGoals`, payroll/commission hooks, `useComparisonData` for YoY. Add PDF/CSV export where missing.
- **Executive summary report** – One-page report for multi-location/enterprise: org totals, revenue by location (table or top N), key KPIs (appointments, retention, no-show), top/bottom locations. Use `useSalesByLocation`, `useOperationalAnalytics`, etc.; scope by `effectiveOrganization` and date/location filter.
- **Variance report** – By location (and later region): actual vs goal or actual vs prior period for revenue, appointments, retention. Reuse goals and comparison hooks; add report UI for “goal” or “prior period” comparison.

### Phase 2 – Analytical depth

- **Service mix / yield report** – Revenue and count by service category; optional yield per hour or per slot; single- and multi-location. Elevate `service_category` in custom builder.
- **Region (optional)** – Add region as a grouping (e.g. `locations.region_id` or `organization_regions` table); use in reports and analytics as dimension and rollup. Gate for single-location orgs.
- **Location health / performance index** – Composite metric per location (e.g. revenue trend + retention + utilization); surface in Executive summary or dashboard card.

### Phase 3 – Enterprise

- **Standardized report templates** – Admin defines a template (metrics, dimensions, filters); run per location or per region with optional scheduling. Build on scheduled reports and report builder config.
- **Variance from benchmark** – Report or card: by location/region, variance from org average or goal. Support “standardization” narrative.
- **Role-based report visibility** – Simplified report set for single-location vs full set for multi-location; or prominent “Executive summary” when `locations.length > 1`. Align with VisibilityGate and permissions.

### Cross-cutting

- **Custom report builder** – Add metrics/dimensions for variance, optional region; decouple labels from “Phorest” for standalone readiness.
- **Scheduled reports** – Verify new report types work with ScheduledReportsSubTab; support “per location” or “per region” runs for enterprise.
- **Data quality and trust** – “Data as of” / “Incomplete period” labels; last-sync on report headers; sensible empty states for new locations.
- **Drill-down** – From Executive summary or variance report, deep-link or “Open in Analytics (filtered to X)” for location/region.

---

## 2. Standalone system / Phorest detach

**Source:** `.cursor/rules/standalone-detach-phorest.mdc`

- **Route new features through POS adapter** – For appointments, clients, sales, staff: use `usePOSAdapter()` and `usePOSData`; prefer `POSAppointment`, `POSClient`, `POSSalesSummary`, `POSStaffMember` in new code instead of `phorest_*` row types.
- **Zura-owned data models** – Introduce canonical tables (e.g. `appointments`, `clients`, `services`, `transactions`) with RLS and org scoping; add migrations only (no editing existing ones). Phorest sync can populate these; native Zura flows write to them.
- **Native adapter** – Implement a “native” or “zura” POS adapter that reads/writes Zura-owned tables so the same UI works when Phorest is detached.
- **Migrate when touching** – When changing code that uses `phorest_*` or Phorest-specific hooks, refactor toward adapter or Zura-owned data where practical (e.g. switch a hook to `adapter.getAppointments()`).
- **Edge functions** – New logic should use canonical inputs/outputs; avoid hardcoding Phorest API in every function; prefer generic “sync from external POS” contract.

---

## 3. Analytics UI and design system

**Source:** `.cursor/rules/analytics-luxury-ui.mdc`, `.cursor/rules/design-system.mdc`

- **Fix prohibited font weights** – Replace `font-semibold` / `font-bold` with `font-medium` (max 500) in analytics and dashboard components. Known files: `BenchmarkBar.tsx` (line 59), platform pages (Revenue.tsx, HealthScores.tsx, AccountDetail.tsx, PandaDocStatusCard.tsx, etc.). Use design-rules and analytics-luxury-ui rule when touching.
- **New analytics concepts** – Visit rhythm, service mix/yield, client segments in one view, capacity/demand (“white space”), retail effectiveness by stylist/service, professional-level “my performance” views. Implement as cards or reports following the luxury UI rule.
- **Luxury UI on new work** – All new analytics/report UI: `font-display` for titles, design tokens for charts, one idea per card, empty/loading states without emojis, HideNumbersContext for sensitive KPIs.

---

## 4. Platform and integrations

**Source:** Codebase grep and context

- **Slack integration** – Notifications page has “Slack integration coming soon” (disabled). Implement or remove the placeholder.
- **Coming-soon integrations** – `PlatformIntegrationDetail.tsx` redirects for “coming soon” integrations; add real integration detail pages or clarify roadmap.
- **Placeholder services** – `SystemHealth.tsx` shows placeholder services when none in DB; ensure real service health checks are wired where applicable.

---

## 5. Other improvements

- **Suggested reports / onboarding** – “Reports that matter for your size” or “Start here” by role or location count so single-location and new users know where to start.
- **Time dimensions** – Optional alignment of reports to fiscal period or pay period (e.g. Commission, Goal Progress); document or add config for org fiscal year.
- **Alerts and thresholds** – If alerting is added (e.g. no-show above 5%), share metric and threshold definitions with reports so configuration stays consistent.
- **Audit and compliance** – For enterprise: who ran which report when; optional retention or export of scheduled report outputs.
- **Benchmark comparability** – When showing benchmarks or industry comparison, segment by org size or location count for like-for-like comparison.
- **Mobile and export** – Executive summary and key reports responsive and exportable (PDF/CSV) for sharing.

---

## Quick reference

| Theme              | Priority areas |
|--------------------|----------------|
| Reports            | Financial generators, Executive summary, Variance report |
| Standalone         | Adapter-first new code, Zura-owned tables, native adapter |
| Analytics UI       | Fix font weights, new concepts (visit rhythm, service mix, client segments) |
| Platform           | Slack/coming-soon integrations, health checks |
| Polish             | Suggested reports, time dimensions, alerts, audit, mobile/export |

When starting work in any of these areas, follow the relevant rules: `standalone-detach-phorest.mdc`, `analytics-luxury-ui.mdc`, `design-system.mdc`, `multi-tenancy-rbac.mdc`, and `database-migrations.mdc`.
