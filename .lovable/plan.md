

# Add Quick Access Hubs Customization

## Overview

Enable users to customize which Quick Access Hubs appear on their dashboard and in what order, all from within the existing "Customize Dashboard" drawer.

---

## Current State

- The `HubQuickLinks` component displays a hardcoded list of 9 hub shortcuts
- The entire "Quick Access Hubs" section can be toggled on/off as a dashboard section
- Users cannot:
  - Hide individual hubs they don't need
  - Reorder hubs to prioritize their favorites

---

## Solution

Add a new **"Quick Access Hubs"** section to the Customize Dashboard drawer that allows:
- **Drag-and-drop reordering** of individual hubs
- **Toggle switches** to show/hide specific hubs
- Persist preferences to `user_preferences.dashboard_layout`

---

## Implementation Details

### 1. Update Dashboard Layout Type

**File:** `src/hooks/useDashboardLayout.ts`

Add new fields to the `DashboardLayout` interface:

```typescript
export interface DashboardLayout {
  sections: string[];
  sectionOrder: string[];
  pinnedCards: string[];
  widgets: string[];
  hasCompletedSetup: boolean;
  // New fields for hub customization
  hubOrder?: string[];      // Order of hub IDs
  enabledHubs?: string[];   // Which hubs are visible
}
```

Update `DEFAULT_LAYOUT` to include all hubs enabled by default.

---

### 2. Create Sortable Hub Item Component

**New file:** `src/components/dashboard/SortableHubItem.tsx`

A reusable sortable item for hubs in the drawer, similar to `SortableSectionItem`:

```typescript
interface SortableHubItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  isEnabled: boolean;
  onToggle: () => void;
}
```

Features:
- Drag handle (GripVertical icon)
- Hub icon with its color accent
- Label
- Toggle switch

---

### 3. Export Hub Links from HubQuickLinks

**File:** `src/components/dashboard/HubQuickLinks.tsx`

Export the `hubLinks` array so it can be used by the customization menu:

```typescript
export const hubLinks: HubLinkProps[] = [
  // ... existing hubs
];
```

Also export the `HubLinkProps` interface.

---

### 4. Update HubQuickLinks Component

**File:** `src/components/dashboard/HubQuickLinks.tsx`

Accept optional props for custom order and enabled state:

```typescript
interface HubQuickLinksProps {
  hubOrder?: string[];
  enabledHubs?: string[];
}

export function HubQuickLinks({ hubOrder, enabledHubs }: HubQuickLinksProps) {
  const { hasPermission } = useAuth();

  // Filter by permission first, then by enabled state
  const permittedHubs = hubLinks.filter(hub => 
    !hub.permission || hasPermission(hub.permission)
  );

  // Apply custom order and visibility
  const visibleHubs = useMemo(() => {
    let filtered = permittedHubs;
    
    // Filter to only enabled hubs if specified
    if (enabledHubs) {
      filtered = filtered.filter(hub => enabledHubs.includes(hub.href));
    }
    
    // Apply custom order if specified
    if (hubOrder) {
      filtered = [...filtered].sort((a, b) => {
        const aIndex = hubOrder.indexOf(a.href);
        const bIndex = hubOrder.indexOf(b.href);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
    
    return filtered;
  }, [permittedHubs, hubOrder, enabledHubs]);

  // ... rest of component
}
```

---

### 5. Update DashboardCustomizeMenu

**File:** `src/components/dashboard/DashboardCustomizeMenu.tsx`

Add a new section for hub customization:

```text
SECTIONS & ANALYTICS    <- existing
---
QUICK ACCESS HUBS       <- new section
[Drag] Analytics Hub       [Toggle]
[Drag] Management Hub      [Toggle]
[Drag] Payroll Hub         [Toggle]
...
---
WIDGETS                 <- existing
```

Implementation:
- Import `hubLinks` from `HubQuickLinks`
- Filter hubs by user permission (same logic as the component)
- Use `SortableContext` with `hubOrder` state
- Add handlers for `handleHubDragEnd` and `handleToggleHub`
- Save to `layout.hubOrder` and `layout.enabledHubs`

---

### 6. Update DashboardHome to Pass Hub Preferences

**File:** `src/pages/dashboard/DashboardHome.tsx`

Pass the hub order and enabled state to `HubQuickLinks`:

```typescript
hub_quicklinks: isLeadership && (
  <HubQuickLinks 
    hubOrder={layout.hubOrder}
    enabledHubs={layout.enabledHubs}
  />
),
```

---

## User Flow

1. User clicks "Customize" button on dashboard
2. Drawer opens showing all customization options
3. Scroll to "Quick Access Hubs" section
4. See list of all available hubs (filtered by their permissions)
5. Drag to reorder hubs
6. Toggle to show/hide specific hubs
7. Changes save automatically
8. Dashboard updates to reflect new hub order and visibility

---

## Visual Design (in Drawer)

```text
QUICK ACCESS HUBS
Drag to reorder. Toggle to show/hide hubs.

[≡] [📈] Analytics Hub           [✓]
[≡] [⊞]  Management Hub          [✓]
[≡] [💲] Payroll Hub             [ ]  <- disabled
[≡] [🏪] Renter Hub              [✓]
[≡] [🌐] Website Editor          [✓]
[≡] [💬] Feedback Hub            [✓]
[≡] [🛡️] Access Hub              [✓]
[≡] [📋] Onboarding Hub          [✓]
[≡] [📅] Schedule 1:1            [✓]
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useDashboardLayout.ts` | Add `hubOrder` and `enabledHubs` to interface and default |
| `src/components/dashboard/SortableHubItem.tsx` | Create new component |
| `src/components/dashboard/HubQuickLinks.tsx` | Export `hubLinks`, accept order/enabled props |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Add hub customization section |
| `src/pages/dashboard/DashboardHome.tsx` | Pass hub preferences to HubQuickLinks |

---

## Benefits

1. Users can hide hubs they never use (cleaner dashboard)
2. Users can prioritize frequently-used hubs at the start
3. Follows existing patterns in the codebase (sections, widgets)
4. Preferences persist across sessions
5. Permission-based filtering still applies (users only see hubs they have access to)

