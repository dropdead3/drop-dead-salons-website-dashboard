
# Allow Pinned Analytics to Move Among Dashboard Sections

## Overview

Transform pinned analytics cards from being contained within a single "Command Center" section to being independent, reorderable items that can be positioned anywhere among other dashboard sections (like Quick Actions, Announcements, Operations Stats, etc.).

---

## Current Architecture

```text
Dashboard
├── Quick Actions
├── Command Center          ← Single section containing all pinned cards
│   ├── [Filter Bar]
│   ├── Sales Dashboard
│   ├── Top Performers
│   └── Revenue Breakdown
├── Operations Stats
├── Announcements
└── Widgets
```

**Problem:** All pinned analytics are bundled inside "Command Center". Users can reorder cards within it, but cannot position individual cards among other sections.

---

## Proposed Architecture

```text
Dashboard
├── Quick Actions
├── [Pinned] Sales Dashboard    ← Analytics card as independent section
├── Operations Stats
├── [Pinned] Top Performers     ← Can be placed anywhere
├── Announcements
├── [Pinned] Revenue Breakdown
└── Widgets
```

**Solution:** Treat each pinned analytics card as a standalone section that can be reordered alongside other sections.

---

## Implementation Approach

### Key Changes

1. **Merge pinned cards into sectionOrder**: Instead of keeping pinned cards separate, include them directly in `sectionOrder` alongside regular sections
2. **Remove the "Command Center" section concept**: The "Command Center" becomes just a label/header, not a container
3. **Update Customize Drawer**: Show pinned cards inline with sections for reordering
4. **Shared Filter Bar**: Move the filter bar to render at the top when any analytics cards are visible (independent of specific cards)

---

## Data Model Changes

### Current `DashboardLayout`:
```typescript
{
  sections: ['quick_actions', 'command_center', 'operations_stats', ...],
  sectionOrder: ['quick_actions', 'command_center', 'operations_stats', ...],
  pinnedCards: ['sales_dashboard_bento', 'top_performers'],  // Separate array
  widgets: [...],
}
```

### New `DashboardLayout`:
```typescript
{
  sections: ['quick_actions', 'operations_stats', ...],  // No more 'command_center'
  sectionOrder: [
    'quick_actions', 
    'pinned:sales_dashboard_bento',  // Pinned cards with prefix
    'operations_stats',
    'pinned:top_performers',
    'announcements',
  ],
  pinnedCards: ['sales_dashboard_bento', 'top_performers'],  // Still tracked for visibility
  widgets: [...],
}
```

Using a `pinned:` prefix allows distinguishing analytics cards from regular sections in the unified order.

---

## Implementation Steps

### Step 1: Update `useDashboardLayout.ts`

- Add helper functions to identify pinned card entries in `sectionOrder`
- Update default layout to remove `command_center` as a section
- Add migration logic to convert existing layouts (insert pinned cards into sectionOrder)

### Step 2: Update `DashboardHome.tsx`

- Modify the section rendering loop to handle pinned card IDs
- When encountering a `pinned:*` entry, render the corresponding analytics card
- Render the shared filter bar at the top when any pinned cards exist

### Step 3: Update `DashboardCustomizeMenu.tsx`

- Merge pinned cards into the sections list for unified drag-and-drop
- Show pinned cards with a distinct visual treatment (badge/icon)
- Allow toggling visibility and reordering in a single list

### Step 4: Remove `CommandCenterAnalytics` as a Section

- The component will be refactored into individual card renderers
- Filter bar will be rendered separately at the top of the dashboard
- Remove the `command_center` entry from sections configuration

---

## Visual Design - Customize Drawer

```text
SECTIONS & ANALYTICS

⋮⋮ Quick Actions           ☑   [Section]
⋮⋮ Sales Dashboard         ☑   [Analytics - pinned]
⋮⋮ Operations Stats        ☑   [Section]
⋮⋮ Top Performers          ☑   [Analytics - pinned]
⋮⋮ Announcements           ☑   [Section]
⋮⋮ Revenue Breakdown       ☑   [Analytics - pinned]
⋮⋮ Widgets                 ☑   [Section]

───────────────────────────────────
UNPINNED ANALYTICS
(Pin from Analytics Hub)

  Client Funnel             ☐
  Team Goals                ☐
  Hiring Capacity           ☐
  ...

[Open Analytics Hub]
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDashboardLayout.ts` | Add pinned card helpers, update default layout, add migration logic |
| `src/pages/dashboard/DashboardHome.tsx` | Handle `pinned:*` entries in section loop, render filter bar at top |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Merge sections and pinned cards into unified sortable list |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Refactor to export individual card renderers or remove entirely |

---

## Technical Details

### Identifying Pinned Card Entries

```typescript
const isPinnedCardEntry = (id: string) => id.startsWith('pinned:');
const getPinnedCardId = (id: string) => id.replace('pinned:', '');
const toPinnedEntry = (cardId: string) => `pinned:${cardId}`;
```

### Rendering Logic in DashboardHome

```typescript
orderedSectionIds.map(sectionId => {
  // Check if this is a pinned analytics card
  if (isPinnedCardEntry(sectionId)) {
    const cardId = getPinnedCardId(sectionId);
    if (!isCardPinned(cardId)) return null;
    return <PinnedCardRenderer key={sectionId} cardId={cardId} filters={sharedFilters} />;
  }
  
  // Regular section
  if (!layout.sections.includes(sectionId)) return null;
  const component = sectionComponents[sectionId];
  return component ? <Fragment key={sectionId}>{component}</Fragment> : null;
});
```

### Filter Bar Placement

The shared filter bar renders at the top of the dashboard (above all sections) when any pinned cards are visible:

```typescript
{hasPinnedAnalytics && (
  <div className="flex items-center gap-3 mb-6">
    <LocationSelect value={locationId} onChange={setLocationId} />
    <DateRangeSelect value={dateRange} onChange={setDateRange} />
  </div>
)}
```

---

## Migration Strategy

For existing users with saved layouts:

```typescript
// In useDashboardLayout hook
const migrateLayout = (layout: DashboardLayout): DashboardLayout => {
  // If sectionOrder contains 'command_center', migrate
  if (layout.sectionOrder.includes('command_center')) {
    const insertIndex = layout.sectionOrder.indexOf('command_center');
    
    // Remove command_center from sections and sectionOrder
    const newSectionOrder = layout.sectionOrder.filter(id => id !== 'command_center');
    const newSections = layout.sections.filter(id => id !== 'command_center');
    
    // Insert pinned cards at the command_center position
    const pinnedEntries = (layout.pinnedCards || []).map(id => `pinned:${id}`);
    newSectionOrder.splice(insertIndex, 0, ...pinnedEntries);
    
    return { ...layout, sectionOrder: newSectionOrder, sections: newSections };
  }
  return layout;
};
```

---

## Benefits

1. **Full Flexibility**: Place any analytics card anywhere among dashboard sections
2. **Unified Ordering**: Single drag-and-drop list manages all dashboard elements
3. **Simpler Mental Model**: No "container within container" concept
4. **Consistent UX**: Same interaction pattern for sections and analytics cards

---

## Edge Cases

- **New pinned card**: Added to end of sectionOrder as `pinned:{cardId}`
- **Unpinned card**: Entry removed from sectionOrder when visibility is toggled off
- **Existing users**: Migration converts `command_center` position to inline pinned cards
- **No pinned cards**: Filter bar not shown, dashboard renders only regular sections
