

# Wire Website Services Manager to Native Backend

## Overview

Replace the static `servicePricing.ts` data source with the native `services`, `service_category_colors`, and `service_level_prices` database tables. The Website Editor's Services tab becomes a **read-from-database view** that displays operational services, while website-specific metadata (descriptions, popular flags, display order overrides) is stored alongside the native data.

---

## Current State

| Aspect | Static File | Native DB |
|---|---|---|
| Services count | ~80+ | 66 active |
| Categories | 10 (e.g. "Cutting & Styling", "Highlights") | 7 (e.g. "Haircut", "Blonding") |
| Level pricing | Full grid in static JSON | 0 rows in `service_level_prices` |
| Descriptions | Yes, per service | All NULL |
| Popular flags | Yes (`isPopular`) | No column exists |
| Source of truth | `servicePricing.ts` file | `services` + `service_category_colors` tables |

---

## What Needs to Happen

### Step 1: Database Schema Additions

Add two columns to the `services` table:
- `description` already exists (text, nullable) but is unpopulated
- `is_popular` (boolean, default false) -- new column
- `website_description` (text, nullable) -- optional website-specific description that can differ from operational description

Add a `description` column to `service_category_colors`:
- `description` (text, nullable) -- for category-level descriptions shown on the website

### Step 2: Seed Missing Data

Populate the native database with data currently only in the static file:
- Backfill `services.description` for all 66 services using the static file as reference
- Backfill `services.is_popular` for the ~12 services marked popular in the static file
- Populate `service_level_prices` for all 66 services x 7 levels (462 rows) using the pricing grid from the static file
- Backfill `service_category_colors.description` for each category

### Step 3: Create a New Database Hook

Create `useNativeServicesForWebsite` hook that:
- Fetches services from the `services` table (grouped by category)
- Fetches category metadata from `service_category_colors` (display order, description)
- Fetches level prices from `service_level_prices`
- Fetches stylist levels from `stylist_levels`
- Returns data in the shape the Website Editor expects (categories with items, each item having level prices)

### Step 4: Refactor ServicesContent.tsx

Replace the current static-file-based approach:
- Remove import of `services as staticServices` from `servicePricing.ts`
- Remove `useWebsiteServicesData()` (the JSON-blob approach)
- Use the new `useNativeServicesForWebsite` hook instead
- Keep CRUD operations (rename category, add service, toggle popular, reorder) but wire them to the native tables
- Save button writes to `services`, `service_category_colors`, and `service_level_prices` tables directly

### Step 5: Update Other Consumers

Update the 6 other files that import from `servicePricing.ts`:
- `src/pages/Services.tsx` (public services page) -- switch to database hook
- `src/pages/dashboard/ViewProfile.tsx` -- switch to database hook
- `src/components/dashboard/website-editor/WebsiteEditorSearch.tsx` -- switch to database hook
- `src/components/dashboard/StylistsOverviewCard.tsx` -- already uses `stylistLevels` from DB for levels; only needs the static levels import removed
- `src/utils/levelPricing.ts` -- refactor to use DB-fetched data or remove if unused
- `src/pages/dashboard/admin/ServicesManager.tsx` -- switch to database hook (this is the Settings hub services manager)

### Step 6: Remove Static File

Once all consumers are migrated, delete `src/data/servicePricing.ts` and the `useWebsiteServicesData` hook from `useSectionConfig.ts`.

---

## Technical Details

### New Column Migration SQL

```text
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS website_description TEXT;
ALTER TABLE service_category_colors ADD COLUMN IF NOT EXISTS description TEXT;
```

### Data Seeding Strategy

A one-time seed script (run via the insert tool) will:
1. Match static service names to DB service names (fuzzy match for slight differences like "Corrective Color (by the hour)" vs "Corrective Color - By The Hour")
2. Update `description` and `is_popular` on matched services
3. Insert `service_level_prices` rows for each service x level combination
4. Update `service_category_colors.description` for each category

### Hook Architecture

```text
useNativeServicesForWebsite()
  |-- useQuery(['services-website'])
  |     |-- SELECT * FROM services WHERE is_active = true
  |-- useQuery(['service-category-colors'])
  |     |-- SELECT * FROM service_category_colors ORDER BY display_order
  |-- useQuery(['service-level-prices-all'])
  |     |-- SELECT * FROM service_level_prices
  |-- useQuery(['stylist-levels'])
  |     |-- SELECT * FROM stylist_levels WHERE is_active = true ORDER BY display_order
  |
  |-- Returns: { categories: NativeServiceCategory[], levels: StylistLevel[] }
```

### Category Mapping

The static file and DB use different category names. The mapping:

| Static File Category | DB Category |
|---|---|
| New-Client Consultations | New Client Consultation |
| Cutting & Styling | Haircut + Styling |
| Highlights | Blonding |
| Balayage | Blonding |
| Color Blocks & Vivids | Blonding + Color + Vivids |
| Color Services | Color |
| Color Add-Ons | Color |
| Extensions - Install | Extensions |
| Extensions - Maintenance | Extensions |
| Extensions - Tapes | Extensions |

The DB categories are the authoritative grouping. The static file's finer-grained categories (Highlights vs Balayage) were consolidated into "Blonding" in the DB.

### Services Content Changes

The `ServicesContent.tsx` component will:
- Display services grouped by `service_category_colors` order
- Show level-based pricing grid using `service_level_prices` joined with `stylist_levels`
- Allow toggling `is_popular` (writes directly to `services.is_popular`)
- Allow editing descriptions (writes to `services.description` or `services.website_description`)
- Category rename writes to `service_category_colors.category_name`
- Reorder categories writes to `service_category_colors.display_order`
- "Add Service" creates a row in `services` table
- "Delete Service" sets `is_active = false`
- Level price edits write to `service_level_prices` (upsert)

### Risk Mitigation

- The static file is kept as a fallback until all seeding is verified
- A "data health check" query runs on mount to verify `service_level_prices` has data; if empty, shows a warning banner
- All mutations use the existing organization_id scoping and RLS

---

## Implementation Order

1. Run schema migration (add columns)
2. Seed descriptions, popular flags, and level prices from static data
3. Add category descriptions to `service_category_colors`
4. Create `useNativeServicesForWebsite` hook
5. Refactor `ServicesContent.tsx` to use new hook
6. Update public `Services.tsx` page
7. Update remaining consumers (`ViewProfile`, `WebsiteEditorSearch`, `StylistsOverviewCard`, `levelPricing.ts`, `ServicesManager.tsx`)
8. Remove `servicePricing.ts` static file and `useWebsiteServicesData`

