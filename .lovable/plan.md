

# Online Store Products Configurator

## What We're Building

When the "Enable online shop" toggle is turned ON in the Retail tab, a full product configurator appears below the settings -- similar to the screenshot reference. This lets salon owners control which products are visible on their public storefront, directly from Website Settings.

## Current State

- The Retail tab has an "Enable online shop" toggle, fulfillment options, and a featured products toggle -- but no product list
- The `products` table exists with 8 active products but has **no `available_online` column**
- Product management exists in the Inventory page, but there's no way to control online visibility per product

## Changes

### 1. Database: Add `available_online` column to `products`

Add a boolean column `available_online` (default `false`) to the existing `products` table. This controls whether each product appears on the public storefront.

### 2. New Component: `OnlineStoreProductsTable`

A streamlined product table that appears **only when** the online store toggle is enabled. Inspired by the reference screenshot, it shows:

| Column | Description |
|--------|-------------|
| Product Name | Clickable name (links to edit dialog) |
| Brand | Brand name |
| Price | Retail price |
| Inventory | Stock count with warning icon when low/negative |
| Available Online | No/Yes toggle buttons per product |

Features:
- Search bar to filter by product name
- Brand dropdown filter
- Availability dropdown filter (All / Online / Not Online)
- Product count footer (e.g., "8 Products")
- Status banner when online store is disabled ("Your online store is disabled. Clients can't see or buy products.")
- Inline toggle to flip `available_online` per product with immediate save
- Bulk actions: "Make all available" / "Make all unavailable"

### 3. Update Retail Tab

When `local.enabled` is `true`, render the `OnlineStoreProductsTable` component below the existing settings card. When `false`, the product table is hidden (only the toggle and settings show).

### 4. Update `useProducts` hook

- Add `available_online` to the `Product` interface
- Add `availableOnline` filter option to `ProductFilters`

### 5. New hook: `useToggleProductOnline`

A lightweight mutation that updates just the `available_online` field for a single product, with optimistic updates for instant UI feedback.

## File Summary

| File | Action |
|------|--------|
| `products` table | Migration: add `available_online` boolean column |
| `src/hooks/useProducts.ts` | Update: add `available_online` to interface and filter |
| `src/components/dashboard/settings/OnlineStoreProductsTable.tsx` | Create: product configurator table |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Edit: render product table in RetailTab when enabled |

## Technical Details

### Migration SQL
```sql
ALTER TABLE public.products
ADD COLUMN available_online BOOLEAN NOT NULL DEFAULT false;
```

### OnlineStoreProductsTable Component
- Uses existing `useProducts` hook for data
- Adds a new `useToggleProductOnline` mutation with optimistic cache updates
- Search input filters by product name (client-side for simplicity with small catalogs, or passed to the hook)
- Brand filter uses `useProductCategories`-style distinct query
- The No/Yes toggle is a segmented button pair per row, styled like the reference screenshot
- Immediate save on toggle -- no "Save" button needed for availability changes

### RetailTab Integration
The product table renders conditionally:
```
{local.enabled && <OnlineStoreProductsTable />}
```

If the store is disabled in the database (not just local state), a warning banner shows above the table.
