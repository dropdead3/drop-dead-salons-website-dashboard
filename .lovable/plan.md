

# Centralized Access & Controls Hub

## Problem Analysis

The project currently has **7 different systems** controlling access, visibility, and features:

| # | System | Purpose | Tables | Current Location |
|---|--------|---------|--------|------------------|
| 1 | Role Permissions Matrix | What actions roles can perform (e.g., `manage_payroll`) | `permissions`, `role_permissions` | Settings > Access & Visibility > Role Access |
| 2 | Role Access Configurator | Navigation/tabs/widgets visibility per role | `dashboard_element_visibility` | Settings > Access & Visibility > Role Access |
| 3 | Visibility Console | Dashboard element visibility | `dashboard_element_visibility` | Settings > Access & Visibility > Visibility Console |
| 4 | Feature Flags (Platform) | Global feature rollouts (beta, experiments) | `feature_flags` | Platform Admin > Feature Flags |
| 5 | Org Feature Flag Overrides | Per-org flag overrides | `organization_feature_flags` | Platform Admin > Account Details |
| 6 | Organization Features | Business modules org uses | `feature_catalog`, `organization_features` | Features Center |
| 7 | Platform Role Permissions | Platform admin capabilities | `platform_permissions`, `platform_role_permissions` | Platform Admin > Permissions |

**Key Issues:**
- **Redundancy**: Systems #2 and #3 both use `dashboard_element_visibility` but have separate UIs
- **Confusion**: "Role Access" vs "Visibility Console" vs "Features Center" - which controls what?
- **Scattered**: User must navigate to 4+ different places to configure access
- **Overlap**: Feature Flags vs Organization Features serve similar purposes

---

## Recommended Approach: Unified Access Hub

Rather than maintaining 7 separate systems, consolidate into a **single Access & Controls Hub** with clearly separated tabs:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ACCESS & CONTROLS HUB                                                  │
│  One place to manage all visibility, permissions, and features          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┬──────────────┬────────────────┬───────────────┐           │
│  │ MODULES │ ROLE ACCESS  │ PERMISSIONS    │ PLATFORM      │           │
│  │         │              │                │ (owners only) │           │
│  └─────────┴──────────────┴────────────────┴───────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tab 1: Modules (Replaces Features Center)
**What**: Business capabilities the organization uses
**Who manages**: Super Admin
**Examples**: Training Hub, Loyalty Program, Payroll, Booth Renters

```text
┌────────────────────────────────────────────────────────────────┐
│ MODULES                                          12/18 enabled │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌─ TEAM DEVELOPMENT ─────────────────────────────── 3/5 ─┐    │
│ │ ✓ Training Hub          ✓ Onboarding    ✗ Graduation   │    │
│ │ ✓ Client Engine Program ✗ Team Challenges              │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
│ ┌─ CLIENT EXPERIENCE ────────────────────────────── 2/4 ─┐    │
│ │ ✓ Feedback Hub          ✓ Loyalty Program              │    │
│ │ ✗ Re-engagement         ✗ Gift Cards                   │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Tab 2: Role Access (Consolidates #2 + #3)
**What**: UI visibility per role (navigation, tabs, widgets, dashboard elements)
**Who manages**: Super Admin
**Consolidates**: Current "Role Access Configurator" + "Visibility Console"

```text
┌────────────────────────────────────────────────────────────────┐
│ ROLE ACCESS                                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ [Admin] [Manager] [Stylist] [Assistant] [Receptionist]        │
│                                                                │
│ ┌─ NAVIGATION ───────────────────────────────────────────┐    │
│ │ What this role sees in the sidebar                      │    │
│ │ ├ Command Center ✓   ├ Schedule ✓   ├ Analytics Hub ✗  │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
│ ┌─ PAGE TABS ────────────────────────────────────────────┐    │
│ │ Tabs within pages (e.g., Stats: Sales, Operations)     │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
│ ┌─ DASHBOARD ELEMENTS ───────────────────────────────────┐    │
│ │ Cards, widgets, and sections on Command Center         │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Tab 3: Permissions
**What**: Functional capabilities per role (can they edit, delete, manage)
**Who manages**: Super Admin
**Examples**: `manage_payroll`, `view_team_stats`, `edit_schedule`

```text
┌────────────────────────────────────────────────────────────────┐
│ PERMISSIONS                                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ [Super Admin 🔒] [Admin] [Manager] [Stylist] [...]            │
│                                                                │
│ ┌─ DASHBOARD ────────────────────────────────────────────┐    │
│ │ View Analytics      [x]                                 │    │
│ │ View Revenue        [x]                                 │    │
│ │ View Own Stats Only [ ]                                 │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
│ ┌─ MANAGEMENT ───────────────────────────────────────────┐    │
│ │ Manage Team         [x]                                 │    │
│ │ Manage Payroll      [ ]                                 │    │
│ │ Approve Time Off    [x]                                 │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Tab 4: Platform (Super Admin / Platform only)
**What**: Advanced controls, feature flags, experiments
**Who manages**: Super Admin + Platform Admins
**Contains**: Feature flags (rollouts, experiments, beta features)

---

## How the Systems Work Together

```text
                     USER REQUEST
                          │
                          ▼
         ┌────────────────────────────────┐
         │ 1. Is MODULE enabled for org?  │  ← feature_catalog + organization_features
         │    e.g., "Loyalty Program"     │
         └───────────────┬────────────────┘
                         │ Yes
                         ▼
         ┌────────────────────────────────┐
         │ 2. Does ROLE have PERMISSION?  │  ← permissions + role_permissions
         │    e.g., "manage_loyalty"      │
         └───────────────┬────────────────┘
                         │ Yes
                         ▼
         ┌────────────────────────────────┐
         │ 3. Is UI VISIBLE for this role?│  ← dashboard_element_visibility
         │    e.g., "rewards_tab"         │
         └───────────────┬────────────────┘
                         │ Yes
                         ▼
                   SHOW FEATURE
```

---

## Implementation Plan

### Phase 1: Create Unified Access Hub Page
Create `/dashboard/admin/access-hub` as the single entry point:

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/pages/dashboard/admin/AccessHub.tsx` | Main hub page with tabs |
| `src/components/access-hub/ModulesTab.tsx` | Reorganized Features Center |
| `src/components/access-hub/RoleAccessTab.tsx` | Merged Role Access + Visibility Console |
| `src/components/access-hub/PermissionsTab.tsx` | Role Permissions Matrix |
| `src/components/access-hub/PlatformTab.tsx` | Feature Flags (super admin only) |

### Phase 2: Consolidate Existing Components
Move and refactor existing components:

| From | To |
|------|-----|
| `RoleAccessConfigurator` | `RoleAccessTab` (enhanced) |
| `CommandCenterContent` (Visibility Console) | Merged into `RoleAccessTab` |
| `RolePermissionsManager` | `PermissionsTab` |
| `FeaturesCenter` | `ModulesTab` |

### Phase 3: Update Settings Page
- Remove individual settings cards: "Role Access", "Visibility Console"
- Add single "Access & Controls Hub" card that links to the unified page
- Keep the route in Settings as an alternative entry point

### Phase 4: Deprecate Redundant Systems
| System | Action |
|--------|--------|
| Feature Flags (global) | Move to Platform tab; becomes "Experiments & Rollouts" |
| Organization Feature Flag Overrides | Merge into Modules tab as "Advanced" section |

---

## Technical Details

### Database Changes: None Required
The existing tables are well-designed:
- `feature_catalog` + `organization_features` → Modules
- `dashboard_element_visibility` → Role Access (UI visibility)
- `permissions` + `role_permissions` → Permissions (capabilities)
- `feature_flags` + `organization_feature_flags` → Platform experiments

### Component Hierarchy

```text
AccessHub.tsx
├── ModulesTab.tsx
│   ├── FeatureCategorySection.tsx (reuse)
│   └── FeatureToggleCard.tsx (reuse)
├── RoleAccessTab.tsx
│   ├── RoleSelector.tsx (shared)
│   ├── NavigationPanel.tsx (from SidebarLayoutEditor)
│   ├── PageTabsPanel.tsx (from PageTabsAccessPanel)
│   ├── WidgetsPanel.tsx (from WidgetsAccessPanel)
│   └── DashboardElementsPanel.tsx (from CommandCenterContent)
├── PermissionsTab.tsx
│   └── (from RolePermissionsManager)
└── PlatformTab.tsx
    └── FeatureFlagsManager.tsx (simplified)
```

### Shared Role Selector
All tabs share the same role selector at the top:

```tsx
<RoleSelector 
  value={selectedRole} 
  onChange={setSelectedRole}
  showStats={true}
/>
```

---

## Benefits

| Before | After |
|--------|-------|
| 7 separate systems to learn | 1 unified hub with 4 clear tabs |
| 4+ different Settings pages | Single "Access & Controls Hub" |
| Confusion about what controls what | Clear hierarchy: Modules → Permissions → Visibility |
| Duplicate "Visibility Console" and "Role Access" | Single "Role Access" tab with all UI controls |
| Feature Flags separate from Org Features | Logical separation: Modules (business) vs Platform (experiments) |

---

## Routing & Access

| Route | Access |
|-------|--------|
| `/dashboard/admin/access-hub` | Super Admin |
| `/dashboard/admin/access-hub?tab=modules` | Super Admin |
| `/dashboard/admin/access-hub?tab=role-access` | Super Admin |
| `/dashboard/admin/access-hub?tab=permissions` | Super Admin |
| `/dashboard/admin/access-hub?tab=platform` | Super Admin + Platform Users |

---

## What Stays Separate

| System | Why |
|--------|-----|
| **Platform Admin Permissions** (`/dashboard/platform/permissions`) | Platform-level access, different audience |
| **Platform Feature Flags** (`/dashboard/platform/feature-flags`) | Global rollouts across all orgs, platform admin only |

These remain in Platform Admin as they affect all organizations, not just the current one.

