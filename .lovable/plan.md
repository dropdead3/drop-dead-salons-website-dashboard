
# Move Settings from Sticky Footer to Regular Nav

## What Changes

The "Settings" link currently lives in the special sticky footer section (the rounded card at the bottom with Clock In and Lock Dashboard). It will be moved out of that special section and into the regular navigation — specifically added to the **Access & Permissions** section, since Settings is an admin-level page gated by the same `manage_settings` permission.

The sticky footer card will then only contain **Clock In** and **Lock Dashboard**.

## Technical Details

**File: `src/components/dashboard/DashboardLayout.tsx`**
- Remove Settings from `footerNavItems` array (make it empty or remove entirely)
- Add the Settings nav item to `adminOnlyNavItems` so it appears alongside "Access & Permissions Hub"

**File: `src/components/dashboard/SidebarNavContent.tsx`**
- Clean up: if `footerNavItems` becomes empty, skip rendering the footer nav links loop (the Clock In and Lock Dashboard buttons remain)
- No structural changes needed — the existing section rendering handles adminOnly items automatically

## Result

- Settings appears as a regular nav link under "Access & Permissions" in the scrollable sidebar
- The sticky footer card is simplified to just Clock In + Lock Dashboard
- Settings still respects the `manage_settings` permission filter
