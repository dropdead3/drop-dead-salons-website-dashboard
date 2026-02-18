

# Widen Website Editor Sidebar Panel

## Problem
The Website Editor sidebar is set to `defaultSize={20}` (20% of the panel group width), which is too narrow to display the section labels, descriptions, and toggle switches without clipping. The toggle switches on the right edge of the "Homepage Layout" rows are being cut off.

## Change

**File: `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`**

- Increase the sidebar `ResizablePanel` from `defaultSize={20}` to `defaultSize={25}`
- Increase `minSize` from `15` to `20` so the sidebar can never be shrunk to a point where content is hidden
- Adjust the main editor panel's `defaultSize` from `80` to `75` to compensate

This gives the sidebar roughly 25% more space, enough to comfortably fit the section names, order badges, and toggle switches without any overflow.

