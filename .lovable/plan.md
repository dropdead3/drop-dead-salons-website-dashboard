

# Add Banner Color Picker to Settings Page

## What's Missing
The announcement banner card on the Settings > General tab has all the text fields and a live preview, but is missing the **color picker** (preset swatches + custom hex input) that already exists in the Website Editor's `AnnouncementBarContent.tsx`.

## Changes

### File: `src/components/dashboard/settings/WebsiteSettingsContent.tsx`

1. **Add the `BANNER_COLOR_PRESETS` array and `isDarkColor` helper** at the top of the file (same ones used in `AnnouncementBarContent.tsx`) -- or import them from a shared location.

2. **Insert a "Banner Color" section** between the "Open link in new tab" toggle (line 231) and the save button (line 232). This section will include:
   - A label: "Banner Background Color"
   - A row of circular color swatches (the 9 presets: Default, Warm Sand, Soft Cream, Stone, Charcoal, Midnight, Blush, Sage, Slate Blue)
   - Each swatch shows a checkmark when selected
   - A custom hex color input with a native color picker alongside it

3. **No new files or dependencies** -- all logic is inline within the `GeneralTab` function, matching the existing pattern.

The live preview already reacts to `annLocal.bg_color` changes, so wiring up the color picker to `setAnnLocal(prev => ({ ...prev, bg_color: value }))` will instantly reflect in the preview below.

## Technical Detail

The color presets and dark-color detection logic will be duplicated from `AnnouncementBarContent.tsx`. This keeps each component self-contained and avoids over-abstracting for just two usages.

