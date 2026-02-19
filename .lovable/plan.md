
## Collapsed Sidebar: Show Section Icons Only with Popover Menus

### Problem
When the sidebar is collapsed, every single nav link renders as an individual icon, creating a long, cluttered vertical list of 25+ icons (as seen in the screenshot). This defeats the purpose of collapsing the sidebar.

### Solution
In collapsed mode, show only one icon per section (and one per management sub-group). Clicking a section icon opens a popover/flyout menu listing the links inside with their icons and labels.

### How It Will Work

**Expanded sidebar (no change):**
- Sections with headers, collapsible sub-groups, individual links -- all unchanged.

**Collapsed sidebar (new behavior):**
- Each section renders as a single icon with a tooltip showing the section name.
- Clicking the section icon opens a Popover to the right showing all links in that section with their icon and label.
- The active link is highlighted inside the popover.
- If any link in the section is active, the section icon itself gets a subtle active indicator.

### Section Icon Mapping

| Section | Icon | Label |
|---------|------|-------|
| Main | LayoutDashboard | Main |
| Growth & Development | Rocket | Growth & Development |
| My Performance | BarChart3 | My Performance |
| Management > Team Tools | Briefcase | Team Tools |
| Management > Analytics | TrendingUp | Analytics & Insights |
| Management > People | Users | People |
| Management > Operations | LayoutGrid | Operations |
| Control Center | Shield | Control Center |

### Technical Changes

**1. `src/hooks/useSidebarLayout.ts`** -- Export section icon mapping

Add a `SECTION_ICONS` record mapping section IDs to their Lucide icons, so both `SidebarNavContent` and `CollapsibleNavGroup` can use it.

```typescript
export const SECTION_ICONS: Record<string, LucideIcon> = {
  main: LayoutDashboard,
  growth: Rocket,
  stats: BarChart3,
  manager: Briefcase,
  adminOnly: Shield,
};
```

**2. `src/components/dashboard/CollapsibleNavGroup.tsx`** -- Replace flat icon list with popover icons

The collapsed branch (lines 156-165) currently flattens all sub-group items into individual icons. Replace with:

- Render one icon per visible group (e.g., Team Tools, Analytics, People, Operations).
- Each icon is wrapped in a Popover.
- Clicking opens a right-aligned popover listing that group's links (icon + label).
- Active link highlighted; active group icon gets a dot or background indicator.

```tsx
// Collapsed: show group icons with popover menus
if (isCollapsed) {
  return (
    <div className="space-y-1">
      {visibleGroups.map((group) => {
        const GroupIcon = group.icon;
        const active = isGroupActive(group);
        const items = getVisibleItems(group.items);
        return (
          <Popover key={group.id}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center justify-center px-2 py-2 mx-2 rounded-lg w-[calc(100%-16px)]",
                "transition-all duration-200 text-sm",
                active
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}>
                <GroupIcon className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-1">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              {items.map(item => (
                <NavLink key={item.href} item={item} /* renders as popover menu item */ />
              ))}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
```

**3. `src/components/dashboard/SidebarNavContent.tsx`** -- Section-level popover for non-manager sections

For non-manager sections in collapsed mode, instead of rendering each link as an individual icon, render a single section icon with a Popover.

In the `sectionOrder.map()` block (around line 615-657), update the collapsed rendering:

```tsx
// When collapsed and not manager section, show single section icon with popover
if (isCollapsed && sectionId !== 'manager') {
  const SectionIcon = SECTION_ICONS[sectionId] || LayoutDashboard;
  const isAnyActive = filteredItems.some(item => location.pathname === item.href);
  
  return (
    <div key={sectionId}>
      {index > 0 && (
        <div className="px-2 my-2">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center justify-center px-2 py-2 mx-2 rounded-lg",
            "transition-all duration-200 text-sm w-[calc(100%-16px)]",
            isAnyActive
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}>
            <SectionIcon className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-56 p-1">
          <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {sectionLabel}
          </p>
          {filteredItems.map(item => (
            /* NavLink rendered in popover-menu style */
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

**4. Popover menu item styling**

Links inside the popover will use a clean menu-item style:
- Full width, left-aligned with icon + label
- Hover state with `bg-muted/60`
- Active state with `bg-foreground text-background`
- Clicking navigates and closes the popover

### Result
- Collapsed sidebar shrinks from 25+ icons down to roughly 8 section/group icons
- Each icon is clearly identifiable as a section
- Clicking opens a clean flyout menu with the section's links
- Active states carry through from links to section icons
