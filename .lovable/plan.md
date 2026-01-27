

# Fix Dashboard Customize Menu and Section Ordering

## Overview

Two issues need to be fixed:

1. **Today's Queue disappears when toggled off** - The drawer should always show all role-appropriate sections, regardless of their enabled/disabled state
2. **Rearranging sections in drawer should reorder actual dashboard** - Currently the dashboard renders sections in hardcoded order

---

## Problem Analysis

### Issue 1: Sections Disappearing

**Current behavior in `DashboardCustomizeMenu.tsx`:**
- `layout.sections` only contains **enabled** section IDs
- When a section is toggled off, it's removed from `layout.sections`
- `orderedSections` filters based on `layout.sections`, so disabled sections disappear

**Solution:** Change the data model to store **all section IDs with their order**, not just enabled ones. The layout should track:
- `sectionOrder`: All section IDs in their display order
- `enabledSections`: Set of enabled section IDs

However, a simpler approach that doesn't require schema changes:
- In the drawer, always show all role-appropriate sections
- Keep enabled sections in their saved order first
- Append disabled sections at the end (preserving their relative order)
- When saving, store the **full ordered list** (not just enabled ones)

### Issue 2: Dashboard Not Reflecting Order

**Current behavior in `DashboardHome.tsx`:**
- Sections are rendered in hardcoded JSX order
- `layout.sections` is not used to determine render order

**Solution:** Refactor `DashboardHome.tsx` to:
1. Define section components as a map
2. Render sections based on `layout.sections` order
3. Only render sections that pass role visibility checks

---

## Implementation Plan

### File 1: `src/hooks/useDashboardLayout.ts`

Add a new field `sectionOrder` to track all sections (enabled + disabled) in their order:

```typescript
export interface DashboardLayout {
  sections: string[];      // Enabled sections only (for backwards compatibility)
  sectionOrder: string[];  // All sections in order (new)
  pinnedCards: string[];
  widgets: string[];
  hasCompletedSetup: boolean;
}
```

Update the default layout and parsing to include `sectionOrder`.

### File 2: `src/components/dashboard/DashboardCustomizeMenu.tsx`

**Update ordered sections logic:**

```typescript
// Compute ordered sections - use sectionOrder if available, otherwise derive from sections
const orderedSections = useMemo(() => {
  const savedOrder = layout.sectionOrder || [];
  const enabledSet = new Set(layout.sections || []);
  const allIds = SECTIONS.map(s => s.id);
  
  // Start with saved order (for sections that exist in SECTIONS)
  const fromSavedOrder = savedOrder.filter(id => allIds.includes(id));
  
  // Add any new sections not in saved order
  const notInOrder = allIds.filter(id => !savedOrder.includes(id));
  
  return [...fromSavedOrder, ...notInOrder];
}, [layout.sectionOrder, layout.sections, SECTIONS]);
```

**Update save logic to preserve order:**

```typescript
const handleSectionDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  const oldIndex = orderedSections.indexOf(active.id as string);
  const newIndex = orderedSections.indexOf(over.id as string);
  const newOrder = arrayMove(orderedSections, oldIndex, newIndex);
  
  // Save full order AND enabled sections
  const enabledSections = newOrder.filter(id => layout.sections.includes(id));
  saveLayout.mutate({ 
    ...layout, 
    sections: enabledSections,
    sectionOrder: newOrder 
  });
};
```

**Update toggle to preserve order:**

```typescript
const handleToggleSection = (sectionId: string) => {
  const sections = layout.sections.includes(sectionId)
    ? layout.sections.filter(s => s !== sectionId)
    : [...layout.sections, sectionId];
  
  // Preserve current order (don't remove from sectionOrder)
  saveLayout.mutate({ ...layout, sections, sectionOrder: orderedSections });
};
```

### File 3: `src/pages/dashboard/DashboardHome.tsx`

**Create section component map:**

```typescript
const sectionComponents: Record<string, React.ReactNode> = {
  quick_actions: showQuickActions && (
    <VisibilityGate elementKey="quick_actions">
      {/* Quick Actions content */}
    </VisibilityGate>
  ),
  command_center: isLeadership && <CommandCenterAnalytics />,
  operations_stats: (isReceptionist || isLeadership) && (
    <VisibilityGate elementKey="operations_quick_stats">
      <OperationsQuickStats hideRevenue={isFrontDesk && !isLeadership} />
    </VisibilityGate>
  ),
  todays_queue: isFrontDesk && (
    <VisibilityGate elementKey="todays_queue">
      <TodaysQueueSection />
    </VisibilityGate>
  ),
  quick_stats: hasStylistRole && (
    <VisibilityGate elementKey="quick_stats">
      {/* Quick stats grid */}
    </VisibilityGate>
  ),
  schedule_tasks: (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Schedule & Tasks */}
    </div>
  ),
  announcements: (
    <VisibilityGate elementKey="announcements">
      <AnnouncementsBento />
    </VisibilityGate>
  ),
  client_engine: hasStylistRole && (
    <VisibilityGate elementKey="client_engine">
      {/* Client Engine section */}
    </VisibilityGate>
  ),
  widgets: (
    <VisibilityGate elementKey="widget_section">
      <WidgetsSection />
    </VisibilityGate>
  ),
};
```

**Render sections in order:**

```typescript
{/* Dynamic sections based on layout order */}
{(layout.sectionOrder || layout.sections).map(sectionId => {
  // Only render if section is enabled
  if (!layout.sections.includes(sectionId)) return null;
  
  const component = sectionComponents[sectionId];
  if (!component) return null;
  
  return <React.Fragment key={sectionId}>{component}</React.Fragment>;
})}
```

---

## Data Migration Consideration

For existing users who don't have `sectionOrder` saved:
- Fall back to using `sections` as the order (all enabled sections)
- New sections will be appended at the end
- First time they reorder, the full `sectionOrder` will be saved

---

## Result

| Before | After |
|--------|-------|
| Today's Queue disappears when disabled | Today's Queue stays in drawer, just toggled off |
| Sections always render in hardcoded order | Sections render in user's saved order |
| Drawer shows enabled sections first | Drawer shows all sections in their order |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/hooks/useDashboardLayout.ts` | Add `sectionOrder` to interface, update parsing |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Update ordering logic to use `sectionOrder`, preserve order on toggle |
| `src/pages/dashboard/DashboardHome.tsx` | Refactor to render sections dynamically based on `layout.sectionOrder` |

