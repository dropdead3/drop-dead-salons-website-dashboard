

## Remove All Breadcrumb Navigation

Since the app already has back/forward navigation buttons for easy movement between pages, breadcrumbs add unnecessary visual noise without providing unique value.

### Change

**File: `src/components/dashboard/DashboardLayout.tsx`** (lines 1256-1301)

Remove the entire breadcrumb rendering block — the self-invoking function that builds and displays the breadcrumb trail. This includes the route-specific exclusion we just added for website-sections, the crumb-building logic, and the rendered `<Breadcrumb>` component.

The `{children}` rendering and everything else around it stays intact.

### Result

- No breadcrumb bar on any dashboard page
- Cleaner vertical space across all admin/platform sub-pages
- Navigation handled entirely by the existing back/forward buttons

