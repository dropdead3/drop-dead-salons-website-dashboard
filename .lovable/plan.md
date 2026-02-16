

# Fix Category Avatar Font to Aeonik Pro

## Issue
The circular category avatar badges (showing abbreviations like "BL", "CO", "VI") are rendering in Termina (font-display) instead of Aeonik Pro (font-sans). This happens because the avatars don't explicitly set a font family, so they inherit from a parent using `font-display`.

## Changes

### File: `src/components/dashboard/settings/ServicesSettingsContent.tsx`

**1. Category color badge (line 254)** -- Add `font-sans` to the button class string:
- Change: `"w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ..."`
- To: `"w-10 h-10 rounded-full flex items-center justify-center text-xs font-sans font-medium shrink-0 ..."`

**2. Accordion category avatar (line 369)** -- Add `font-sans` to the div class string:
- Change: `"w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"`
- To: `"w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-sans font-medium shrink-0"`

## Result
Both sets of category avatars will render their abbreviation text in Aeonik Pro, matching the rest of the UI's body/label typography.

