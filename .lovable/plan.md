
# Add Pinned Analytics Management to Customize Dashboard Drawer

## Overview

Enable users to view, unpin, and rearrange pinned analytics cards directly from the "Customize Dashboard" drawer instead of requiring navigation to the Analytics Hub. This creates a unified dashboard configuration experience.

---

## Current State

**How pinning works today:**
- Analytics cards are pinned via the gear icon (CommandCenterVisibilityToggle) in the Analytics Hub
- Pinned state is stored in the `dashboard_element_visibility` table with `is_visible: true` for leadership roles
- The Customize Dashboard drawer shows a "PINNED ANALYTICS" section that only links to the Analytics Hub
- There's no way to unpin or reorder cards from the drawer

**Current drawer structure:**
```text
SECTIONS
├── Command Center ☑
├── Operations Stats ☑
├── Announcements ☑
└── ...

WIDGETS
├── What's New ☑
├── Team Birthdays ☑
└── ...

PINNED ANALYTICS
└── "Pin cards from the Analytics Hub..." → [Open Analytics Hub]
```

---

## Solution

Replace the static "PINNED ANALYTICS" section with a dynamic, interactive list that:
1. Shows all currently pinned analytics cards
2. Allows toggling (unpinning) each card via a switch
3. Supports drag-and-drop reordering (order stored in user's layout)
4. Still provides a link to the Analytics Hub for pinning new cards

---

## Visual Design

```text
PINNED ANALYTICS
├── ⋮⋮ Sales Dashboard        ☑
├── ⋮⋮ Top Performers         ☑
├── ⋮⋮ Revenue Breakdown      ☑
└── ⋮⋮ Capacity Utilization   ☐  (disabled = unpinned)

[Open Analytics Hub to pin more cards]
```

Each item has:
- Drag handle (⋮⋮) for reordering
- Icon representing the card type
- Label (card name)
- Toggle switch to unpin

---

## Implementation Steps

### Step 1: Define Available Pinnable Cards Configuration

Create a configuration array of all pinnable analytics cards with their metadata:

```typescript
const PINNABLE_CARDS = [
  { id: 'sales_dashboard_bento', label: 'Sales Dashboard', icon: <LayoutDashboard /> },
  { id: 'sales_overview', label: 'Sales Overview', icon: <DollarSign /> },
  { id: 'top_performers', label: 'Top Performers', icon: <Trophy /> },
  { id: 'revenue_breakdown', label: 'Revenue Breakdown', icon: <PieChart /> },
  { id: 'client_funnel', label: 'Client Funnel', icon: <Users /> },
  { id: 'team_goals', label: 'Team Goals', icon: <Target /> },
  { id: 'new_bookings', label: 'New Bookings', icon: <CalendarPlus /> },
  { id: 'week_ahead_forecast', label: 'Week Ahead Forecast', icon: <TrendingUp /> },
  { id: 'capacity_utilization', label: 'Capacity Utilization', icon: <Gauge /> },
  { id: 'hiring_capacity', label: 'Hiring Capacity', icon: <UserPlus /> },
  { id: 'staffing_trends', label: 'Staffing Trends', icon: <LineChart /> },
  { id: 'stylist_workload', label: 'Stylist Workload', icon: <Briefcase /> },
];
```

### Step 2: Create SortablePinnedCardItem Component

Create a new component similar to `SortableWidgetItem` for rendering draggable pinned card items:

```typescript
// src/components/dashboard/SortablePinnedCardItem.tsx
interface SortablePinnedCardItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isPinned: boolean;
  onToggle: () => void;
}
```

### Step 3: Update DashboardCustomizeMenu

Replace the static "PINNED ANALYTICS" section with an interactive list:

1. **Fetch visibility data** using `useDashboardVisibility()` hook
2. **Determine which cards are pinned** by checking if `is_visible` is true for leadership roles
3. **Compute ordered list** from `layout.pinnedCards` (user's saved order) + any newly pinned cards
4. **Render sortable list** with toggle switches for unpinning
5. **Handle toggle** by calling `useToggleDashboardVisibility` for all leadership roles
6. **Handle drag end** by saving new order to `layout.pinnedCards`

### Step 4: Update CommandCenterAnalytics to Respect Order

The Command Center should render cards in the order specified by `layout.pinnedCards` rather than a fixed order:

```typescript
// Get user's preferred order
const pinnedCardsOrder = layout.pinnedCards || [];

// Sort visible cards by saved order
const orderedPinnedCards = pinnedCardsOrder
  .filter(cardId => isElementVisible(cardId))
  .concat(
    // Add any newly pinned cards not in saved order
    allVisibleCards.filter(id => !pinnedCardsOrder.includes(id))
  );
```

---

## Data Flow

### Unpinning a Card (from drawer)

```text
User toggles switch OFF
      │
      ▼
DashboardCustomizeMenu calls useToggleDashboardVisibility
      │
      ▼
Updates dashboard_element_visibility table (is_visible = false for leadership roles)
      │
      ▼
React Query invalidates cache → CommandCenterAnalytics re-renders → Card disappears
```

### Reordering Cards (from drawer)

```text
User drags card to new position
      │
      ▼
DashboardCustomizeMenu calls useSaveDashboardLayout with updated pinnedCards array
      │
      ▼
Updates user_preferences.dashboard_layout JSON
      │
      ▼
CommandCenterAnalytics uses new order to render cards
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/SortablePinnedCardItem.tsx` | **NEW** - Sortable item component for pinned analytics cards |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Add interactive pinned cards list with drag-and-drop and toggle |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Respect pinnedCards order from layout when rendering |
| `src/hooks/useDashboardLayout.ts` | Ensure pinnedCards is properly parsed and saved |

---

## Technical Details

### Determining Pinned Status

A card is considered "pinned" if all leadership roles (`super_admin`, `admin`, `manager`) have `is_visible: true` for that element key in `dashboard_element_visibility`:

```typescript
const isPinned = (elementKey: string) => {
  const leadershipRoles = ['super_admin', 'admin', 'manager'];
  return leadershipRoles.every(role => 
    visibilityData?.find(v => v.element_key === elementKey && v.role === role)?.is_visible ?? false
  );
};
```

### Saving Order to Layout

When the user reorders pinned cards, save the new order to `layout.pinnedCards`:

```typescript
const handlePinnedCardDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  const oldIndex = orderedPinnedCards.indexOf(active.id as string);
  const newIndex = orderedPinnedCards.indexOf(over.id as string);
  const newOrder = arrayMove(orderedPinnedCards, oldIndex, newIndex);
  
  saveLayout.mutate({ ...layout, pinnedCards: newOrder });
};
```

### Unpinning a Card

When the user toggles a card OFF, update the visibility table (not the layout):

```typescript
const handleUnpinCard = async (cardId: string) => {
  const leadershipRoles: AppRole[] = ['super_admin', 'admin', 'manager'];
  for (const role of leadershipRoles) {
    await toggleVisibility.mutateAsync({
      elementKey: cardId,
      role,
      isVisible: false,
    });
  }
};
```

---

## Benefits

1. **Unified Experience** - Manage all dashboard customization from one drawer
2. **Quick Unpinning** - Remove cards without navigating to Analytics Hub
3. **Custom Order** - Users can arrange pinned cards in their preferred sequence
4. **Consistent UI** - Matches existing Sections and Widgets patterns in the drawer
5. **Preserved Navigation** - Still provides link to Analytics Hub for discovering/pinning new cards

---

## Edge Cases

- **No pinned cards**: Show helpful message "No analytics cards pinned yet" with link to Analytics Hub
- **New cards pinned externally**: Cards pinned from Analytics Hub appear at the end of the list
- **Order persistence**: Order is saved per-user in `user_preferences.dashboard_layout.pinnedCards`
