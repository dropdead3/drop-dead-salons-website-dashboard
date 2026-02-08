
# Features Center — Organization Feature Management

## Overview
Build a comprehensive **Features Center** where account owners can view and toggle all available platform features for their organization. When a feature is disabled, all related data and configuration states are preserved, allowing seamless restoration when re-enabled.

## Current State Analysis

### Existing Infrastructure
The project already has robust building blocks:

| Component | Purpose | Location |
|-----------|---------|----------|
| `feature_flags` table | Global platform feature flags | Database |
| `organization_feature_flags` table | Per-org overrides | Database |
| `useOrganizationFeatureFlags` hook | Merges global + org flags | `src/hooks/useOrganizationFeatureFlags.ts` |
| `useFeatureFlag` hook | Check if flag is enabled for user | `src/hooks/useFeatureFlags.ts` |
| `FeatureFlag` component | Conditional rendering wrapper | `src/components/visibility/FeatureFlag.tsx` |
| `site_settings` table | Org-level configuration storage | Database |
| `organizations.settings` JSONB | Org-specific settings storage | Database |

### Current Feature Landscape
Based on the codebase analysis, the platform offers these major feature modules:

| Category | Features |
|----------|----------|
| **Team Development** | Training Hub, Onboarding, Graduation Tracker, Client Engine Program, Team Challenges |
| **Operations** | Schedule Management, Shift Swaps, Assistant Requests, Day Rate Rentals |
| **Analytics** | Sales Analytics, Operations Analytics, Marketing Analytics, Program Analytics, Rent Revenue |
| **Client Experience** | Feedback Hub, Re-engagement, Loyalty Program, Gift Cards |
| **Communications** | Email Templates, SMS Templates, Service Communication Flows, Announcements |
| **Recruiting** | Lead Management, Recruiting Pipeline |
| **Payroll** | Payroll Hub, Commission Tiers, Pay Schedules |
| **Booth Renters** | Renter Hub, Rental Contracts, Chair Management |
| **Website** | Website Editor (Stylists, Testimonials, Gallery, Services, Locations) |

---

## Solution Architecture

### 1. Database Schema Updates

Create a new table to define organization-level feature definitions with state persistence:

```sql
-- Organization feature configuration with state preservation
CREATE TABLE organization_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    last_known_config JSONB DEFAULT '{}', -- Stores configuration state when disabled
    disabled_at TIMESTAMPTZ,
    enabled_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, feature_key)
);

-- Feature definitions (platform-managed catalog)
CREATE TABLE feature_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    icon_name TEXT, -- Lucide icon name for UI
    is_core BOOLEAN DEFAULT false, -- Core features can't be disabled
    requires_features TEXT[], -- Dependencies on other features
    default_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed feature catalog
INSERT INTO feature_catalog (feature_key, feature_name, description, category, icon_name, is_core, display_order) VALUES
-- Core (cannot be disabled)
('command_center', 'Command Center', 'Central dashboard with quick actions and overview', 'core', 'LayoutDashboard', true, 1),
('schedule', 'Schedule', 'Appointment calendar and booking management', 'core', 'CalendarDays', true, 2),
('team_directory', 'Team Directory', 'Staff profiles and contact information', 'core', 'Users', true, 3),

-- Team Development
('training', 'Training Hub', 'Video library and course management', 'team_development', 'Video', false, 10),
('onboarding', 'Onboarding', 'New hire task checklists and progress tracking', 'team_development', 'ClipboardList', false, 11),
('graduation_tracker', 'Graduation Tracker', 'Assistant advancement and milestone tracking', 'team_development', 'GraduationCap', false, 12),
('client_engine_program', 'Client Engine Program', 'New-client building program with weekly goals', 'team_development', 'Target', false, 13),
('team_challenges', 'Team Challenges', 'Gamified competitions and leaderboards', 'team_development', 'Trophy', false, 14),

-- Operations
('shift_swaps', 'Shift Swaps', 'Staff shift exchange marketplace', 'operations', 'ArrowLeftRight', false, 20),
('assistant_requests', 'Assistant Requests', 'Stylist-to-assistant help requests', 'operations', 'HandHelping', false, 21),
('day_rate', 'Day Rate Rentals', 'Chair rental bookings and pricing', 'operations', 'Armchair', false, 22),
('strikes', 'Staff Strikes', 'Disciplinary tracking and warnings', 'operations', 'AlertTriangle', false, 23),

-- Analytics
('sales_analytics', 'Sales Analytics', 'Revenue tracking and sales reports', 'analytics', 'DollarSign', false, 30),
('operations_analytics', 'Operations Analytics', 'Staffing and productivity metrics', 'analytics', 'BarChart3', false, 31),
('marketing_analytics', 'Marketing Analytics', 'Campaign performance and ROI tracking', 'analytics', 'TrendingUp', false, 32),
('program_analytics', 'Program Analytics', 'Client Engine and training metrics', 'analytics', 'Target', false, 33),

-- Client Experience
('feedback_hub', 'Feedback Hub', 'Client surveys, NPS, and review routing', 'client_experience', 'MessageSquare', false, 40),
('reengagement', 'Re-engagement', 'Win-back campaigns for inactive clients', 'client_experience', 'UserCheck', false, 41),
('loyalty_program', 'Loyalty & Rewards', 'Points, tiers, and reward redemption', 'client_experience', 'Gift', false, 42),
('gift_cards', 'Gift Cards', 'Digital gift card issuance and tracking', 'client_experience', 'CreditCard', false, 43),

-- Communications
('email_templates', 'Email Templates', 'Customizable email communications', 'communications', 'Mail', false, 50),
('sms_templates', 'SMS Templates', 'Text message templates and automation', 'communications', 'MessageSquare', false, 51),
('announcements', 'Announcements', 'Team-wide communications and notifications', 'communications', 'Bell', false, 52),

-- Recruiting
('lead_management', 'Lead Management', 'Potential hire tracking and follow-up', 'recruiting', 'UserPlus', false, 60),
('recruiting_pipeline', 'Recruiting Pipeline', 'Interview stages and hiring funnel', 'recruiting', 'Briefcase', false, 61),

-- Financial
('payroll', 'Payroll Hub', 'Commission calculations and pay runs', 'financial', 'DollarSign', false, 70),
('booth_renters', 'Booth Renters', 'Renter management and rent collection', 'financial', 'Store', false, 71),

-- Website
('website_editor', 'Website Editor', 'Public website content management', 'website', 'Globe', false, 80);

-- Enable RLS
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view their features"
ON organization_features FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Super admins can manage org features"
ON organization_features FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employee_profiles ep
        WHERE ep.user_id = auth.uid()
        AND ep.organization_id = organization_features.organization_id
        AND ep.is_super_admin = true
    )
    OR public.is_platform_user(auth.uid())
);

CREATE POLICY "Anyone can view feature catalog"
ON feature_catalog FOR SELECT
TO authenticated
USING (true);
```

### 2. State Preservation Logic

When a feature is disabled, capture its configuration state:

```typescript
// src/hooks/useOrganizationFeatures.ts

interface OrganizationFeature {
  feature_key: string;
  feature_name: string;
  description: string;
  category: string;
  icon_name: string;
  is_core: boolean;
  is_enabled: boolean;
  last_known_config: Record<string, unknown>;
  disabled_at: string | null;
}

// When disabling a feature, capture related config
async function captureFeatureState(orgId: string, featureKey: string) {
  // Map feature keys to their config sources
  const configSources: Record<string, () => Promise<unknown>> = {
    loyalty_program: async () => {
      const { data } = await supabase
        .from('loyalty_program_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single();
      return data;
    },
    feedback_hub: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'review_threshold_settings')
        .single();
      return data?.value;
    },
    // ... other feature configs
  };
  
  const captureConfig = configSources[featureKey];
  if (captureConfig) {
    return await captureConfig();
  }
  return {};
}
```

### 3. Features Center Page

Create a new page at `/dashboard/admin/features`:

```text
┌─────────────────────────────────────────────────────────────┐
│  FEATURES CENTER                                            │
│  Customize which features are available in your organization│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔒 CORE FEATURES (Always On)                          │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│  │ ⊞ Command Center    📅 Schedule    👥 Team Directory  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📚 TEAM DEVELOPMENT                              3/5  │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│  │ ┌─────────────────────────────────────────┬────────┐ │  │
│  │ │ 🎬 Training Hub                         │ [ON]   │ │  │
│  │ │ Video library and course management     │        │ │  │
│  │ └─────────────────────────────────────────┴────────┘ │  │
│  │ ┌─────────────────────────────────────────┬────────┐ │  │
│  │ │ 📋 Onboarding                           │ [ON]   │ │  │
│  │ │ New hire task checklists                │        │ │  │
│  │ └─────────────────────────────────────────┴────────┘ │  │
│  │ ┌─────────────────────────────────────────┬────────┐ │  │
│  │ │ 🎓 Graduation Tracker                   │ [OFF]  │ │  │
│  │ │ ⚠️ Disabled - Data preserved            │        │ │  │
│  │ └─────────────────────────────────────────┴────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 💰 CLIENT EXPERIENCE                             2/4  │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│  │ ... (Feedback Hub, Loyalty, Gift Cards, etc.)        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Feature Gating Integration

Update existing components to respect feature toggles:

```tsx
// src/hooks/useOrganizationFeature.ts
export function useOrganizationFeature(featureKey: string) {
  const { effectiveOrganization } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['org-feature', effectiveOrganization?.id, featureKey],
    queryFn: async () => {
      // Check organization_features table
      const { data } = await supabase
        .from('organization_features')
        .select('is_enabled')
        .eq('organization_id', effectiveOrganization.id)
        .eq('feature_key', featureKey)
        .maybeSingle();
      
      // If no override exists, check feature_catalog for default
      if (!data) {
        const { data: catalog } = await supabase
          .from('feature_catalog')
          .select('default_enabled')
          .eq('feature_key', featureKey)
          .single();
        return catalog?.default_enabled ?? true;
      }
      
      return data.is_enabled;
    },
    enabled: !!effectiveOrganization?.id,
  });
}
```

Wrap feature entry points:

```tsx
// In DashboardLayout.tsx or navigation items
<OrganizationFeatureGate featureKey="loyalty_program">
  <Link to="/dashboard/rewards">Rewards</Link>
</OrganizationFeatureGate>
```

### 5. Settings Integration

Add a "Features" card to the Settings page that links to the Features Center:

```tsx
// Add to categoriesMap in Settings.tsx
features: {
  id: 'features',
  label: 'Features',
  description: 'Enable or disable platform modules',
  icon: ToggleLeft, // or Blocks
},
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard/admin/FeaturesCenter.tsx` | Main Features Center page |
| `src/hooks/useOrganizationFeatures.ts` | Hooks for feature management |
| `src/hooks/useOrganizationFeature.ts` | Single feature check hook |
| `src/components/features/FeatureCategorySection.tsx` | Collapsible category UI |
| `src/components/features/FeatureToggleCard.tsx` | Individual feature toggle |
| `src/components/features/OrganizationFeatureGate.tsx` | Conditional wrapper component |
| `src/components/features/DisableFeatureDialog.tsx` | Confirmation with data preservation info |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route for `/dashboard/admin/features` |
| `src/pages/dashboard/admin/Settings.tsx` | Add Features category card |
| `src/hooks/useSettingsLayout.ts` | Add 'features' to layout config |
| `src/components/dashboard/DashboardLayout.tsx` | Gate navigation items by org feature |
| `src/pages/dashboard/admin/ManagementHub.tsx` | Gate sub-pages by org feature |

---

## Data Preservation Strategy

When a feature is disabled:

1. **Capture State**: Store current configuration in `last_known_config` JSONB column
2. **Hide UI**: Navigation items, tabs, and widgets are hidden
3. **Preserve Data**: All database records remain intact (appointments, training progress, etc.)
4. **Block Access**: Protected routes redirect to dashboard with message

When a feature is re-enabled:

1. **Restore Config**: Apply `last_known_config` back to relevant settings tables
2. **Show UI**: Navigation and components become visible again
3. **Resume Operations**: All historical data is immediately accessible

---

## Access Control

| Role | Permissions |
|------|-------------|
| Super Admin | Full access to Features Center; can toggle any non-core feature |
| Admin | Read-only view of feature status |
| Manager | No access (redirect to dashboard) |
| Platform Admin | Can manage features for any organization |

---

## Implementation Phases

**Phase 1: Foundation**
- Database schema (feature_catalog, organization_features)
- Basic hooks (useOrganizationFeatures, useOrganizationFeature)
- Features Center page with category sections

**Phase 2: UI Integration**
- OrganizationFeatureGate component
- Navigation filtering in DashboardLayout
- Settings page integration

**Phase 3: State Preservation**
- Config capture on disable
- Config restoration on enable
- Disable confirmation dialog with data info

**Phase 4: Polish**
- Search and filter in Features Center
- Feature dependencies (e.g., Gift Cards requires Loyalty)
- Bulk enable/disable per category
