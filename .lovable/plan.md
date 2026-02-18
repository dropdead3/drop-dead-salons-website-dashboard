

# Retail Store Configurator with Live Preview

## What This Delivers

A new "Store Appearance" card in the Retail tab that lets salon owners customize how their standalone retail store looks -- picking colors, fonts, and seeing a live preview of the store right in the settings page. This is specifically for salons running the standalone shop (without the full Zura website) who want to match their existing brand.

## How It Works

The Retail tab gets two new sections when the online store is enabled:

### 1. Store Appearance Configurator

A card titled "STORE APPEARANCE" with:

- **Color Theme Picker**: Choose from the 4 existing color themes (Cream, Rose, Sage, Ocean) as a base -- shown as selectable swatches
- **Custom Brand Colors**: Override specific CSS variables for the store:
  - Primary color (buttons, links, accents)
  - Background color
  - Card/surface color
  - Text color
- **Font Selection**: Dropdown to choose heading and body fonts from a curated list (the existing Aeonik Pro, Termina, plus web-safe alternatives like Inter, Playfair Display, etc.)
- **Logo Display**: Toggle whether to show the org logo in the store header

All settings are saved to a new `website_retail_theme` site setting (JSON in the existing `site_settings` table -- no schema migration needed).

### 2. Live Store Preview

An inline iframe preview below the configurator that:
- Loads the actual `/org/{slug}/shop` page in a scaled-down iframe
- Passes theme overrides via URL query params (e.g., `?preview_theme=...`) so the shop page can apply them in real-time
- Has desktop/mobile toggle buttons (reusing the pattern from `LivePreviewPanel`)
- Refreshes automatically when colors or fonts change
- Scaled to fit the settings panel (~50% scale for desktop, ~65% for mobile)

### 3. Shop Page Theme Application

The Shop page (`/org/:orgSlug/shop`) and `ShopLayout` are updated to:
- Read the `website_retail_theme` site setting (public read via existing RLS)
- Apply custom colors as CSS variable overrides on the store container
- Apply font overrides via inline style or class
- Support `?preview_theme=` query param for the live preview iframe (so changes appear before saving)

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/settings/StoreAppearanceConfigurator.tsx` | Create: color/font picker + live preview iframe |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Edit: render StoreAppearanceConfigurator in RetailTab when enabled |
| `src/hooks/useWebsiteSettings.ts` | Edit: add `WebsiteRetailThemeSettings` interface and hooks |
| `src/pages/Shop.tsx` | Edit: read retail theme settings and apply CSS overrides |
| `src/components/shop/ShopLayout.tsx` | Edit: accept and apply theme overrides (colors, fonts) |

## Technical Details

### Site Setting: `website_retail_theme`

Stored as JSON in the existing `site_settings` table (no migration needed -- just upsert a new row):

```text
{
  base_theme: "cream",
  custom_colors: {
    primary: "350 60% 55%",
    background: "350 30% 97%",
    card: "350 25% 95%",
    foreground: "350 25% 12%"
  },
  heading_font: "Termina",
  body_font: "Aeonik Pro",
  show_logo: true
}
```

### StoreAppearanceConfigurator Component

Contains:
1. A row of 4 theme swatches (Cream/Rose/Sage/Ocean) -- clicking one sets the base and auto-populates colors
2. Four color inputs for primary, background, card, foreground -- each with a color picker and HSL preview
3. Two font dropdowns (heading, body) from a curated list
4. A "Save Appearance" button
5. Below: a scaled iframe pointing to the store URL with `?preview_theme=<base64-encoded-JSON>` appended
6. Desktop/Mobile toggle for the iframe

### Preview Mechanism

The store page checks for a `preview_theme` URL param. If present, it decodes the JSON and applies those CSS variables to the store container div instead of reading from the database. This gives instant feedback without saving. When the user saves, the settings are persisted and the store reads from the database on normal loads.

### Font Loading

For fonts beyond the already-loaded Aeonik Pro/Termina, the store page dynamically loads Google Fonts via a link tag injection when a non-default font is selected.

### No Database Migration Needed

The `site_settings` table already supports arbitrary JSON values. We just upsert a new row with `id = 'website_retail_theme'`. The existing RLS policies on `site_settings` handle read/write access.

