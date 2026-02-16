

# Redesign: Location-Centric Kiosk Settings with Expandable Drill-Downs

## The Problem

The current layout has three disconnected sections:
1. A status table listing all locations
2. A separate "Configure Location" card with a dropdown selector
3. A "Kiosk Features" card and then a settings form + preview grid below

You have to mentally carry which location you picked in the dropdown through all of these sections. The editing context is buried in small text badges ("Editing: Location Name") that are easy to miss.

## The Solution: Accordion-Style Location Rows

Replace the dropdown-based flow with the location status table becoming the primary navigation. Each location row expands inline to reveal its settings, features, and preview -- so the editing context is always visually obvious.

### New Page Layout (top to bottom)

1. **Organization Defaults Card** -- A single card at the top for editing org-wide defaults (the "all locations" case). Contains the same Appearance/Content/Behavior tabs, but clearly labeled as the baseline. Collapsible so it stays out of the way when editing a specific location.

2. **Locations Table with Expandable Rows** -- The existing `KioskLocationStatusCard` table becomes the primary interface. Each row shows: Location Name, Device Status, Feature Dots, Config Status (same as today). Clicking a row expands it inline (using framer-motion or Accordion) to reveal:
   - A horizontal feature toggles strip (Walk-In, Self-Booking, Forms, Feedback)
   - The tabbed settings form (Appearance / Content / Behavior)
   - A "Preview" button that opens the live preview in a side sheet or dialog
   - Deploy QR code section
   - "Reset to Defaults" and "Apply to All" action buttons

3. **Only one row can be expanded at a time** -- clicking a different location collapses the current one and expands the new one. This enforces clarity about which location is being edited.

## Detailed Changes

### 1. Refactor KioskLocationStatusCard into an expandable component

**File: `src/components/dashboard/settings/KioskLocationStatusCard.tsx`**

- Add state: `expandedLocationId: string | null`
- When a row is clicked, toggle its expansion instead of calling `onLocationSelect`
- Below the table row, render an animated expandable panel containing:
  - Feature toggle strip (the toggle cards currently in "Kiosk Features" card)
  - Tabbed settings form (extracted from KioskSettingsContent)
  - Preview button (opens KioskPreviewPanel in a Sheet/Dialog)
  - Deploy + action buttons
- The expanded section gets a clear visual indicator: left border accent, slightly indented, with the location name prominently displayed at the top

### 2. Extract settings form into a reusable component

**New file: `src/components/dashboard/settings/KioskLocationSettingsForm.tsx`**

Extract lines ~780-1415 from KioskSettingsContent (the settings Card with tabs + save/reset/push buttons) into a standalone component that accepts:
- `locationId: string`
- `orgId: string`
- `onPreviewOpen: () => void` (to trigger preview sheet)

This keeps the form logic self-contained and reusable for both the org defaults card and each location's expandable row.

### 3. Extract feature toggles into a reusable component

**New file: `src/components/dashboard/settings/KioskFeatureToggles.tsx`**

Extract lines ~556-776 (the "Kiosk Features" card content) into a component that accepts `localSettings` and `updateField` -- so it can be rendered inside each expanded location row.

### 4. Simplify KioskSettingsContent as the page orchestrator

**File: `src/components/dashboard/settings/KioskSettingsContent.tsx`**

- Remove the "Configure Location" dropdown card entirely
- Remove the "Kiosk Features" standalone card
- Remove the settings form + preview grid
- Replace with:
  1. An "Organization Defaults" collapsible card using `KioskLocationSettingsForm` with `locationId=null`
  2. The enhanced `KioskLocationStatusCard` which now handles everything per-location

### 5. Preview becomes a Sheet or Dialog triggered from each row

Instead of a sticky side panel (which only makes sense for a single editing context), the preview opens on demand via a button inside each expanded location row. This keeps the page layout simple and single-column friendly.

**Reuse existing pattern**: The `KioskPreviewPanel` stays as-is but gets rendered inside a `Sheet` (side panel) when the user clicks "Preview" on a location row.

## Visual Structure (Expanded Row)

```text
+------------------------------------------------------------------+
| Downtown Salon        [Online]  * * * *    Customized             |
+------------------------------------------------------------------+
|  +--------------------------------------------------------------+|
|  | FEATURES                                                      ||
|  | [x] Walk-In   [x] Self-Booking   [ ] Forms   [ ] Feedback    ||
|  +--------------------------------------------------------------+|
|  |                                                                ||
|  | [Appearance] [Content] [Behavior]     <- tabs                  ||
|  |                                                                ||
|  |  Display Mode: [Light] [Dark] [Auto]                           ||
|  |  Orientation:  [Portrait] [Landscape]                          ||
|  |  Colors...                                                     ||
|  |  ...                                                           ||
|  |                                                                ||
|  |  [Save Changes]  [Reset to Defaults]  [Preview ->]  [Deploy]  ||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
| Uptown Studio         [Offline]  * * - -   Using Defaults         |
+------------------------------------------------------------------+
| Westside Location     [Online]   * - - -   Not Configured         |
+------------------------------------------------------------------+
```

## Benefits

- **Zero ambiguity**: The settings are physically nested inside the location row
- **Familiar pattern**: Matches the expandable location interface already used in analytics cards
- **Cleaner page**: No separate dropdown card, features card, or two-column grid needed
- **Mobile-friendly**: Single column that expands inline works on all screen sizes
- **Consistent with Zura patterns**: Matches the accordion/drill-down pattern from the analytics location breakdowns

## Implementation Sequence

1. Create `KioskFeatureToggles.tsx` (extract from KioskSettingsContent)
2. Create `KioskLocationSettingsForm.tsx` (extract from KioskSettingsContent)
3. Refactor `KioskLocationStatusCard.tsx` to support expandable rows with embedded settings
4. Simplify `KioskSettingsContent.tsx` to orchestrate the new layout
5. Wire up preview as a Sheet/Dialog triggered per-location

