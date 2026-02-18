

# Transform Website Settings into a Full Theme Management System

## The Problem

The current "Theme" tab in Website Settings only swaps between 4 CSS color palettes (Cream, Rose, Sage, Ocean). This is a color scheme selector, not a theme system. What you're describing is a **Shopify/Squarespace-style theme architecture** where a "theme" is an entire website build -- layout structure, section ordering, typography, component styles, and visual identity bundled together.

The Website Editor Hub (`/dashboard/admin/website-sections`) also lives as a completely separate page with no connection to the Settings card, forcing users to bounce between two different areas.

## What This Plan Delivers

### 1. Redefine "Theme" as a Full Website Build

Each theme becomes a complete website configuration package containing:

- **Layout template** -- which sections exist and in what order
- **Color palette** -- the CSS color scheme
- **Typography preset** -- font pairings and sizing
- **Component style variants** -- hero layout style (centered vs split), card shapes (rounded vs sharp), section spacing density
- **Default section configurations** -- pre-set hero content structure, testimonial display style, etc.

Example themes:

| Theme | Description | Layout Style |
|-------|-------------|-------------|
| **Cream Classic** (current) | Warm, elegant, editorial | Full-width hero, stacked sections |
| **Rose Boutique** | Soft feminine luxury | Split hero, card-based grid |
| **Sage Wellness** | Calming spa/wellness | Minimal hero, open spacing |
| **Ocean Modern** | Bold contemporary | Video hero, compact sections |
| **Midnight** (Coming Soon) | Dark luxury editorial | Dark-mode forward |
| **Terracotta** (Coming Soon) | Earthy warmth | Textured, organic |

### 2. Merge the Website Editor into the Theme Tab

Instead of linking out to `/dashboard/admin/website-sections`, the Theme tab becomes the primary hub:

```
Website Settings Card
  |-- General (domain, announcement, social)
  |-- Theme (THE NEW HUB)
  |     |-- Active Theme card showing current theme with "Customize" button
  |     |-- Theme Library grid showing available themes
  |     |-- Clicking "Customize" opens the full Website Editor inline
  |     |-- "Preview" opens live preview side panel
  |-- Booking
  |-- Retail
  |-- SEO & Legal
```

### 3. Theme Tab UX Flow

**State 1: Theme Overview (default)**
- Large card showing the **active theme** with name, description, thumbnail, and status badge ("Live")
- "Customize Theme" button opens the full editor
- "Preview" button opens the site in a new tab
- Below: Theme Library grid with available themes
- Each theme card shows a preview thumbnail, name, and "Activate" / "Preview" buttons
- "Coming Soon" themes are shown but disabled

**State 2: Theme Editor (after clicking Customize)**
- Full Website Editor experience embedded in the settings panel
- Sidebar navigation with Site Content and Homepage Layout sections (same as current WebsiteEditorSidebar)
- Section editors load inline
- Live preview panel toggle available
- "Back to Themes" button to return to the overview
- The `/dashboard/admin/website-sections` route remains functional but redirects to this new location

## Technical Changes

### New Database Structure

**New `site_settings` row: `website_active_theme`**
```json
{
  "theme_id": "cream_classic",
  "activated_at": "2026-02-18T...",
  "customized": true
}
```

**New table: `website_themes`**
Stores theme definitions (both built-in and future custom themes):

| Column | Type | Purpose |
|--------|------|---------|
| id | text (PK) | Theme identifier (e.g., "cream_classic") |
| name | text | Display name |
| description | text | Short description |
| thumbnail_url | text | Preview image |
| color_scheme | text | Which color palette (cream, rose, sage, ocean) |
| typography_preset | jsonb | Font pairings and sizing |
| layout_config | jsonb | Component style variants, spacing, hero style |
| default_sections | jsonb | Default homepage section order and enable/disable states |
| is_builtin | boolean | Platform-provided vs user-created |
| is_available | boolean | Active vs Coming Soon |
| created_at | timestamptz | Timestamp |

RLS: All authenticated users can SELECT built-in themes. Organization admins can manage custom themes.

### New Hook: `src/hooks/useWebsiteThemes.ts`
- `useWebsiteThemes()` -- fetches all available themes from `website_themes`
- `useActiveTheme()` -- reads the `website_active_theme` from `site_settings`
- `useActivateTheme()` -- mutation to switch the active theme (updates `site_settings` + applies default section config)
- Integrates with existing `useColorTheme` to apply color scheme when theme is activated

### Refactored Component: `WebsiteSettingsContent.tsx` -- Theme Tab

The `ThemeTab` component is rebuilt with two internal states:

**Overview mode:**
- `ActiveThemeCard` -- shows current theme with large preview, name, description, "Customize" and "Preview" buttons
- `ThemeLibraryGrid` -- grid of all available themes with activate/preview actions
- Status indicators for Coming Soon themes

**Editor mode:**
- Embeds the existing `WebsiteEditorSidebar` + editor components directly
- Reuses all existing section editors (HeroEditor, BrandStatementEditor, etc.)
- Adds a "Back to Themes" navigation
- Optional: ResizablePanelGroup with LivePreviewPanel (same as current WebsiteSectionsHub)

### New Component: `src/components/dashboard/settings/ActiveThemeCard.tsx`
Displays the currently active theme with:
- Theme name and description
- Color palette preview dots
- "Customize" button (enters editor mode)
- "Change Theme" link (scrolls to library)
- Typography preview snippet
- Last customized timestamp

### New Component: `src/components/dashboard/settings/ThemeLibraryGrid.tsx`
Grid of theme cards:
- Preview thumbnail (placeholder gradient if no image)
- Theme name and description
- Color palette dots
- "Activate" button (with confirmation dialog)
- "Preview" button (opens themed preview)
- "Coming Soon" badge for unavailable themes

### Route Update: `src/App.tsx`
- Keep `/dashboard/admin/website-sections` working but add a redirect option or keep as alternate entry point
- The primary path becomes Settings > Website > Theme > Customize

### Seed Data: `website_themes` table
Pre-populate with 4 built-in themes matching existing color schemes + 2 "Coming Soon" entries:

```sql
INSERT INTO website_themes (id, name, description, color_scheme, is_builtin, is_available) VALUES
('cream_classic', 'Cream Classic', 'Warm, elegant editorial design with full-width hero', 'cream', true, true),
('rose_boutique', 'Rose Boutique', 'Soft feminine luxury with card-based layouts', 'rose', true, true),
('sage_wellness', 'Sage Wellness', 'Calming spa aesthetic with open spacing', 'sage', true, true),
('ocean_modern', 'Ocean Modern', 'Bold contemporary design with compact sections', 'ocean', true, true),
('midnight', 'Midnight', 'Dark luxury editorial theme', 'midnight', true, false),
('terracotta', 'Terracotta', 'Earthy warmth with organic textures', 'terracotta', true, false);
```

## File Summary

| File | Action |
|------|--------|
| `website_themes` table | Create (migration) |
| `website_active_theme` site_settings row | Insert (seed) |
| `src/hooks/useWebsiteThemes.ts` | Create |
| `src/components/dashboard/settings/ActiveThemeCard.tsx` | Create |
| `src/components/dashboard/settings/ThemeLibraryGrid.tsx` | Create |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Major refactor (ThemeTab rebuild with overview/editor modes) |
| `src/hooks/useWebsiteSettings.ts` | Update (add active theme types) |
| `src/App.tsx` | Minor update (optional redirect) |

## What This Does NOT Do (Phase 2+)

- Does not build a visual drag-and-drop theme builder (like Shopify's theme editor with live DOM manipulation)
- Does not support uploading fully custom themes (user-created from scratch)
- Does not change the actual rendering of the public website per-theme (all 4 themes currently share the same component structure, just with different colors) -- that is a frontend rendering layer change for a future phase
- Does not add theme-specific layout variants yet (e.g., split hero vs full-width hero) -- the `layout_config` column is there as a foundation but the rendering engine to consume it comes later

## Migration Path

The existing color theme system (`useColorTheme`) continues to work. When a user "activates" a theme, it:
1. Updates `website_active_theme` in `site_settings`
2. Calls `setColorTheme()` from the existing hook to apply the palette
3. Optionally applies the theme's default section order (with user confirmation)

This ensures backward compatibility while building toward the full theme engine.

