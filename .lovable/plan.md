

# Add Shift Swaps & Rewards to Team Member Sidebar

## Overview

Add a new "Team Tools" sidebar section visible to team member roles (stylist, stylist_assistant, receptionist, booth_renter) containing links to **Shift Swaps** and **Rewards**.

---

## Implementation Details

### 1. Add New "Team Tools" Section

Update `src/hooks/useSidebarLayout.ts` to include a new built-in section:

**Changes to DEFAULT_SECTION_ORDER:**
```typescript
export const DEFAULT_SECTION_ORDER = [
  'main',
  'growth', 
  'stats',
  'teamTools',    // NEW - after stats, before getHelp
  'getHelp',
  'housekeeping',
  'manager',
  'website',
  'adminOnly',
  'platform',
];
```

**Changes to SECTION_LABELS:**
```typescript
export const SECTION_LABELS: Record<string, string> = {
  // ... existing labels ...
  teamTools: 'Team Tools',
};
```

**Changes to DEFAULT_LINK_ORDER:**
```typescript
export const DEFAULT_LINK_ORDER: Record<string, string[]> = {
  // ... existing sections ...
  teamTools: [
    '/dashboard/shift-swaps',
    '/dashboard/rewards',
  ],
  // ... rest of sections ...
};
```

---

### 2. Update Sidebar Preview Component

Update `src/components/dashboard/settings/SidebarPreview.tsx` to include the new link labels:

```typescript
const LINK_CONFIG: Record<string, { label: string }> = {
  // ... existing links ...
  '/dashboard/shift-swaps': { label: 'Shift Swaps' },
  '/dashboard/rewards': { label: 'Rewards' },
};
```

---

### 3. Configure Default Role Visibility

The Team Tools section should be visible by default to these roles:
- `stylist`
- `stylist_assistant`
- `receptionist`
- `booth_renter`

And hidden from leadership roles by default (they can access via other hubs):
- `admin`, `super_admin`, `manager` - hidden

Since the Role Access Configurator now controls visibility, we'll set the section to be visible globally, and leadership can hide it via the configurator if desired.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSidebarLayout.ts` | Add `teamTools` to `DEFAULT_SECTION_ORDER`, `SECTION_LABELS`, and `DEFAULT_LINK_ORDER` |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Add shift-swaps and rewards to `LINK_CONFIG` |

---

## Result

After implementation:
- Team members will see a new **"Team Tools"** section in their sidebar
- Contains **Shift Swaps** (icon: ArrowLeftRight) and **Rewards** (icon: Gift)
- Fully configurable via the Role Access Configurator if visibility adjustments are needed
- Links are already registered in `SidebarLayoutEditor.tsx` with proper icons

