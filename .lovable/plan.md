

## Fix Resizable Panel Behavior in Website Editor

### Problem

The website editor uses three resizable panels (sidebar, editor, preview) inside a single `ResizablePanelGroup`. Two issues cause the strange resize behavior:

1. **Conditional rendering breaks panel tracking** -- When the sidebar toggles via `showSidebar`, panels mount/unmount inside the group. The `react-resizable-panels` library tracks panels by their order/count, so adding/removing a panel mid-session confuses the size calculations for remaining panels.

2. **No `collapsible` prop** -- Without `collapsible`, dragging a handle to its `minSize` creates a hard stop. The library then requires interacting with the *other* handle to redistribute space, which feels broken.

### Solution

Replace the conditional sidebar rendering with a `collapsible` panel that stays mounted. Use the `collapsedSize` and `onCollapse`/`onExpand` callbacks to sync with the existing `showSidebar` state. Also add `collapsible` to the preview panel for consistency.

### Technical Details

**File: `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`**

Changes to the `ResizablePanelGroup` block (lines 197-280):

1. Remove the `{showSidebar && !isMobile && (...)}` conditional wrapper around the sidebar panel
2. Instead, always render the sidebar `ResizablePanel` (on desktop) with these props:
   - `collapsible={true}`
   - `collapsedSize={0}`
   - `minSize={15}`
   - `defaultSize={showSidebar ? 20 : 0}`
   - `onCollapse={() => setShowSidebar(false)}`
   - `onExpand={() => setShowSidebar(true)}`
   - Use a `ref` to programmatically collapse/expand when the toggle button is clicked
3. Add `collapsible` to the preview panel as well so dragging it fully closed works smoothly
4. Update the sidebar toggle button to call `panelRef.current.collapse()` / `panelRef.current.expand()` instead of toggling state directly

This keeps all panels mounted at all times, which is how `react-resizable-panels` is designed to work. The library handles collapse/expand transitions smoothly, and both handles will function independently without interfering with each other.

