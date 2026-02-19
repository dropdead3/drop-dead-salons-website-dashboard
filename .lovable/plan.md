
## Show Main Nav Links as Standalone Icons When Collapsed

### Problem
When the sidebar is collapsed, all non-manager sections (main, growth, stats, adminOnly, platform) are grouped into a single icon per section that opens a popover menu. The user wants the **main section** links (Command Center, Team Chat) to remain as standalone, individually clickable icons with tooltips -- just like they appear in expanded mode, but icon-only.

### Change

**File: `src/components/dashboard/SidebarNavContent.tsx`** (lines ~632-714)

Update the rendering logic so that certain sections render individual `NavLink` icons when collapsed instead of grouping into a popover. Specifically, the `main` section will bypass the popover pattern and render each link as its own icon with a tooltip (using the existing `NavLink` component which already supports collapsed mode).

The updated conditional logic will be:

```text
if sectionId === 'manager'
  -> CollapsibleNavGroup (unchanged)
else if isCollapsed AND sectionId === 'main'
  -> render individual NavLink icons (same as expanded, just icon-only)
else if isCollapsed
  -> popover grouped pattern (unchanged for other sections)
else
  -> expanded NavLink list (unchanged)
```

This is a single condition change -- adding `sectionId === 'main'` to bypass the popover and fall through to the standard `NavLink` rendering. No new components, no layout changes. The `NavLink` component already renders correctly in collapsed mode (centered icon + right-side tooltip).

### Files Modified
- `src/components/dashboard/SidebarNavContent.tsx`
