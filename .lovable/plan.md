

# Remove Inline Live Preview from Website Editor

## What Changes
Remove the resizable live preview panel from the Website Editor page (`WebsiteSectionsHub.tsx`). The "Preview" button in the header already exists and can be repurposed to open the site in a new tab or kept as-is for a future drawer implementation. The inline iframe preview panel will be fully removed.

## Specific Changes

### File: `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`

1. **Remove the `LivePreviewPanel` import** (line 33)
2. **Remove `showPreview` state** (line 102) -- no longer needed
3. **Remove the preview toggle button** from the header (lines 168-184) -- replace with just the "Open Site" button, or convert to a simple external link
4. **Remove the conditional `ResizablePanel`** block that renders the `LivePreviewPanel` (lines 210-218)
5. **Simplify the main panel** `defaultSize` -- remove the ternary `showPreview ? 50 : 80` and just use `80` (line 135)
6. **Clean up unused imports** -- remove `PanelRightClose`, `PanelRightOpen` from lucide imports since they're only used by the preview toggle button

### What Stays
- The "Open Site" button (opens site in a new tab) remains
- The sidebar toggle and all editor content remain unchanged
- The `LivePreviewPanel` component file itself is kept (it's used in `WebsiteSettingsContent.tsx`)

