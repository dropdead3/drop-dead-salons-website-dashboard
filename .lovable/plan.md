

# Revised V1 Modules Build Plan

## Key Revisions from Original

1. **Gates use existing feature flag system** -- no new `organization_setup_gates` table. We reuse `organization_feature_flags` with a new `useEnforcementGate` hook that checks completion status rather than toggle state.
2. **KPI templates are TypeScript constants** -- not database seed data. Easier to iterate, no migration needed to add templates.
3. **Lever engine is on-demand** -- triggered when opening the Executive Brief, not scheduled. Reduces V1 complexity.
4. **Confidence uses qualitative labels** -- High/Medium/Low in summary view. Numeric scores only in expandable detail.
5. **Designed silence state** -- deliberate "Operations within thresholds" UI with a calm confirmation visual, not an empty state.
6. **Outcome tracking table ships now, UI deferred** -- `lever_outcomes` table created but the visualization waits until enough data exists.

---

## Step 1: Database Migrations (4 new tables)

### Table 1: `kpi_definitions`
Stores the org's architected KPI parameters.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | |
| location_id | text, nullable | null = org-wide |
| metric_key | text | e.g. `revenue_per_chair` |
| display_name | text | |
| description | text, nullable | |
| target_value | numeric | |
| warning_threshold | numeric | |
| critical_threshold | numeric | |
| unit | text | `%`, `$`, `count` |
| cadence | text | `daily`, `weekly`, `monthly` |
| is_active | boolean, default true | |
| created_at / updated_at | timestamptz | |

RLS: `is_org_admin()` for write, `is_org_member()` for read.

### Table 2: `kpi_readings`
Time-series KPI data points.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | |
| location_id | text, nullable | |
| kpi_definition_id | uuid FK | |
| value | numeric | |
| reading_date | date | |
| source | text | `manual`, `calculated`, `imported` |
| created_at | timestamptz | |

RLS: `is_org_member()` for read, `is_org_admin()` for write.

### Table 3: `lever_recommendations`
The engine's output -- ranked lever suggestions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | |
| lever_type | text | `pricing`, `utilization`, `commission_alignment`, `staffing`, `service_mix`, `retention` |
| title | text | |
| summary | text | |
| what_to_do | text | |
| why_now | jsonb | Array of 3 driver strings |
| estimated_monthly_impact | numeric | |
| confidence | text | `high`, `medium`, `low` |
| is_primary | boolean | |
| is_active | boolean, default true | |
| period_start | date | |
| period_end | date | |
| evidence | jsonb | Trends, correlations, heatmaps inline |
| status | text, default `pending` | `pending`, `approved`, `declined`, `modified`, `snoozed` |
| decided_by | uuid, nullable | |
| decided_at | timestamptz, nullable | |
| decision_notes | text, nullable | |
| modified_action | text, nullable | |
| created_at / expires_at | timestamptz | |

RLS: `is_org_admin()` for all operations.

Note: Evidence is stored inline as JSONB rather than a separate table. This keeps queries simple for V1 -- one row = one complete recommendation with all its supporting data. We can normalize later if evidence grows complex.

Decisions are also inline on this table (`status`, `decided_by`, `decided_at`, `decision_notes`). This avoids a separate `lever_decisions` table for V1 since each recommendation has exactly one decision.

### Table 4: `lever_outcomes`
Post-decision KPI delta tracking (table ships now, UI deferred).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| recommendation_id | uuid FK | |
| organization_id | uuid FK | |
| metric_key | text | |
| value_before | numeric | |
| value_after | numeric, nullable | |
| delta | numeric, nullable | |
| measured_at | timestamptz, nullable | |
| measurement_window | text | `7d`, `14d`, `30d` |
| created_at | timestamptz | |

RLS: `is_org_admin()` for all operations.

---

## Step 2: Enforcement Gates

### Approach
Reuse the existing `organization_feature_flags` table and `OrganizationFeatureGate` pattern, but inverted: gates block features until completed.

### New flag keys to create
- `gate_commission_model` -- blocks payroll, commission reports
- `gate_baselines` -- blocks AI forecasting, lever engine
- `gate_kpi_architecture` -- blocks KPI dashboards, drift alerts
- `gate_margin_baselines` -- blocks expansion analytics

### New code
- **Hook**: `useEnforcementGate(gateKey)` -- returns `{ isCompleted, isLoading }`. Checks if the org flag is enabled (enabled = gate completed).
- **Component**: `EnforcementGateBanner` -- advisory-first banner with copy like "Before you scale, we'll define your commission structure." Includes CTA button to the relevant setup page.
- **Integration**: Wrap blocked pages/sections with the banner component.

---

## Step 3: KPI Architecture Builder

### KPI Templates (TypeScript constant)

```text
KPI_TEMPLATES = [
  { key: "revenue_per_chair", name: "Revenue per Chair", unit: "$", cadence: "weekly", suggestedTarget: null, suggestedWarning: null, suggestedCritical: null },
  { key: "utilization_rate", name: "Utilization Rate", unit: "%", cadence: "daily", ... },
  { key: "client_retention", name: "Client Retention Rate", unit: "%", cadence: "monthly", ... },
  { key: "labor_cost_pct", name: "Labor Cost %", unit: "%", cadence: "weekly", ... },
  { key: "avg_ticket", name: "Average Ticket", unit: "$", cadence: "daily", ... },
  { key: "margin_rate", name: "Margin Rate", unit: "%", cadence: "weekly", ... },
]
```

### UI: `/dashboard/admin/kpi-builder`
- Card grid of available KPI templates
- Click to adopt -- opens a form to set target, warning threshold, critical threshold
- Already-adopted KPIs show as active cards with edit/deactivate options
- When at least one KPI is defined, auto-complete the `gate_kpi_architecture` enforcement gate
- Follows standard layout: `p-6 lg:p-8`, `max-w-[1600px]`

### New code
- `KPI_TEMPLATES` constant file
- `useKpiDefinitions` hook (CRUD operations)
- `KpiBuilderPage` component
- Sidebar nav entry under Admin

---

## Step 4: Lever Engine (Edge Function)

### Edge function: `lever-engine`

**Trigger**: On-demand when user opens Executive Brief page (with 1-hour cache -- won't re-run if a fresh recommendation exists).

**Flow**:
1. Fetch org's KPI definitions + recent readings
2. Fetch baselines (commission tiers, utilization targets, margin floor from org settings)
3. Calculate deviation scores for each lever candidate category
4. Build ranking: `score = (impact_weight x deviation_magnitude) + (urgency_weight x trend_velocity) + (confidence_weight x data_completeness)`
5. Send top candidates to Gemini for natural-language summary generation
6. Store primary (and optional secondary) recommendation in `lever_recommendations`
7. Return the recommendation to the client

**Lever candidate categories**:
- Pricing adjustments
- Utilization efficiency
- Commission structure alignment
- Staffing/scheduling density
- Service mix optimization
- Retention recovery

**Silence logic**: If no candidate scores above the minimum confidence threshold, return a "within thresholds" result instead of forcing a recommendation.

---

## Step 5: Weekly Executive Brief UI

### Page: `/dashboard/admin/executive-brief`

**Default view (executive summary card)**:
- Lever name (bold, prominent)
- "What to do" -- one clear sentence
- "Why now" -- 3 bullet drivers
- Estimated monthly impact (dollar figure)
- Confidence badge (High/Medium/Low with color coding)
- Action buttons: Approve / Modify / Decline

**Expandable detail panel** (accordion or slide-out):
- 8-week historical trend chart (Recharts)
- Correlation/causal explanation
- Breakdown or heatmap visualization
- Simulation projection
- Risk assessment if unchanged
- Data sources used
- Numeric confidence score

**Silence state** ("Operations within thresholds"):
- Calm confirmation visual -- subtle green pulse or checkmark
- Copy: "Operations are within defined thresholds. No high-confidence lever detected this period."
- Last reviewed timestamp
- No empty state, no "nothing to show" -- silence is deliberate and designed

**Dashboard home card variant**:
- Compact version of the brief for the main dashboard
- Shows lever name + impact + confidence
- Click through to full executive brief page

---

## Step 6: Decision Flow + History

### Decision actions on Executive Brief
- **Approve**: Mark recommendation as approved, log actor + timestamp
- **Modify**: Opens text field for modified action, then marks as modified
- **Decline**: Opens text field for reason, marks as declined
- **Snooze**: Defers for 7 days

All updates go to the `lever_recommendations` table inline fields.

### Page: `/dashboard/admin/decision-history`
- Timeline view of past recommendations
- Each entry shows: lever type, title, decision, actor, date
- Expandable to see full recommendation + reasoning
- Outcome tracking UI deferred (table exists, visualization comes later when data accumulates)

---

## Step 7: Wiring

- Add sidebar nav entries: KPI Builder, Executive Brief, Decision History (under Admin section)
- Add enforcement gate banners to: Payroll page, Analytics/Forecasting sections, KPI dashboards
- Add compact Executive Brief card to dashboard home (behind VisibilityGate)
- Route definitions in router config

---

## New Routes
| Route | Purpose |
|-------|---------|
| `/dashboard/admin/kpi-builder` | KPI Architecture Builder |
| `/dashboard/admin/executive-brief` | Weekly Executive Brief |
| `/dashboard/admin/decision-history` | Decision History + Audit Log |

## Files to Create
- `src/constants/kpiTemplates.ts`
- `src/hooks/useEnforcementGate.ts`
- `src/hooks/useKpiDefinitions.ts`
- `src/hooks/useLeverRecommendations.ts`
- `src/components/enforcement/EnforcementGateBanner.tsx`
- `src/pages/dashboard/admin/KpiBuilderPage.tsx`
- `src/pages/dashboard/admin/ExecutiveBriefPage.tsx`
- `src/pages/dashboard/admin/DecisionHistoryPage.tsx`
- `src/components/executive-brief/WeeklyLeverBrief.tsx`
- `src/components/executive-brief/LeverDetailPanel.tsx`
- `src/components/executive-brief/SilenceState.tsx`
- `src/components/executive-brief/DecisionActions.tsx`
- `src/components/executive-brief/BriefDashboardCard.tsx`
- `supabase/functions/lever-engine/index.ts`

## Files to Modify
- Router config (add 3 new routes)
- Sidebar navigation (add 3 new entries)
- Dashboard home (add compact brief card)
- Blocked pages (add enforcement gate banners)

