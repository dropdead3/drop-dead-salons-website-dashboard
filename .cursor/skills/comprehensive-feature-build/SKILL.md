---
name: comprehensive-feature-build
description: Plans and implements full-stack features end-to-end: data, API, hooks, UI, routes, navigation, permissions, and agent coordination. Use when the user wants to build a comprehensive new feature, add a major feature, or ship a full-stack capability with proper interface and navigation.
---

# Comprehensive Feature Build

Use this skill when building a **new feature** that spans data, backend, UI, navigation, and permissions. Follow the **comprehensive-feature-agent** rule (`.cursor/rules/comprehensive-feature-agent.mdc`) and the workflow below. This agent owns the full scope and coordinates with other agents via the manifest.

## When to Use

- User asks to "build a new feature", "add [X] feature", or "ship [capability]"
- Feature requires multiple layers: data, API or edge function, dashboard UI, nav entry, and possibly drill-downs
- You need to account for interface, navigation, and what other agents are working on

## Workflow

### 1. Discovery and scope

- **Clarify:** What is the feature? Who uses it (role/permission)? Single page or multiple (list + detail)?
- **In scope:** Data model (if new), RLS, edge function (if needed), hooks, components, page(s), route(s), nav entry, permissions, any Analytics Hub drill-down or back-to-source.
- **Out of scope:** Do not expand into unrelated areas; do not change business logic of existing features unless required for this feature.

### 2. Coordination check

- Read `.cursor/agent-manifest.json`. If the manifest does not exist, create it with `{ "active": [], "completed": [] }`.
- If any file you need is listed under another task in `active`, STOP and tell the user: another agent is working on it; coordinate or wait.

### 3. Plan (layers)

Produce a short plan. For each layer that applies, note concrete artifacts:

| Layer | Artifacts |
|-------|-----------|
| Data | New migration file(s), table(s) with `organization_id`, RLS policies |
| Edge | `supabase/functions/{name}/index.ts`, auth/org checks |
| Hooks | New file(s) in `src/hooks/`, query key namespace `['feature-name', ...]` |
| Components | New dir `src/components/dashboard/{feature}/`, reference Common Solutions Registry |
| Page(s) | `src/pages/dashboard/` or `admin/`, DashboardLayout, loading/empty/error |
| Route + Nav | `App.tsx` route(s); `src/config/dashboardNav.ts` entry (correct section, permission/roles) |
| Drill-down | If summary → detail: `analyticsHubUrl(tab, subtab)` or link to new page; back-to-source if depth > 1 |
| Permissions | VisibilityGate or usePermission(); which permission or roles |

### 4. Claim files

- Add one entry to `active` in `.cursor/agent-manifest.json` with:
  - `task`: Short feature name
  - `files`: Array of all files you will create or modify (routes, nav, pages, components, hooks, migrations, edge functions)
  - `started`: ISO timestamp
- Merge into existing JSON; do not remove or overwrite other agents' entries.

### 5. Build order

Execute in this order to avoid broken references:

1. **Migrations** (new tables, RLS) → run or document run step
2. **Edge function** (if any) → auth and org checks inside
3. **Hooks** → org-scoped, namespaced query keys, `enabled: !!orgId`
4. **Components** → feature folder, use registry patterns (forms, tables, dialogs)
5. **Page(s)** → DashboardLayout, hook for data, loading/empty/error
6. **Route(s)** in `App.tsx`
7. **Nav** in `src/config/dashboardNav.ts` (correct section, permission/roles)
8. **Drill-downs** → `analyticsHubUrl(tab, subtab)` or Link to new page; back link if needed
9. **Permission wrapping** → VisibilityGate or usePermission()

Use **Common Solutions Registry** (agent-coordination.mdc) for forms, tables, CRUD hooks, dialogs, and dashboard pages. Prefer POS adapter and canonical types for scheduling/POS/clients (standalone-detach-phorest).

### 6. Validate

- Data: All queries filter by organization; RLS in place for new tables
- Nav: New entry appears in sidebar/search from registry; no duplicate or legacy-only paths
- Permissions: Correct roles/permissions; no hardcoded role names where a permission exists
- Brand: Copy minimal, no hype/emojis (brand-voice.mdc)

### 7. Complete

- Remove your task from `active` in `.cursor/agent-manifest.json`.
- Add it to `completed` with `task`, `files`, `finished` (ISO timestamp), and `summary` (1–2 sentences of what was built).

## References

- **Full-scope checklist and shared-file caution:** `.cursor/rules/comprehensive-feature-agent.mdc`
- **Manifest format and isolation:** `.cursor/rules/agent-coordination.mdc`
- **Nav registry and drill-downs:** `.cursor/rules/navigation-agent.mdc`
- **Analytics Hub URLs:** `analyticsHubUrl(tab, subtab)` from `@/config/dashboardNav`

## Task checklist (copy and track)

```
Comprehensive feature: [NAME]
- [ ] Discovery and scope defined
- [ ] Manifest checked; no conflict with active tasks
- [ ] Plan written (data / edge / hooks / components / page / route / nav / drill-down / permissions)
- [ ] Files claimed in agent-manifest.json active
- [ ] Migrations (if any) created and runnable
- [ ] Edge function (if any) with auth/org checks
- [ ] Hooks with org scope and namespaced query keys
- [ ] Components in src/components/dashboard/{feature}/
- [ ] Page(s) with DashboardLayout and loading/empty/error
- [ ] Route(s) in App.tsx
- [ ] Nav entry in src/config/dashboardNav.ts
- [ ] Drill-downs use analyticsHubUrl or canonical links; back-to-source if depth > 1
- [ ] Permissions applied (VisibilityGate / usePermission)
- [ ] Validation passed
- [ ] Entry moved to manifest completed with summary
```
