

## Remove Footer from Website Editor

The dashboard footer ("© 2026 DROP DEAD...") is showing at the bottom of the Website Editor because the page doesn't use the existing `hideFooter` prop on `DashboardLayout`.

### Change

**File: `src/pages/dashboard/admin/WebsiteSectionsHub.tsx`**

Change `<DashboardLayout>` to `<DashboardLayout hideFooter>`.

This is a one-word addition. The `hideFooter` prop already exists and is used by the Team Chat page. It removes the footer, sets the layout to `h-screen overflow-hidden` (full-height, no scroll), and hides contextual banners -- all of which are correct for a full-screen editor like this.

