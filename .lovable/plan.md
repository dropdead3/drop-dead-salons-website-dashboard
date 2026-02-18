
## Retail Products Inventory Configurator + Sales by Brand Analytics

### Overview

This plan adds two connected capabilities:
1. A **Retail Products** settings card in the Settings page for managing the product catalog (brands, categories, pricing, per-location inventory)
2. A **Sales by Brand** analytics section on the Retail analytics subtab with drill-downs to products, stale inventory detection, and brand performance scoring

---

### Part 1: Retail Products Settings Card

**Goal:** Surface the existing Inventory management as a proper Settings configurator card, making it discoverable alongside Services, Locations, etc.

#### Changes to Settings Infrastructure

**Modified: `src/hooks/useSettingsLayout.ts`**
- Add `'retail-products'` to the `operations` section group (alongside `services`, `schedule`, etc.)

**Modified: `src/pages/dashboard/admin/Settings.tsx`**
- Add `'retail-products'` to the `SettingsCategory` type union
- Add entry in `categoriesMap`:
  - Label: "Retail Products"
  - Description: "Brands, categories, inventory & pricing"
  - Icon: `ShoppingBag`
- Add the content panel that renders when `activeCategory === 'retail-products'`
- This content panel will render a new `RetailProductsSettingsContent` component

#### New Component: `src/components/dashboard/settings/RetailProductsSettingsContent.tsx`

A comprehensive product catalog manager with tabs:

**Tab 1: Products** (enhanced version of existing Inventory page)
- Full product table with columns: Name, Brand, Category, SKU, Retail Price, Cost Price, Stock (per location), Reorder Level, Status
- Inline editing for quick updates (SKU, barcode — already implemented in `ProductTable`)
- Add/Edit product dialog (reuse existing `ProductEditDialog`)
- Filters: search, brand filter dropdown, category filter dropdown, location filter, low-stock toggle
- Bulk actions: activate/deactivate

**Tab 2: Brands**
- List of all unique brands from the products table
- Count of products per brand, total inventory value per brand
- Ability to rename a brand (bulk-updates all products with that brand)
- No separate brands table needed — derived from `products.brand` column

**Tab 3: Categories**
- Same approach as Brands — derived from `products.category`
- Product count per category, ability to rename

**Tab 4: Inventory by Location**
- Grid view showing stock levels per product per location
- Highlights products below reorder level
- Quick stock adjustment (increment/decrement quantity)

#### Data Layer

No new database tables needed. The existing `products` table has all required columns:
- `brand`, `category`, `sku`, `barcode`, `retail_price`, `cost_price`, `quantity_on_hand`, `reorder_level`, `location_id`, `organization_id`

New hooks:
- `useProductBrands()` — returns distinct brands with product counts (derived query from `products` table)
- `useBulkUpdateProducts()` — mutation for brand/category rename across multiple products

---

### Part 2: Sales by Brand Analytics

**Goal:** Add a "Sales by Brand" card to the Retail analytics subtab with drill-downs.

#### Enhanced Hook: `src/hooks/useRetailAnalytics.ts`

Add a new `brandPerformance` array to the `RetailAnalyticsResult` interface:

```text
BrandRow {
  brand: string
  revenue: number
  priorRevenue: number
  revenueTrend: number (% change)
  unitsSold: number
  productCount: number
  avgPrice: number
  margin: number (if cost data available)
  topProduct: string (highest revenue product in brand)
  staleProducts: string[] (products with 0 units sold)
}
```

**Brand resolution logic:**
- Build a lookup map from `products` table: `product_name -> brand`
- For each product in transaction items, resolve brand via name matching
- Products not in catalog get brand = "Uncategorized"
- This follows the same pattern already used for margin/cost lookups

Add a `deadStock` array to the result:
```text
DeadStockRow {
  name: string
  brand: string
  category: string
  retailPrice: number
  quantityOnHand: number
  lastSoldDate: string | null
  daysStale: number
}
```

Dead stock = products in the catalog that had zero sales in the selected period.

#### New Analytics Card: Brand Performance

**Added to: `src/components/dashboard/analytics/RetailAnalyticsContent.tsx`**

Position: After the Category Breakdown card (Section 4), before the Product Revenue Trend (Section 5).

**Brand Performance Card layout:**
- Horizontal bar chart showing revenue by brand (top 10)
- Table below with sortable columns: Brand, Revenue, Units, Products, Avg Price, Margin %, Trend
- Click a brand row to expand a drill-down panel showing:
  - All products under that brand, sorted by revenue
  - Stale products highlighted with a warning badge
  - Brand's share of total retail revenue (progress bar)

#### New Analytics Card: Dead Stock / Stale Inventory

**Added to: `src/components/dashboard/analytics/RetailAnalyticsContent.tsx`**

Position: After Red Flags section.

- Lists products from the catalog with zero sales in the period
- Columns: Product, Brand, Category, Retail Price, Stock on Hand, Est. Capital Tied Up (price x quantity)
- Summary KPI: Total capital tied up in dead stock
- Only shows when there are products with zero sales (conditional render like Red Flags)

#### New Analytics Card: Inventory Turnover by Brand

Position: After Dead Stock card.

- Turnover rate = units sold / average quantity on hand
- Grouped by brand
- High turnover = good (products moving fast)
- Low turnover + high stock = capital risk
- Simple table with brand, turnover rate, classification badge (Fast/Normal/Slow)

---

### Part 3: Wiring Settings to Analytics

**Link from Settings to Analytics:**
- In the Retail Products settings content, add a "View Retail Analytics" button in the header that navigates to `/dashboard/admin/analytics?tab=sales&subtab=retail`

**Link from Analytics to Settings:**
- In the Dead Stock and Brand Performance cards, add a subtle "Manage Products" link that navigates to Settings with `retail-products` active

---

### Files Summary

**New files:**
- `src/components/dashboard/settings/RetailProductsSettingsContent.tsx` — Main settings panel with tabs
- `src/hooks/useProductBrands.ts` — Brand aggregation hook
- `src/hooks/useBulkUpdateProducts.ts` — Bulk rename mutation

**Modified files:**
- `src/hooks/useSettingsLayout.ts` — Add `retail-products` to operations group
- `src/pages/dashboard/admin/Settings.tsx` — Add category entry + content panel
- `src/hooks/useRetailAnalytics.ts` — Add `brandPerformance` and `deadStock` arrays
- `src/components/dashboard/analytics/RetailAnalyticsContent.tsx` — Add Brand Performance, Dead Stock, and Inventory Turnover cards

---

### Technical Notes

- Brand resolution uses name-matching between `phorest_transaction_items.item_name` and `products.name`. This is the same pattern already used for cost/margin lookups in the existing hook (line 147-154 of `useRetailAnalytics.ts`)
- No new database tables or migrations required — everything derives from the existing `products` table
- The `products` table already has `brand`, `category`, `cost_price`, `retail_price`, `quantity_on_hand`, `reorder_level`, and `location_id` columns
- Multi-location filtering uses the existing `applyLocationFilter` utility from `src/lib/locationFilter.ts`
- All new cards are wrapped in `PinnableCard` and `VisibilityGate` following existing patterns
