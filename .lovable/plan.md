

## Reduce Fixed Sidebar Width

The sidebar was set to `w-[420px]` which is wider than needed for its content. It should be reduced to approximately `w-[320px]` to match the natural width of the sidebar content.

### Change

**File: `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`**

Update the sidebar container class from `w-[420px]` to `w-[320px]`.

One line change — the `div` wrapping `WebsiteEditorSidebar`.

