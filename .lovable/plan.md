
# Two-Column Layout: Settings + Sticky Preview

## Change

Restructure the `KioskLocationSettingsForm` return block from a single-column `space-y-6` layout into a two-column grid where:

- **Left column**: Features, Settings Tabs, Action Buttons, Deploy QR (all existing content)
- **Right column**: Live Preview panel, sticky on scroll so it stays visible while scrolling through settings

## Technical Details

**File: `src/components/dashboard/settings/KioskLocationSettingsForm.tsx`**

1. Replace the outer `<div className="space-y-6">` wrapper (line 346) with a two-column grid:
   ```
   <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(320px,1fr)] gap-6">
   ```

2. Wrap Features + Tabs + Action Buttons + Deploy QR in a `<div className="space-y-6">` (left column)

3. Move the Live Preview out of the left column flow and into the right column wrapped in:
   ```
   <div className="sticky top-4 self-start">
   ```
   Remove the `Collapsible` wrapper since the preview is now always visible in its own column. Keep the "Expand" button for opening the full Sheet.

4. On smaller screens (`< lg`), it collapses back to single column with the preview below the settings (natural stacking).

This is a layout-only change within the return statement -- no logic, state, or props change.
