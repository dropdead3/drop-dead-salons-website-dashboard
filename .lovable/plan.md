
# Add Tabs to Email Settings Page

## Overview
Replace the current vertical stack of cards in the Email settings section with a tabbed interface. Each section becomes its own tab for cleaner navigation and less scrolling.

## What Changes

### File: `src/pages/dashboard/admin/Settings.tsx`

Replace the `activeCategory === 'email'` block (lines 924-957) with a `Tabs` component containing four tabs:

1. **Branding** -- renders `EmailBrandingSettings`
2. **Templates** -- renders `EmailTemplatesManager` inside a Card
3. **Variables** -- renders `EmailVariablesManager` inside a Card
4. **Signatures** -- renders `SignaturePresetsManager` inside a Card

Uses the existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` components already imported on line 96, following the standardized tab bar tokens (h-11, borderRadius 9/6, glass active state).

## Technical Details

- No new files or dependencies needed
- All components (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) are already imported in Settings.tsx
- Default tab will be "branding"
- Each `TabsContent` wraps the existing card content, keeping current styling intact
- Follows the project's tab-bar-standardization pattern (ResponsiveTabsList not needed here since only 4 tabs)
