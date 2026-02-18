

## Hide Breadcrumb Navigation on Website Editor

The breadcrumb bar ("Dashboard > Admin > Website Sections") is rendered by the `DashboardLayout` component for all routes with depth greater than 2. Since the Website Editor has its own full header with title and navigation, this breadcrumb is redundant and wastes vertical space.

### Approach

Add the `website-sections` route to an exclusion list in the `DashboardLayout` breadcrumb rendering logic. This is a single, surgical change.

### Technical Details

**File: `src/components/dashboard/DashboardLayout.tsx`** (around line 1256-1258)

Currently, the breadcrumb renders for any dashboard route with more than 2 path segments:

```
if (parts[0] !== 'dashboard' || parts.length <= 2) return null;
```

We will add an additional check to skip breadcrumbs when the path matches `/dashboard/admin/website-sections`:

```
if (parts[0] !== 'dashboard' || parts.length <= 2) return null;
if (location.pathname.startsWith('/dashboard/admin/website-sections')) return null;
```

This keeps the breadcrumb visible on all other admin pages while hiding it on the Website Editor where it's not needed.

