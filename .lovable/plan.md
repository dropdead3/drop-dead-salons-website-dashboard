
# Onboarding Configurator Implementation Plan

## Overview

Create an Onboarding Configurator that allows account owners to configure what appears in each role's onboarding experience and whether each item is required or optional.

## Current System Analysis

### Existing Components
| Component | Role Visibility | Required/Optional |
|-----------|----------------|-------------------|
| Onboarding Tasks | Per-task `visible_to_roles` array | Not supported |
| Handbooks (Onboarding category) | Per-handbook `visible_to_roles` array | Not supported |
| Business Card Request | Hardcoded for all roles | Not configurable |
| Headshot Request | Hardcoded for all roles | Not configurable |

### Gaps Identified
1. No way to mark tasks as "required" vs "optional" per role
2. Business cards and headshots cannot be configured per role
3. No unified interface for configuring the entire onboarding experience

---

## Database Changes

### Add `is_required` Column to `onboarding_tasks`
Add a simple boolean column to track if a task is required:

```sql
ALTER TABLE onboarding_tasks 
ADD COLUMN is_required boolean DEFAULT true NOT NULL;
```

### Create `onboarding_section_config` Table
Store per-role configuration for the non-task sections:

```sql
CREATE TABLE onboarding_section_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  section_key text NOT NULL,  -- 'business_card', 'headshot', 'handbooks'
  role text NOT NULL,
  is_enabled boolean DEFAULT true,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, section_key, role)
);

-- Enable RLS
ALTER TABLE onboarding_section_config ENABLE ROW LEVEL SECURITY;

-- Policies for org admins
CREATE POLICY "Org admins can manage onboarding config"
  ON onboarding_section_config
  FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));
```

---

## New Components

### 1. OnboardingConfigurator (Main Component)
**Location**: `src/components/dashboard/settings/OnboardingConfigurator.tsx`

**Features**:
- Role selector (similar to RoleAccessConfigurator pattern)
- Tabbed interface for different onboarding sections
- Visual configuration for each section

```text
+------------------------------------------+
| ONBOARDING CONFIGURATOR                  |
+------------------------------------------+
| [Role Pills: Stylist | Assistant | ...]  |
+------------------------------------------+
| Selected: Stylist                        |
+------------------------------------------+
| Tabs: [Tasks] [Handbooks] [Requests]     |
+------------------------------------------+
| Tasks Tab:                               |
| +--------------------------------------+ |
| | [x] Complete profile          [Req]  | |
| | [x] Review policies           [Opt]  | |
| | [ ] Schedule orientation      [Opt]  | |
| +--------------------------------------+ |
+------------------------------------------+
```

### 2. OnboardingTasksConfigPanel
**Purpose**: Configure which tasks each role sees and whether they're required

| Column | Description |
|--------|-------------|
| Checkbox | Enable/disable for this role |
| Task Title | Name of the onboarding task |
| Required Toggle | Mark as required or optional |

### 3. OnboardingSectionsConfigPanel  
**Purpose**: Configure business cards, headshots, and handbook sections per role

| Section | Options |
|---------|---------|
| Business Card Request | Enable/disable, Required/Optional |
| Headshot Session | Enable/disable, Required/Optional |
| Handbook Acknowledgments | Enable/disable, Required/Optional |

---

## Hooks

### `useOnboardingConfig`
Fetch and manage onboarding configuration:

```typescript
interface OnboardingSectionConfig {
  section_key: string;
  role: string;
  is_enabled: boolean;
  is_required: boolean;
}

export function useOnboardingConfig(organizationId: string | undefined);
export function useUpdateOnboardingConfig();
```

### Update `useOnboardingProgress`
Modify to respect required vs optional when calculating completion:
- Required items must be completed for 100%
- Optional items contribute bonus progress

---

## UI Integration

### Access Point
Add "Onboarding" as a new settings category in the Settings page, or enhance the existing "Onboarding" category to include the configurator.

**Settings.tsx changes**:
```typescript
// Update the 'onboarding' category to show the configurator
case 'onboarding':
  return <OnboardingConfigurator />;
```

### Onboarding Page Updates
Modify `Onboarding.tsx` to:
1. Read `is_required` from tasks
2. Visually distinguish required vs optional items
3. Show "Required" or "Optional" badges
4. Respect section-level enable/disable settings

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/settings/OnboardingConfigurator.tsx` | Main configurator component |
| `src/components/dashboard/settings/OnboardingTasksConfigPanel.tsx` | Tasks configuration panel |
| `src/components/dashboard/settings/OnboardingSectionsConfigPanel.tsx` | Sections (BC, HS, Handbooks) config |
| `src/hooks/useOnboardingConfig.ts` | Data fetching and mutation hooks |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/Settings.tsx` | Replace simple OnboardingTasksManager with OnboardingConfigurator |
| `src/pages/dashboard/Onboarding.tsx` | Display required/optional badges, hide disabled sections |
| `src/hooks/useOnboardingProgress.ts` | Account for required vs optional in progress calculation |
| `src/components/dashboard/OnboardingTasksManager.tsx` | Add `is_required` toggle to task creation/editing |

---

## User Experience Flow

### For Account Owners (Configuration)
1. Navigate to Settings → Onboarding
2. See the Onboarding Configurator with role pills at the top
3. Click a role (e.g., "Stylist")
4. View all onboarding items organized by section
5. Toggle items on/off and mark as required/optional
6. Changes save automatically

### For Team Members (Onboarding Experience)
1. Navigate to their Onboarding page
2. See only the items configured for their role(s)
3. Required items shown with a "Required" badge
4. Optional items shown with an "Optional" badge
5. Progress bar calculates based on required items (optional = bonus)

---

## Visual Design

### Required Badge
```tsx
<Badge variant="destructive" className="text-[10px]">Required</Badge>
```

### Optional Badge
```tsx
<Badge variant="outline" className="text-[10px]">Optional</Badge>
```

### Progress Calculation
- Required items: Must complete for "Onboarding Complete" status
- Optional items: Shown as bonus completion (e.g., "100% + 2 bonus items")

---

## Migration Path

1. Run database migration to add `is_required` column
2. Default all existing tasks to `is_required = true` (backward compatible)
3. Create `onboarding_section_config` table
4. Deploy new UI components
5. Existing functionality continues working; new configuration is opt-in
