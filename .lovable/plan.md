

# Move Metrics Glossary from Navigation to System Settings Tab

## Overview

This plan moves the "Metrics Glossary" from the sidebar navigation (under Housekeeping) into the System settings section as a new tab. This consolidates system-level reference information into a single administrative location.

## Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/DashboardLayout.tsx` | Edit | Remove the Metrics Glossary nav link from `housekeepingNavItems` |
| `src/hooks/useSidebarLayout.ts` | Edit | Remove `/dashboard/metrics-glossary` from housekeeping section if present |
| `src/pages/dashboard/admin/Settings.tsx` | Edit | Add tabbed interface to System section with "Settings" and "Metrics Glossary" tabs |
| `src/components/dashboard/settings/MetricsGlossaryContent.tsx` | Create | Extract core glossary content (without DashboardLayout wrapper) for embedding in System settings |

## Implementation Details

### Step 1: Create Extracted Metrics Glossary Content

Create a new component `MetricsGlossaryContent.tsx` that contains the glossary UI without the `DashboardLayout` wrapper:

```text
src/components/dashboard/settings/MetricsGlossaryContent.tsx

- Extracts all content from MetricsGlossary.tsx
- Removes the <DashboardLayout> wrapper
- Keeps: search, category filter, DataHealthSection, accordion metrics display
- Exported for use in System settings tab
```

### Step 2: Update System Settings Section

Modify `Settings.tsx` to add a tabbed interface within the System category:

```text
activeCategory === 'system'

Current structure:
+------------------+
| APPEARANCE       |
| NOTIFICATIONS    |
| SECURITY         |
+------------------+

New structure with tabs:
+------------------------------------------+
| [Settings] [Metrics Glossary]            |  <- Tab bar
+------------------------------------------+
| Settings Tab (default):                   |
|   - Appearance Card                       |
|   - Notifications Card                    |
|   - Security Card                         |
|                                           |
| Metrics Glossary Tab:                     |
|   - Search & filter                       |
|   - Data Health Section                   |
|   - Metrics accordion by category         |
+------------------------------------------+
```

### Step 3: Remove from Sidebar Navigation

Edit `DashboardLayout.tsx` to remove the Metrics Glossary link:

```typescript
// Before (line 126-131)
const housekeepingNavItems: NavItem[] = [
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: Users, permission: 'view_onboarding' },
  { href: '/dashboard/handbooks', label: 'Handbooks', icon: FileText, permission: 'view_handbooks' },
  { href: '/dashboard/changelog', label: "What's New", icon: Sparkles },
  { href: '/dashboard/metrics-glossary', label: 'Metrics Glossary', icon: BookOpen },  // REMOVE
];

// After
const housekeepingNavItems: NavItem[] = [
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: Users, permission: 'view_onboarding' },
  { href: '/dashboard/handbooks', label: 'Handbooks', icon: FileText, permission: 'view_handbooks' },
  { href: '/dashboard/changelog', label: "What's New", icon: Sparkles },
];
```

### Step 4: Keep Route for Direct Access (Optional)

The `/dashboard/metrics-glossary` route in `App.tsx` can remain functional for backward compatibility or be redirected to the System settings with the Metrics Glossary tab pre-selected.

---

## Technical Details

### New Component Structure

**MetricsGlossaryContent.tsx:**
- Receives no props (self-contained with internal state)
- Uses same hooks: `useState`, `useMemo`
- Imports: `DataHealthSection`, `MetricCard`, `metricsGlossary` data
- Returns JSX without layout wrapper

### Tab Implementation in System Settings

Using the existing `Tabs` component from `@/components/ui/tabs`:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsGlossaryContent } from "@/components/dashboard/settings/MetricsGlossaryContent";

// Inside activeCategory === 'system' block:
<Tabs defaultValue="settings">
  <TabsList>
    <TabsTrigger value="settings">Settings</TabsTrigger>
    <TabsTrigger value="metrics">Metrics Glossary</TabsTrigger>
  </TabsList>
  
  <TabsContent value="settings">
    {/* Existing: Appearance, Notifications, Security cards */}
  </TabsContent>
  
  <TabsContent value="metrics">
    <MetricsGlossaryContent />
  </TabsContent>
</Tabs>
```

### Imports to Add in Settings.tsx

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsGlossaryContent } from "@/components/dashboard/settings/MetricsGlossaryContent";
```

---

## File Changes Summary

1. **Create** `src/components/dashboard/settings/MetricsGlossaryContent.tsx`
   - Copy content from `MetricsGlossary.tsx`
   - Remove `DashboardLayout` wrapper
   - Export as `MetricsGlossaryContent`

2. **Edit** `src/components/dashboard/DashboardLayout.tsx`
   - Remove line 130: `{ href: '/dashboard/metrics-glossary', label: 'Metrics Glossary', icon: BookOpen }`

3. **Edit** `src/pages/dashboard/admin/Settings.tsx`
   - Add `Tabs` import
   - Add `MetricsGlossaryContent` import
   - Wrap System section content in tabbed interface

4. **Optional** - The original `MetricsGlossary.tsx` page can remain for direct URL access or be modified to redirect to Settings

