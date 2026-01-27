
# Dashboard Customization Menu with Role-Based Defaults

## Overview

This plan creates a **Dashboard Setup Menu** that invites users to build personalized dashboard views. It includes:
1. An interactive onboarding prompt for first-time users
2. Role-based default dashboard templates
3. A "Customize Dashboard" menu for ongoing configuration
4. Admin ability to define and manage default views per role

## Current State

| Component | Current Behavior |
|-----------|-----------------|
| Command Center | Shows empty state with link to Analytics Hub when no cards pinned |
| WidgetsSection | Uses local state for widget toggles (not persisted) |
| User Preferences | Stores `settings_layout` for settings page order only |
| Visibility System | Per-role visibility stored in `dashboard_element_visibility` table |

## Proposed Architecture

```text
                    Dashboard Home
                         |
          +--------------+--------------+
          |                             |
    First Visit?                   Returning User
          |                             |
    Show Setup Wizard              Load Saved Layout
          |                             |
    Apply Role Defaults            Show Customize Button
          |
    Save to user_preferences
```

## Solution Components

### Part 1: Database Schema Updates

Add `dashboard_layout` column to `user_preferences` for storing personal dashboard configuration:

```sql
-- Add dashboard_layout column to store user's dashboard customization
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

-- Create dashboard_layout_templates table for role-based defaults
CREATE TABLE IF NOT EXISTS public.dashboard_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.dashboard_layout_templates ENABLE ROW LEVEL SECURITY;

-- Read policy: All authenticated users can view templates
CREATE POLICY "Anyone can view dashboard templates"
ON public.dashboard_layout_templates FOR SELECT TO authenticated
USING (true);

-- Write policy: Only admins can manage templates
CREATE POLICY "Admins can manage dashboard templates"
ON public.dashboard_layout_templates FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- Seed default templates for each role category
INSERT INTO public.dashboard_layout_templates (role_name, display_name, description, layout, is_default) VALUES
('leadership', 'Leadership View', 'Default layout for managers and admins with analytics focus', 
 '{"sections": ["command_center", "announcements", "widgets"], "pinnedCards": ["sales_overview", "top_performers", "capacity_utilization"], "widgets": ["changelog", "birthdays"]}', 
 true),
('stylist', 'Stylist View', 'Default layout for stylists with client and program focus',
 '{"sections": ["quick_actions", "client_engine", "schedule", "tasks"], "widgets": ["schedule", "changelog"]}',
 true),
('operations', 'Operations View', 'Default layout for front desk and operations support',
 '{"sections": ["quick_stats", "schedule", "tasks", "announcements"], "widgets": ["schedule", "birthdays"]}',
 true)
ON CONFLICT (role_name) DO NOTHING;
```

### Part 2: Dashboard Layout Interface

Dashboard layout configuration structure:

```typescript
interface DashboardLayout {
  sections: string[];           // Ordered list of visible sections
  pinnedCards: string[];        // Analytics cards pinned to Command Center
  widgets: string[];            // Enabled utility widgets
  hasCompletedSetup: boolean;   // Flag to show/hide setup wizard
}
```

### Part 3: New Files to Create

#### `src/hooks/useDashboardLayout.ts`
Custom hook for managing dashboard layout preferences:
- Fetch user's saved layout from `user_preferences.dashboard_layout`
- Fetch role-based default template if no saved layout
- Provide mutation for saving layout changes
- Track setup completion status

#### `src/components/dashboard/DashboardSetupWizard.tsx`
Interactive onboarding component shown on first visit:
- Welcome message with user's role context
- Step-by-step guide: "Choose your starting template" -> "Customize sections" -> "Pin analytics cards"
- Option to start with role default or blank slate
- Saves configuration and marks setup complete

#### `src/components/dashboard/DashboardCustomizeMenu.tsx`
Persistent customization menu (replaces simple gear icon):
- Dropdown/sheet with section toggles
- Quick access to Analytics Hub pinning
- Link to full Visibility Console for admins
- "Reset to Default" option using role template

### Part 4: Modify Dashboard Home

Update `src/pages/dashboard/DashboardHome.tsx`:

1. **Add Setup Detection**: Check if `hasCompletedSetup` is false
2. **Show Wizard or Menu**: Render `DashboardSetupWizard` for first-time users
3. **Add Customize Button**: Show `DashboardCustomizeMenu` in header for returning users
4. **Section Ordering**: Render sections based on saved `sections` array order

```tsx
// Conceptual structure
export default function DashboardHome() {
  const { layout, isLoading, hasCompletedSetup } = useDashboardLayout();
  
  // First-time user experience
  if (!hasCompletedSetup && !isLoading) {
    return (
      <DashboardLayout>
        <DashboardSetupWizard />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      {/* Customize menu in header */}
      <DashboardCustomizeMenu />
      
      {/* Render sections in user's preferred order */}
      {layout.sections.map(section => (
        <DashboardSection key={section} id={section} />
      ))}
    </DashboardLayout>
  );
}
```

### Part 5: Admin Template Management

Add template management to Settings or Visibility Console:

#### `src/components/settings/DashboardTemplateManager.tsx`
- List all role templates with preview
- Edit template configuration (sections, widgets, pinned cards)
- Set which template applies to which roles
- Create new templates from current layout

## User Experience Flows

### First-Time User (Stylist)
```text
1. User logs in for first time
2. Dashboard shows Setup Wizard overlay
3. "Welcome! Let's set up your dashboard"
4. Shows "Stylist View" template preview
5. User clicks "Use This Layout" or "Customize"
6. Layout saved, wizard dismissed
7. Future visits show personalized dashboard
```

### Leadership User Customizing
```text
1. User clicks "Customize Dashboard" button
2. Sheet opens with toggles for each section
3. "Pin Analytics" links to Analytics Hub
4. Changes save automatically
5. "Reset to Default" restores role template
```

### Admin Managing Templates
```text
1. Navigate to Settings > Dashboard Templates
2. See list: Leadership View, Stylist View, Operations View
3. Click edit on "Stylist View"
4. Toggle sections, set default widgets
5. Save - all new stylists get this layout
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useDashboardLayout.ts` | Layout fetching, saving, and template logic |
| `src/components/dashboard/DashboardSetupWizard.tsx` | First-time onboarding wizard |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Ongoing customization dropdown |
| `src/components/settings/DashboardTemplateManager.tsx` | Admin template management |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/DashboardHome.tsx` | Add setup detection, customize button, section ordering |
| `src/components/dashboard/WidgetsSection.tsx` | Integrate with `useDashboardLayout` for persistence |
| `src/integrations/supabase/types.ts` | (Auto-generated after migration) |

## Benefits

1. **Guided Onboarding**: Users aren't dropped into empty or confusing dashboards
2. **Role Relevance**: Each role type gets contextually appropriate defaults
3. **User Control**: Individuals can customize beyond defaults
4. **Admin Efficiency**: One-time template setup applies to all users of that role
5. **Persistence**: Widget toggles and section order save between sessions

## Technical Considerations

- **Backward Compatibility**: Existing users without layout preferences get their role's default template
- **Migration Path**: Current visibility settings continue to work alongside layout preferences
- **Performance**: Layout data cached via React Query, minimal additional queries
- **Offline Resilience**: Local state shows last-known layout while fetching updates
