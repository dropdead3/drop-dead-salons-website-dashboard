

# Update Settings Page with Access Hub Link

## Problem
The Settings page still shows the old "Role Access" and "Visibility Console" cards, and there's no link to the new **Access & Controls Hub**. Phase 3 of the centralization plan was not yet implemented.

## Solution
1. Remove the redundant `visibility` and `role-access` cards from Settings
2. Add a new "Access & Controls Hub" card that links to `/dashboard/admin/access-hub`
3. Update the section groups to reflect the change

---

## Changes Required

### File: `src/hooks/useSettingsLayout.ts`

**Update `SECTION_GROUPS`** - Replace `role-access` and `visibility` with `access-hub`:

```typescript
export const SECTION_GROUPS = [
  {
    id: 'operations',
    label: 'Business Operations',
    categories: ['business', 'locations', 'schedule', 'dayrate', 'forms', 'levels', 'onboarding', 'handbooks', 'loyalty', 'feedback'],
  },
  {
    id: 'team',
    label: 'Access & Visibility',
    categories: ['users', 'access-hub'],  // Changed from ['users', 'role-access', 'visibility']
  },
  // ... rest unchanged
];
```

**Update `DEFAULT_ICON_COLORS`** - Add `access-hub`, remove redundant keys:

```typescript
export const DEFAULT_ICON_COLORS: Record<string, string> = {
  // ... existing colors ...
  'access-hub': '#8B5CF6',  // Purple (Shield theme)
  // Remove 'visibility' and 'role-access' (optional, they just won't be used)
};
```

---

### File: `src/pages/dashboard/admin/Settings.tsx`

**1. Update `SettingsCategory` type** (line ~119):

```typescript
type SettingsCategory = 
  | 'business' | 'email' | 'sms' | 'service-flows' | 'users' 
  | 'onboarding' | 'integrations' | 'system' | 'program' 
  | 'levels' | 'handbooks' | 'access-hub' | 'schedule' 
  | 'locations' | 'dayrate' | 'forms' | 'loyalty' | 'feedback' 
  | null;
```

**2. Update `categoriesMap`** (around line 672):

Remove:
```typescript
visibility: { ... },
'role-access': { ... },
```

Add:
```typescript
'access-hub': {
  id: 'access-hub',
  label: 'Access & Controls Hub',
  description: 'Modules, role visibility, and permissions',
  icon: Shield,
},
```

**3. Add navigation handling for Access Hub** (in the category click handler):

When `access-hub` is clicked, navigate to `/dashboard/admin/access-hub` instead of showing a detail panel:

```typescript
const handleCategoryClick = (categoryId: string) => {
  if (categoryId === 'access-hub') {
    navigate('/dashboard/admin/access-hub');
  } else {
    setActiveCategory(categoryId as SettingsCategory);
  }
};
```

**4. Import `useNavigate`**:

```typescript
import { useLocation, useNavigate } from 'react-router-dom';
```

---

## Visual Result

**Before:**
```
Access & Visibility
├── Users
├── Role Access      ← Separate page
└── Visibility Console   ← Separate page
```

**After:**
```
Access & Visibility
├── Users
└── Access & Controls Hub  ← Links to /dashboard/admin/access-hub
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSettingsLayout.ts` | Update `SECTION_GROUPS` and `DEFAULT_ICON_COLORS` |
| `src/pages/dashboard/admin/Settings.tsx` | Replace `visibility`/`role-access` with `access-hub` card that navigates to the hub |

---

## What Stays

The individual content components (`RoleAccessConfigurator`, `CommandCenterContent`) remain in the codebase as they're now used within the Access Hub tabs. They just won't be directly accessible from Settings anymore.

