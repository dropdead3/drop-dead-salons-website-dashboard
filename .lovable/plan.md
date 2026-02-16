
# Kiosk Location Status Overview Card

## What This Adds

A new "Location Status" card at the very top of the Kiosk Settings page -- above the Location Selector -- that gives an at-a-glance matrix of every location, whether it has kiosk settings configured, and which features are enabled.

## Layout

```text
+----------------------------------------------------------+
| KIOSK STATUS BY LOCATION                                 |
| Overview of kiosk configuration across all locations     |
+----------------------------------------------------------+
| Location         | Check-In | Walk-In | Booking | Status |
|------------------|----------|---------|---------|--------|
| Downtown Salon   |   [ON]   |  [ON]   |  [OFF]  |  Live  |
| West Side Studio |   [ON]   |  [OFF]  |  [ON]   |  Live  |
| Midtown Branch   |    --    |   --    |   --    | No Config |
+----------------------------------------------------------+
|              [Apply Defaults to All Locations]            |
+----------------------------------------------------------+
```

### Row Logic

For each active location:
- If a row exists in `organization_kiosk_settings` for that `location_id`, show the feature flags from that row. Status = "Customized".
- If no row exists but org-level defaults exist (`location_id IS NULL`), show the org default values. Status = "Using Defaults".
- If no settings exist at all, show dashes. Status = "Not Configured".

### Feature Columns

| Column | Setting Field | Icon |
|--------|--------------|------|
| Check-In | Always on (core feature) | `UserCheck` |
| Walk-In | `enable_walk_ins` | `ClipboardCheck` |
| Self-Booking | `enable_self_booking` | `CalendarPlus` |
| Forms | `require_form_signing` | `FileSignature` |

Each cell shows a small colored dot: green for enabled, muted/gray for disabled.

### Row Click Action

Clicking a location row sets the Location Selector below to that location, scrolling the admin directly into editing that location's settings. This is a convenience shortcut.

### "Apply to All" Button

A single "Apply Defaults to All Locations" button at the bottom of the card. This reuses the existing `usePushDefaultsToAllLocations` hook with a confirmation dialog.

## Technical Details

**New file:** `src/components/dashboard/settings/KioskLocationStatusCard.tsx`
- A standalone card component that takes `orgId` as a prop
- Fetches all active locations via `useLocations()`
- Fetches all kiosk settings rows for the org (one query: `organization_kiosk_settings` where `organization_id = orgId`)
- Merges: for each location, finds its specific row or falls back to the org default row
- Renders a table with feature status dots and a status badge
- Accepts an `onLocationSelect` callback to wire up the row-click behavior

**Modified file:** `src/components/dashboard/settings/KioskSettingsContent.tsx`
- Import and render `KioskLocationStatusCard` as the first card on the page (above the Location Selector card)
- Pass `onLocationSelect` that sets the `locationId` state and scrolls to the settings section
- No other changes to existing logic

**New hook (inside existing file):** `src/hooks/useKioskSettings.ts`
- Add `useAllOrgKioskSettings(organizationId)` -- fetches ALL rows from `organization_kiosk_settings` for the given org in one query (both org-level defaults and all location overrides). Returns the full array for the status card to merge against the locations list.

No database changes required. All data already exists.
