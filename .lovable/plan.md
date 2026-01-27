

# Fix: Add Role Access to Settings Grid

## Problem

The "Role Access" settings card is not visible in the settings grid because it's missing from two key configuration objects in `useSettingsLayout.ts`:

1. **`SECTION_GROUPS`** - Controls which categories appear in the grid
2. **`DEFAULT_ICON_COLORS`** - Defines the icon color for each category

While the category is properly defined in Settings.tsx and renders correctly when accessed, it simply can't be clicked because it never appears in the grid.

## Solution

Update `src/hooks/useSettingsLayout.ts` to include `role-access` in the appropriate section group and add its default icon color.

## Changes

### File: `src/hooks/useSettingsLayout.ts`

**1. Add `role-access` to `DEFAULT_ICON_COLORS`:**

```typescript
export const DEFAULT_ICON_COLORS: Record<string, string> = {
  business: '#D946EF',
  email: '#8B5CF6',
  users: '#3B82F6',
  onboarding: '#F97316',
  integrations: '#10B981',
  system: '#6B7280',
  program: '#EC4899',
  levels: '#14B8A6',
  handbooks: '#EAB308',
  visibility: '#6366F1',
  schedule: '#0EA5E9',
  locations: '#EF4444',
  dayrate: '#F97316',
  'role-access': '#8B5CF6',  // Purple (matches Shield icon theme)
};
```

**2. Add `role-access` to `SECTION_GROUPS`:**

The most logical placement is in the "Team & Access" section since it deals with role-based access:

```typescript
export const SECTION_GROUPS = [
  {
    id: 'operations',
    label: 'Business Operations',
    categories: ['business', 'locations', 'schedule', 'dayrate'],
  },
  {
    id: 'team',
    label: 'Team & Access',
    categories: ['users', 'levels', 'onboarding', 'handbooks', 'role-access'],
  },
  {
    id: 'platform',
    label: 'Platform',
    categories: ['system', 'visibility', 'integrations'],
  },
  {
    id: 'communications',
    label: 'Communications',
    categories: ['email', 'program'],
  },
];
```

## Result

After this fix, the "Role Access" card will appear in the Settings grid under the "Team & Access" section, allowing admins to click it and access the Role Access Configurator.

