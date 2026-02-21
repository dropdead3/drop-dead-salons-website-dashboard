

## Bento-ize Services Settings Page

### Layout Change

Reorganize from a single-column stack into a responsive two-column bento grid:

```text
Desktop (lg+):
+---------------------------+---------------------------+
|   SERVICE CATEGORIES      |       SERVICES            |
|   (color/order editor)    |   (accordion list)        |
+---------------------------+---------------------------+
|   SERVICE ADD-ONS         |  BOOKING ADD-ON           |
|   (library)               |  RECOMMENDATIONS          |
+---------------------------+---------------------------+

Mobile (< lg):
Single column, all four cards stacked vertically
```

### Technical Details

**File:** `src/components/dashboard/settings/ServicesSettingsContent.tsx`

1. Replace the outer `<div className="space-y-6">` with a responsive bento grid: `grid grid-cols-1 lg:grid-cols-2 gap-4`
2. Row 1: Service Categories card + Services card side-by-side on desktop, stacked on mobile
3. Row 2: Service Add-Ons card + Booking Add-On Recommendations card side-by-side on desktop, stacked on mobile
4. Dialog elements (ServiceEditorDialog, CategoryFormDialog, AlertDialogs) remain outside the grid -- they are portaled overlays and unaffected by layout

This follows the established settings interface standard (`grid-cols-1 lg:grid-cols-2`) documented in `settings-interface-standards` memory.

