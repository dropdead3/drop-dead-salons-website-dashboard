

## Unify Schedule Settings and Services Settings

### The Problem

Two separate settings pages manage the same `service_category_colors` table independently:

- **Schedule Settings** (`?category=schedule`): Category colors, drag-to-reorder, Theme Selector, Scheduling Blocks (Break/Block colors), Calendar Preview
- **Services Settings** (`?category=services`): Category colors, drag-to-reorder, CRUD (create/rename/delete categories), Services accordion with full CRUD, Add-Ons Library, Add-On Recommendations, Redo Policy

Changes made on one page are not reflected on the other until a hard refresh. More importantly, the Schedule page has a read-only view of categories while the Services page has full CRUD -- users don't know which is the "real" one.

### The Solution

Merge everything into a single **Services and Schedule** settings section. The Services page is the superset, so we absorb the three unique Schedule features into it.

### Unified Layout

Row 1 (2-column grid):
- **Left: Service Categories** -- existing card from Services, enhanced with the Theme Selector from Schedule added above the drag list
- **Right: Services** -- existing accordion card (unchanged)

Row 2 (2-column grid):
- **Left: Add-Ons Library** -- unchanged
- **Right: Add-On Recommendations** -- unchanged

Row 3 (2-column grid):
- **Left: Scheduling Blocks** -- moved from Schedule settings (Block/Break color pickers)
- **Right: Calendar Preview** -- moved from Schedule settings (live preview of color choices)

Row 4 (full width):
- **Redo and Adjustment Policy** -- unchanged

### What Changes

1. **ServicesSettingsContent.tsx**: Import and add three components from the Schedule page:
   - `ThemeSelector` -- placed inside the Service Categories card, between the card description and the drag list
   - Scheduling Blocks section -- rendered as a new card in row 3
   - `CalendarColorPreview` -- rendered as a new card in row 3

2. **ScheduleSettingsContent.tsx**: Kept as a thin redirect/alias. Its content will show a message: "These settings have moved" with a link to `?category=services`. This prevents confusion if anyone has bookmarked the old URL.

3. **ScheduleHeader.tsx**: Update the settings gear icon to navigate to `?category=services` instead of `?category=schedule`.

4. **Settings.tsx**: When `activeCategory === 'schedule'`, render a redirect notice pointing to the services tab (or auto-redirect).

### Technical Details

**Files to modify:**
- `src/components/dashboard/settings/ServicesSettingsContent.tsx` -- Add ThemeSelector import, CalendarColorPreview import, and Scheduling Blocks rendering logic. Build the `colorMap` (already exists in ScheduleSettingsContent) for the preview and theme selector. Add the scheduling categories filter (Block/Break) which currently only exists in ScheduleSettingsContent.
- `src/components/dashboard/settings/ScheduleSettingsContent.tsx` -- Replace with a minimal redirect component pointing users to the services tab.
- `src/components/dashboard/schedule/ScheduleHeader.tsx` -- Change navigation target from `?category=schedule` to `?category=services`.
- `src/pages/dashboard/admin/Settings.tsx` -- Auto-redirect `schedule` category to `services`.

**No database changes required.** Both pages already read from the same `service_category_colors` table. This is purely a UI consolidation.

**No new dependencies.** All components (ThemeSelector, CalendarColorPreview) already exist and just need to be imported into the unified page.

### What the User Gains

- Single source of truth for all service and scheduling configuration
- Theme Selector and Calendar Preview are now next to the actual category CRUD controls
- The gear icon on the Schedule page takes you directly to the right place
- No more confusion about which page to use for color changes
