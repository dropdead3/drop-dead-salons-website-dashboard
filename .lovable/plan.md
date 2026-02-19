
## Lock Sidebar to Fixed Width

The sidebar panel will be pulled out of the `ResizablePanelGroup` entirely and rendered as a fixed-width element. This removes the left resize handle and ensures the sidebar always stays at the same width. Only the editor and preview panels remain resizable.

### Technical Details

**File: `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`**

1. Move the sidebar out of the `ResizablePanelGroup` and render it as a fixed-width `div` (approximately `w-[420px]`) with `flex-shrink-0`, sitting to the left of the `ResizablePanelGroup` in a flex container.

2. Remove the `ResizableHandle` between the sidebar and editor since the sidebar is no longer resizable.

3. Remove `sidebarPanelRef`, `collapsible`, and related panel props since they're no longer needed for a fixed div.

4. Update the sidebar toggle button to simply show/hide the fixed-width div (back to the simple `showSidebar` boolean toggle).

5. The `ResizablePanelGroup` will now only contain the editor panel and the preview panel (with one resize handle between them), which keeps the editor/preview resizing functional.

### Layout Structure (Desktop)

```text
+------------------+-------------------------------+
| Fixed sidebar    | ResizablePanelGroup           |
| w-[420px]        | [Editor] <handle> [Preview]   |
| (toggle on/off)  |                               |
+------------------+-------------------------------+
```

This matches the width shown in the screenshot and makes the sidebar permanently that size.
