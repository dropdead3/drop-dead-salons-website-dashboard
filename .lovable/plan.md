
# Filter Customize Dashboard Drawer by Role

## Overview

The Customize Dashboard drawer currently shows ALL possible sections regardless of the user's role. This creates confusion as users see options for sections they can't actually view (e.g., Front Desk seeing "Command Center" and "Client Engine" which are leadership/stylist-only).

The drawer should only display sections that are **actually visible** on the user's dashboard based on their role.

---

## Current Behavior

| Section | Front Desk | Stylist | Leadership |
|---------|-----------|---------|------------|
| Command Center | ❌ Hidden | ❌ Hidden | ✅ Visible |
| Quick Actions | ❌ Hidden | ✅ Visible | ✅ Visible |
| Quick Stats (personal) | ❌ Hidden | ✅ Visible | ❌ Hidden |
| Operations Quick Stats | ✅ Visible | ❌ Hidden | ✅ Visible |
| Today's Queue | ✅ Visible | ❌ Hidden | ❌ Hidden |
| Schedule & Tasks | ✅ Visible | ✅ Visible | ✅ Visible |
| Announcements | ✅ Visible | ✅ Visible | ✅ Visible |
| Client Engine | ❌ Hidden | ✅ Visible | ❌ Hidden |
| Widgets | ✅ Visible | ✅ Visible | ✅ Visible |

**Problem**: The drawer shows ALL 7 sections to every role.

---

## Solution

### Approach: Pass role context to DashboardCustomizeMenu

The customize menu needs access to the same role flags used in `DashboardHome.tsx` to filter which sections to display.

### File Changes

#### 1. `src/pages/dashboard/DashboardHome.tsx`

Pass role context to the customize menu:

```typescript
<DashboardCustomizeMenu 
  variant="button" 
  roleContext={{
    isLeadership,
    hasStylistRole,
    isFrontDesk,
    isReceptionist,
  }}
/>
```

#### 2. `src/components/dashboard/DashboardCustomizeMenu.tsx`

**Add role context interface:**

```typescript
interface RoleContext {
  isLeadership: boolean;
  hasStylistRole: boolean;
  isFrontDesk: boolean;
  isReceptionist: boolean;
}

interface DashboardCustomizeMenuProps {
  variant?: 'icon' | 'button';
  roleContext?: RoleContext;
}
```

**Update SECTIONS to include role visibility rules:**

```typescript
interface SectionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  // Role visibility function
  isVisible?: (ctx: RoleContext) => boolean;
}

const SECTIONS: SectionConfig[] = [
  { 
    id: 'quick_actions', 
    label: 'Quick Actions', 
    icon: <Sparkles className="w-4 h-4" />, 
    description: 'Shortcuts to common tasks',
    isVisible: (ctx) => ctx.hasStylistRole || !ctx.isLeadership,
  },
  { 
    id: 'command_center', 
    label: 'Command Center', 
    icon: <BarChart3 className="w-4 h-4" />, 
    description: 'Pinned analytics cards',
    isVisible: (ctx) => ctx.isLeadership,
  },
  { 
    id: 'operations_stats', 
    label: 'Operations Stats', 
    icon: <LayoutDashboard className="w-4 h-4" />, 
    description: 'Today\'s operations overview',
    isVisible: (ctx) => ctx.isReceptionist || ctx.isLeadership,
  },
  { 
    id: 'todays_queue', 
    label: 'Today\'s Queue', 
    icon: <Clock className="w-4 h-4" />, 
    description: 'Appointment queue',
    isVisible: (ctx) => ctx.isFrontDesk,
  },
  { 
    id: 'quick_stats', 
    label: 'Quick Stats', 
    icon: <LayoutDashboard className="w-4 h-4" />, 
    description: 'Today\'s performance overview',
    isVisible: (ctx) => !ctx.isLeadership,
  },
  { 
    id: 'schedule_tasks', 
    label: 'Schedule & Tasks', 
    icon: <Calendar className="w-4 h-4" />, 
    description: 'Daily schedule and to-dos',
    // Always visible
  },
  { 
    id: 'announcements', 
    label: 'Announcements', 
    icon: <Megaphone className="w-4 h-4" />, 
    description: 'Team updates and news',
    // Always visible
  },
  { 
    id: 'client_engine', 
    label: 'Client Engine', 
    icon: <Target className="w-4 h-4" />, 
    description: 'Drop Dead 75 program',
    isVisible: (ctx) => ctx.hasStylistRole,
  },
  { 
    id: 'widgets', 
    label: 'Widgets', 
    icon: <Armchair className="w-4 h-4" />, 
    description: 'Birthdays, anniversaries, etc.',
    // Always visible
  },
];
```

**Filter sections in component:**

```typescript
// Inside component, filter available sections
const availableSections = useMemo(() => {
  if (!roleContext) return SECTIONS; // Fallback to all
  
  return SECTIONS.filter(section => {
    // If no visibility rule, section is available to all
    if (!section.isVisible) return true;
    return section.isVisible(roleContext);
  });
}, [roleContext]);

// Update orderedSections to use availableSections
const orderedSections = useMemo(() => {
  const savedOrder = layout.sections || [];
  const availableIds = availableSections.map(s => s.id);
  
  // Enabled sections in saved order (that are available)
  const enabled = savedOrder.filter(id => availableIds.includes(id));
  
  // Disabled but available sections
  const disabled = availableIds.filter(id => !enabled.includes(id));
  
  return [...enabled, ...disabled];
}, [layout.sections, availableSections]);
```

**Update rendering to use availableSections:**

```typescript
{orderedSections.map(sectionId => {
  const section = availableSections.find(s => s.id === sectionId);
  if (!section) return null;
  // ... rest of rendering
})}
```

---

## Fallback Behavior

If `DashboardCustomizeMenu` is rendered without `roleContext` (e.g., from the icon variant), it will fall back to showing all sections. This maintains backwards compatibility.

However, since it's rendered in `DashboardHome` which has role context, it will correctly filter sections.

---

## Result

**Front Desk user will see:**
- Operations Stats
- Today's Queue  
- Schedule & Tasks
- Announcements
- Widgets

**Stylist will see:**
- Quick Actions
- Quick Stats
- Schedule & Tasks
- Announcements
- Client Engine
- Widgets

**Leadership will see:**
- Quick Actions (if also stylist)
- Command Center
- Operations Stats
- Schedule & Tasks
- Announcements
- Widgets

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardHome.tsx` | Pass `roleContext` prop to `DashboardCustomizeMenu` |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Add role filtering logic, update section configs with visibility rules |
