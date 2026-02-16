
# Location Pricing + Seasonal Adjustments

## The Design Challenge

You currently have a 3-tier pricing resolution:
1. Stylist override (per service + employee)
2. Level price (per service + stylist level)
3. Base price (on the service itself)

Adding location and seasonal dimensions could create a combinatorial nightmare (service x level x location x season = hundreds of cells). The key is keeping it manageable.

## Recommended Approach

### Location Pricing: Per-Location Base Price Override

Instead of creating location x level x stylist matrices, use a simple **location price override** on the base price. The level and stylist tiers then calculate relative to whichever base applies.

**New table: `service_location_prices`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| service_id | UUID FK -> services(id) | |
| location_id | TEXT FK -> locations(id) | |
| price | NUMERIC NOT NULL | Location-specific base price |
| organization_id | UUID FK -> organizations(id) | |

Unique constraint: `(service_id, location_id)`

**How it works**: If a service has a base price of $100 but location "Downtown" has a location override of $120, then all level pricing and stylist overrides at Downtown reference $120 as the base. This avoids duplicating the entire level/stylist matrix per location.

### Seasonal Adjustments: Percentage or Fixed Modifier with Date Ranges

Rather than hard-coding seasonal prices per service, use **named adjustment rules** that apply a percentage or fixed-amount modifier during a date window.

**New table: `service_seasonal_adjustments`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| service_id | UUID FK -> services(id) | Nullable -- null means "all services" |
| name | TEXT NOT NULL | e.g. "Holiday Premium", "Summer Special" |
| adjustment_type | TEXT NOT NULL | 'percentage' or 'fixed' |
| adjustment_value | NUMERIC NOT NULL | e.g. 10 for +10% or -5 for -$5 |
| start_date | DATE NOT NULL | |
| end_date | DATE NOT NULL | |
| location_id | TEXT FK -> locations(id) | Nullable -- null means "all locations" |
| is_active | BOOLEAN DEFAULT true | |
| organization_id | UUID FK -> organizations(id) | |

**How it works**: After resolving the price through the normal chain (override -> level -> base/location base), any active seasonal adjustment for today's date is applied on top. Percentage adjustments stack multiplicatively. This lets owners do things like "+15% holiday pricing Dec 15-Jan 5" or "-$10 summer promo for Balayage" without touching the core price matrix.

### Updated Price Resolution Order

```text
1. Start with base price (services.price)
2. If location override exists -> use location base instead
3. If stylist level price exists -> use that
4. If individual stylist override exists -> use that
5. Apply any active seasonal adjustments (% or fixed)
```

## UI Changes: Two New Tabs in the Service Editor

The Service Editor dialog gets two additional tabs:

**Details | Level Pricing | Stylist Overrides | Location Pricing | Seasonal**

### Location Pricing Tab
- Lists all active locations with a price input next to each
- Placeholder shows the base price
- Leave blank = use base price at that location
- Same pattern as the Level Pricing tab (simple list of inputs)

### Seasonal Adjustments Tab
- Shows a list of active/upcoming adjustments for this service
- "Add Adjustment" button opens an inline form:
  - Name (text)
  - Type toggle: Percentage / Fixed Amount
  - Value input (e.g. +10% or -$5)
  - Start date / End date (date pickers)
  - Location scope (optional -- "All Locations" or pick one)
  - Active toggle
- Each row shows name, date range, value, and a delete button
- Past adjustments shown dimmed with an "Expired" badge

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useServiceLocationPricing.ts` | CRUD hooks for `service_location_prices` |
| `src/hooks/useServiceSeasonalAdjustments.ts` | CRUD hooks for `service_seasonal_adjustments` |
| `src/components/dashboard/settings/LocationPricingContent.tsx` | Tab content for per-location pricing |
| `src/components/dashboard/settings/SeasonalAdjustmentsContent.tsx` | Tab content for seasonal rules |

## Modified Files

| File | Change |
|------|--------|
| `ServiceEditorDialog.tsx` | Add two new tabs (Location Pricing, Seasonal) |
| Migration SQL | Two new tables with RLS, indexes, unique constraints |

## Build Order

1. Database migration (two new tables + RLS)
2. `useServiceLocationPricing.ts` hooks
3. `useServiceSeasonalAdjustments.ts` hooks
4. `LocationPricingContent.tsx` component
5. `SeasonalAdjustmentsContent.tsx` component
6. Wire into `ServiceEditorDialog.tsx` as two new tabs

## Why This Design

- **No combinatorial explosion**: Location modifies the base, not every cell in the level/stylist matrix
- **Seasonal is additive**: Applied after price resolution, so it works regardless of which tier determined the price
- **Familiar UI pattern**: Location pricing tab looks identical to level pricing (list of inputs). Seasonal is a simple CRUD list with date pickers
- **Scoped flexibility**: Seasonal adjustments can target all services or one, all locations or one -- without needing a separate table for every combination
