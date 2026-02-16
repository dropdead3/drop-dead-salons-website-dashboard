
# Kiosk Settings -- Per-Location Features + UX Cleanup

## Problem

The Kiosk Features card sits above the Location Selector, so an admin toggles features without knowing which location they're configuring. "Apply to All Locations" is buried at the bottom of the page. Several small UI redundancies exist.

## Changes

### 1. Move Location Selector to the Top

The location selector card (currently the second card, lines 616-663) moves to become the FIRST card on the page -- above Kiosk Features. This establishes context before any configuration happens.

Add an "Apply to All Locations" button directly in the location selector card header (right-aligned). This makes the propagation action immediately visible without scrolling to the bottom.

When a specific location is selected, show an inline badge: "Editing: [Location Name]" with a "Customized" or "Using Defaults" indicator.

### 2. Add Location Context to Features Card

Add a subtle banner at the top of the Kiosk Features card showing which location is being configured:
- "Organization Defaults" when editing defaults
- "[Location Name]" when editing a specific location
- Include a small "Using org defaults" or "Custom overrides" indicator

This prevents the admin from accidentally toggling features for the wrong location.

### 3. Move "Apply to All" Into Location Selector

Remove the "Push Defaults to All Locations" and "Push Location Settings to All" buttons from the save section at the bottom. Instead, place them in the location selector card:
- When on "Organization Defaults": show "Apply Defaults to All Locations" button (replaces overrides)
- When on a specific location: show "Apply This Location's Settings to All" button

Keep "Reset to Organization Defaults" in the save section since it's a per-location action.

### 4. Fix Button Style Placement

Move the "Button Style" dropdown out of the color pickers grid (where it gets incorrectly dimmed when using a theme preset). Place it as a standalone control in the Appearance tab, below the color section.

### 5. Consolidate Behavior Tab

The Behavior tab currently has only Idle Timeout and Exit PIN. Move Exit PIN into a "Security" sub-section and add a descriptive note about where feature-specific behavior is configured (the Features card above).

## Technical Details

**File modified:** `src/components/dashboard/settings/KioskSettingsContent.tsx`

### Specific changes:

1. **Reorder cards** -- Move the location selector JSX block (lines 616-663) above the Kiosk Features card (lines 411-614). Add a right-aligned "Apply to All Locations" button with confirmation dialog in the card header.

2. **Add location context banner** inside the Kiosk Features CardHeader -- a small `<p>` tag showing "Configuring: [Organization Defaults | Location Name]" with a badge indicating override status.

3. **Remove duplicate "Push" buttons** from the save section (lines 1244-1312). The "Push Defaults to All" and "Push Location to All" actions move into the location selector card. Only "Reset to Org Defaults" remains in the save section.

4. **Fix button style placement** -- Move the Button Style `<Select>` (lines 882-896) out of the `grid grid-cols-2` color picker container. Place it as standalone control below the color grid, outside the opacity wrapper so it's not affected by theme preset dimming.

5. **Behavior tab cleanup** -- Add a brief info note: "Feature-specific settings are configured in the Kiosk Features section above." This prevents confusion about why the tab is sparse.

No database changes, no hook changes, no new files. The `usePushDefaultsToAllLocations` and `usePushLocationSettingsToAll` hooks remain unchanged -- only the UI location of their trigger buttons moves.
