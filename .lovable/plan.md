

# Add "Website" Settings Card with Configurator

## Overview

A new **Website** card in Settings that centralizes all public-facing website configuration. Instead of duplicating the full Website Editor (which already lives at `/dashboard/admin/website-sections`), this configurator focuses on **settings and toggles** that control website behavior, appearance, and features.

## What Gets Built

A new `WebsiteSettingsContent` component with **5 tabs**:

### Tab 1: General
- **Announcement Banner** -- toggle on/off, edit text (links to existing `useAnnouncementBar` hook)
- **Social Links** -- quick-access social media URLs (pulls from email branding settings or a new `site_settings` key)
- **Quick link** to the full Website Editor (`/dashboard/admin/website-sections`)

### Tab 2: Theme & Appearance
- **Website Color Theme** selector (Cream, Rose, Sage, Ocean) -- wired to existing `useColorTheme` logic but persisted to `site_settings` so it applies globally, not just per-browser
- **Future Themes** -- placeholder badges for upcoming themes (e.g., "Midnight", "Terracotta") marked "Coming Soon"
- **Homepage Section Ordering** -- summary view showing enabled/disabled sections with a link to the full Website Editor for detailed editing

### Tab 3: Online Booking
- **Enable Online Booking** toggle (reads/writes `site_settings` key `website_booking`)
- **Booking Widget Options**: require deposit toggle, buffer time between appointments (minutes), show/hide specific stylists, show/hide specific services
- **New Client vs Existing Client** mode selector
- All stored as a single `site_settings` row with key `website_booking`

### Tab 4: Retail / Shop
- **Enable Online Shop** toggle
- **Fulfillment Options**: in-store pickup, local delivery, shipping (toggles)
- **Featured Products** toggle (show/hide on homepage)
- Stored as `site_settings` key `website_retail`
- All toggles are UI-ready but marked as "Coming Soon" badges since the e-commerce backend isn't built yet

### Tab 5: SEO & Legal
- **Google Analytics / Tag Manager ID** input fields
- **Meta Pixel ID** input field
- **Privacy Policy URL** and **Terms of Service URL** inputs
- Stored as `site_settings` key `website_seo_legal`

## Technical Changes

### 1. New Component: `src/components/dashboard/settings/WebsiteSettingsContent.tsx`
- Tabbed layout using existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`
- Icons: `Globe`, `Palette`, `Calendar`, `ShoppingBag`, `Scale`
- Each tab reads/writes from `site_settings` table using the existing `useSiteSettings` / `useUpdateSiteSetting` hooks (or `useSectionConfig` for upsert pattern)
- Theme tab imports from `useColorTheme` and `colorThemes` for the theme picker UI

### 2. Update: `src/pages/dashboard/admin/Settings.tsx`
- Add `'website'` to the `SettingsCategory` type union
- Add `website` entry to `categoriesMap` with icon `Globe` and description `"Theme, booking, retail & SEO"`
- Add conditional render: `{activeCategory === 'website' && <WebsiteSettingsContent />}`
- Import `WebsiteSettingsContent`

### 3. Update: `src/hooks/useSettingsLayout.ts`
- Add `website: '#0EA5E9'` to `DEFAULT_ICON_COLORS`
- Add `'website'` to the `operations` group in `SECTION_GROUPS` (after `business`)

### 4. Database: New `site_settings` rows (seeded via insert tool)
- `website_booking` -- default: `{ "enabled": false, "require_deposit": false, "buffer_minutes": 15, "new_client_mode": "both" }`
- `website_retail` -- default: `{ "enabled": false, "pickup": true, "delivery": false, "shipping": false, "featured_products": true }`
- `website_seo_legal` -- default: `{ "ga_id": "", "gtm_id": "", "meta_pixel_id": "", "privacy_url": "", "terms_url": "" }`
- `website_theme` -- default: `{ "color_theme": "cream" }`

No schema migration needed -- these are just new rows in the existing `site_settings` table.

### 5. New Hook: `src/hooks/useWebsiteSettings.ts`
- Typed hooks for each settings key (`useWebsiteBookingSettings`, `useWebsiteRetailSettings`, `useWebsiteSeoSettings`, `useWebsiteThemeSettings`)
- Each wraps the generic `useSiteSettings` with proper TypeScript interfaces
- Upsert mutation pattern (matching existing `useSectionConfig` approach)

## What This Does NOT Do
- Does not replace the full Website Editor (`WebsiteSectionsHub`) -- that remains the detailed content editor
- Does not build actual e-commerce or booking backends -- those are future phases
- Does not duplicate section reordering -- just shows a summary with a link to the editor

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Create |
| `src/hooks/useWebsiteSettings.ts` | Create |
| `src/pages/dashboard/admin/Settings.tsx` | Edit (add category + render) |
| `src/hooks/useSettingsLayout.ts` | Edit (add to defaults) |
| `site_settings` table | Insert 4 default rows |

