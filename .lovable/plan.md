

# Default Email Accent Color from Organization Theme

## Problem
The email branding accent color defaults to a hardcoded `#6366F1` (indigo) regardless of the organization's selected color palette. It should instead reflect the active theme.

## Solution

Read the organization's active color theme (cream, rose, sage, ocean) and derive a sensible default accent color from it, so new organizations see a branded-feeling email configurator immediately.

## How It Works

The app stores the active color theme in `localStorage` under `dd-color-theme`. Each theme has a `--primary` CSS variable defined in `index.css` and preview colors defined in the `colorThemes` array in `useColorTheme.ts`.

We will:
1. Create a small mapping of theme-to-hex-accent-color (using each theme's characteristic color)
2. In `EmailBrandingSettings`, when no `email_accent_color` is saved yet, default to the theme-derived color instead of `#6366F1`

## Theme-to-Accent Mapping

| Theme | Accent Default | Rationale |
|-------|---------------|-----------|
| Cream | `#1A1A1A` (near-black) | Cream's primary is charcoal/black |
| Rose | `#DB5A6E` (blush pink) | Rose primary hue |
| Sage | `#4A9C6D` (sage green) | Sage primary hue |
| Ocean | `#3B82F6` (blue) | Ocean primary hue |

## File Changes

### `src/components/dashboard/settings/EmailBrandingSettings.tsx`

- Import `useColorTheme` or read `localStorage` for `dd-color-theme`
- Add a `THEME_ACCENT_DEFAULTS` map
- Change the fallback from `'#6366F1'` to `THEME_ACCENT_DEFAULTS[activeTheme]` when the org has no saved accent color
- This affects the initial `useState`, the `useEffect` seed, and the `hasChanges` comparison

### Technical Detail

The default only applies when `branding.email_accent_color` is `null` (no saved value). Once a user saves a custom accent, it persists as-is. The theme-derived default is purely for the initial experience before any explicit save.

