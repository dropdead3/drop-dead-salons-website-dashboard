

## Make SilenceState KPI-Aware

### Problem
The "Operations within thresholds" message is misleading when no KPIs have been defined. The lever engine cannot generate recommendations without KPI definitions, so the silence is not because everything is healthy — it is because the system has nothing to monitor.

### Solution
Update `SilenceState` to check whether KPI definitions exist. If none are defined, show an explanatory state with a CTA to the KPI Builder instead of the false-positive green checkmark.

### Changes

**1. `src/components/executive-brief/SilenceState.tsx`**
- Import and call `useKpiDefinitions()` to check if any KPIs exist
- When KPIs count is 0: render a distinct "setup needed" state with:
  - A neutral icon (e.g., `Settings` or `Target`) instead of the green checkmark
  - Title: "No KPIs configured yet"
  - Description: "Before Zura can surface levers, define the metrics you want monitored — targets, thresholds, and review cadence."
  - CTA button: "Build KPI Architecture" linking to `/dashboard/admin/kpi-builder`
- When KPIs exist but no recommendation: keep the current green "Operations within thresholds" state
- The compact variant should also reflect this: show "No KPIs configured" with a setup icon instead of the green check

**2. No other files need changes**
The `SilenceState` is already used in `WeeklyLeverSection`, `AIInsightsDrawer`, and `AIInsightsCard` — all will automatically inherit the improved behavior.

### Visual (No KPIs — Full)
```text
|-------------------------------------------------------|
|                    [Target icon]                       |
|                                                       |
|            No KPIs configured yet                     |
|                                                       |
|   Before Zura can surface levers, define the          |
|   metrics you want monitored -- targets,              |
|   thresholds, and review cadence.                     |
|                                                       |
|          [ Build KPI Architecture ]                   |
|-------------------------------------------------------|
```

### Visual (No KPIs — Compact)
```text
|-------------------------------------------------------|
| [target] No KPIs configured    [Build KPIs ->]        |
|-------------------------------------------------------|
```

### Visual (KPIs exist, no lever — unchanged)
```text
|-------------------------------------------------------|
|            [green check]                               |
|     Operations within thresholds                       |
|-------------------------------------------------------|
```

### Technical Details
- `useKpiDefinitions()` from `src/hooks/useKpiDefinitions.ts` returns the list scoped to the org via `useOrganizationContext`
- Use `useNavigate()` for the CTA button to route to `/dashboard/admin/kpi-builder`
- Advisory-first copy: no shame language, framed as "before monitoring begins"
- The loading state of KPI definitions is handled gracefully (show nothing extra while loading)

### File to modify
- `src/components/executive-brief/SilenceState.tsx`

