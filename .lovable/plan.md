
# Add Drag-and-Drop Reordering to Dashboard Customization

## Overview

This feature adds the ability for users to drag-and-drop sections and widgets in the Customize Dashboard panel to reorder how they appear on their dashboard. The order will be persisted alongside visibility settings.

---

## Current State

| Component | Current Behavior |
|-----------|------------------|
| `DashboardCustomizeMenu` | Toggle sections/widgets on/off only |
| `DashboardHome` | Sections rendered in hardcoded order, ignores `layout.sections` order |
| `layout.sections` array | Controls visibility (by inclusion) but order not utilized |

---

## Solution Architecture

### Part 1: Add Drag-and-Drop to Customize Menu

Update `DashboardCustomizeMenu.tsx` to use `@dnd-kit` for sortable sections and widgets.

**Create a new sortable item component:**

```text
src/components/dashboard/SortableSectionItem.tsx

- Uses useSortable hook from @dnd-kit/sortable
- Displays drag handle (GripVertical icon)
- Contains section icon, label, description
- Contains visibility Switch
- Applies transform styles when dragging
```

**Update `DashboardCustomizeMenu.tsx`:**

```text
- Import DndContext, SortableContext from @dnd-kit/core
- Import sensors (PointerSensor, KeyboardSensor)
- Wrap sections list in DndContext + SortableContext
- Wrap widgets list in separate DndContext + SortableContext
- Add onDragEnd handlers that use arrayMove to reorder
- Save reordered arrays to layout via useSaveDashboardLayout
```

### Part 2: Render Dashboard Sections by Saved Order

Update `DashboardHome.tsx` to render sections based on the order in `layout.sections`.

**Approach: Create section component map**

```typescript
const SECTION_COMPONENTS = {
  quick_actions: QuickActionsSection,
  command_center: CommandCenterSection,
  quick_stats: QuickStatsSection,
  schedule_tasks: ScheduleTasksSection,
  announcements: AnnouncementsSection,
  client_engine: ClientEngineSection,
  widgets: WidgetsSection,
};

// Render in order
{layout.sections.map(sectionId => {
  const SectionComponent = SECTION_COMPONENTS[sectionId];
  if (!SectionComponent) return null;
  return <SectionComponent key={sectionId} />;
})}
```

This requires extracting some inline sections into components for cleaner organization.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/SortableSectionItem.tsx` | Create | Reusable sortable item with drag handle and toggle |
| `src/components/dashboard/SortableWidgetItem.tsx` | Create | Similar sortable item for widgets |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Edit | Add DndContext, SortableContext, sensors, onDragEnd handlers |
| `src/pages/dashboard/DashboardHome.tsx` | Edit | Render sections dynamically based on layout.sections order |

---

## Technical Implementation Details

### SortableSectionItem Component

```typescript
interface SortableSectionItemProps {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  onToggle: () => void;
}

export function SortableSectionItem({ id, label, description, icon, isEnabled, onToggle }: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      'flex items-center justify-between p-3 rounded-lg transition-colors',
      isEnabled ? 'bg-muted/50' : 'bg-transparent',
      isDragging && 'opacity-50 shadow-lg z-50'
    )}>
      {/* Drag Handle */}
      <button {...attributes} {...listeners} className="touch-none mr-2 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      
      {/* Icon + Label */}
      <div className="flex items-center gap-3 flex-1">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      
      {/* Toggle */}
      <Switch checked={isEnabled} onCheckedChange={onToggle} />
    </div>
  );
}
```

### DashboardCustomizeMenu Updates

```typescript
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// Sensors setup
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

// Get ordered sections (merge saved order with available sections)
const orderedSections = useMemo(() => {
  const savedOrder = layout.sections;
  const allIds = SECTIONS.map(s => s.id);
  
  // Sections in saved order that still exist
  const ordered = savedOrder.filter(id => allIds.includes(id));
  
  // Add any new sections not in saved order
  const missing = allIds.filter(id => !ordered.includes(id));
  
  return [...ordered, ...missing];
}, [layout.sections]);

// Drag end handler
const handleSectionDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  const oldIndex = orderedSections.indexOf(active.id as string);
  const newIndex = orderedSections.indexOf(over.id as string);
  const newOrder = arrayMove(orderedSections, oldIndex, newIndex);
  
  // Filter to only enabled sections for persistence
  const enabledSections = newOrder.filter(id => layout.sections.includes(id));
  saveLayout.mutate({ ...layout, sections: enabledSections });
};

// In JSX:
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
  <SortableContext items={orderedSections} strategy={verticalListSortingStrategy}>
    {orderedSections.map(sectionId => {
      const section = SECTIONS.find(s => s.id === sectionId);
      if (!section) return null;
      return (
        <SortableSectionItem
          key={section.id}
          id={section.id}
          label={section.label}
          description={section.description}
          icon={section.icon}
          isEnabled={layout.sections.includes(section.id)}
          onToggle={() => handleToggleSection(section.id)}
        />
      );
    })}
  </SortableContext>
</DndContext>
```

### DashboardHome Dynamic Rendering

**Extract sections into components for cleaner code:**

```typescript
// Define section render functions
const renderSection = (sectionId: string) => {
  switch (sectionId) {
    case 'quick_actions':
      if (!showQuickActions) return null;
      return (
        <VisibilityGate key={sectionId} elementKey="quick_actions">
          {/* Quick Actions JSX */}
        </VisibilityGate>
      );
    case 'command_center':
      if (!isLeadership) return null;
      return <CommandCenterAnalytics key={sectionId} />;
    // ... other cases
  }
};

// In render:
{layout.sections.map(sectionId => renderSection(sectionId))}
```

---

## User Experience

```text
BEFORE:
+---------------------------+
|  Quick Actions    [toggle]|
|  Command Center   [toggle]|
|  Quick Stats      [toggle]|
+---------------------------+

AFTER:
+---------------------------+
| ⠿ Quick Actions   [toggle]|  <- Drag handle on left
| ⠿ Command Center  [toggle]|
| ⠿ Quick Stats     [toggle]|
+---------------------------+

User can drag "Quick Stats" above "Command Center" and it will
render in that order on the dashboard.
```

---

## Data Model

The `layout.sections` array already stores section IDs. Currently it only controls **visibility** (sections in the array are shown). After this change:

- **Array order** = display order on dashboard
- **Array inclusion** = visibility (unchanged)

Example:
```json
{
  "sections": ["quick_stats", "quick_actions", "announcements", "widgets"],
  "widgets": ["birthdays", "schedule", "changelog"],
  "pinnedCards": [],
  "hasCompletedSetup": true
}
```

---

## Notes

- The drag-and-drop uses the existing `@dnd-kit` library already installed
- Widget reordering follows the same pattern as sections
- The `WidgetsSection` component already reads `layout.widgets` order, so widget reordering will work with minimal changes
- Dashboard layout persistence uses the existing `useSaveDashboardLayout` hook
