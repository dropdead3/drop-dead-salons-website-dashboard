

## Fix Live Preview URL

The live preview iframe currently loads `/?preview=true`, which is the app's root route (likely the dashboard login or a blank page). The salon's public website actually lives at `/org/:orgSlug`, so the preview needs to point there.

### Changes

**1. `src/components/dashboard/website-editor/LivePreviewPanel.tsx`**

- Add a new prop `previewUrl` (optional string) to the component interface.
- Use `previewUrl` as the iframe `src` if provided, otherwise fall back to `/?preview=true`.

**2. `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`**

- Import `useOrganizationContext` to get the effective organization's slug.
- Build the preview URL as `/org/${slug}?preview=true`.
- Pass it to `<LivePreviewPanel previewUrl={previewUrl} />`.

### Result

The live preview will load the actual salon website landing page (`/org/your-salon`) instead of the root `/` route. The scroll-to-section and highlight messaging will continue to work since they use `postMessage` within the same origin.

