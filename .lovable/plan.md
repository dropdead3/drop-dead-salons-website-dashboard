

# Service Pricing by Stylist Level + Stylist Overrides

## Overview

Add two pricing layers to the service management system:
1. **Level-based pricing** -- each service gets a price per stylist level (New Talent, Studio Artist, Core Artist, etc.)
2. **Stylist overrides** -- individual stylists can have custom pricing that supersedes their level's default

This mirrors the screenshot reference (Phorest's "Price Levels Per Category" dialog) but adapted to Zura's existing level system and UI patterns.

## Data Model

Two new database tables:

### `service_level_prices`
Stores the default price for each service at each stylist level.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| service_id | UUID FK -> services(id) ON DELETE CASCADE | |
| stylist_level_id | UUID FK -> stylist_levels(id) ON DELETE CASCADE | |
| price | NUMERIC NOT NULL | |
| organization_id | UUID FK -> organizations(id) ON DELETE CASCADE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Unique constraint: `(service_id, stylist_level_id)`

### `service_stylist_price_overrides`
Stores per-stylist price overrides that supersede the level default.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| service_id | UUID FK -> services(id) ON DELETE CASCADE | |
| employee_id | UUID FK -> employee_profiles(id) ON DELETE CASCADE | |
| price | NUMERIC NOT NULL | |
| organization_id | UUID FK -> organizations(id) ON DELETE CASCADE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Unique constraint: `(service_id, employee_id)`

### Price Resolution Order
1. Check `service_stylist_price_overrides` for (service, stylist) -- if found, use it
2. Check `service_level_prices` for (service, stylist's level) -- if found, use it
3. Fall back to `services.price` (the default base price)

### RLS Policies
Both tables: org-member SELECT, org-admin INSERT/UPDATE/DELETE (same pattern as existing tables).

## UI Changes

### 1. Level Pricing Dialog (accessed from service edit/detail)

A dialog similar to the Phorest screenshot:
- Title: "Price by Stylist Level"
- Lists all active stylist levels (from `stylist_levels` table) with a `$` input field next to each
- Pre-populated with existing level prices or the service's base price as placeholder
- Cancel / Save buttons

**Entry point**: A "Set Level Prices" button added to the `ServiceFormDialog` (or as an action on each service row in the accordion).

### 2. Stylist Override Dialog

A secondary dialog or expandable section:
- Title: "Stylist Price Overrides"
- Search/filter for stylists
- Shows stylist name, their level, the level price (for reference), and an override price input
- Only shows stylists who have overrides, plus an "Add Override" action
- Cancel / Save buttons

**Entry point**: A "Stylist Overrides" button within the Level Pricing Dialog or on the service row.

### 3. Service Row Display Enhancement

In the services accordion, show a small indicator on service rows that have level pricing or stylist overrides configured (e.g., a layered-pricing icon or badge like "7 levels" or "2 overrides").

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useServiceLevelPricing.ts` | CRUD hooks for `service_level_prices` and `service_stylist_price_overrides` |
| `src/components/dashboard/settings/LevelPricingDialog.tsx` | Dialog listing all levels with price inputs |
| `src/components/dashboard/settings/StylistPriceOverridesDialog.tsx` | Dialog for per-stylist overrides |

## Modified Files

| File | Change |
|------|--------|
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Add "Level Prices" button/icon on each service row; state management for dialogs |
| `src/components/dashboard/settings/ServiceFormDialog.tsx` | Optionally add "Set Level Prices" link within the form |

## Technical Details

### Migration SQL (single migration)
- CREATE TABLE `service_level_prices` with RLS, unique constraint, org scoping, updated_at trigger
- CREATE TABLE `service_stylist_price_overrides` with RLS, unique constraint, org scoping, updated_at trigger
- Indexes on `service_id`, `organization_id`, `employee_id`

### Hooks (`useServiceLevelPricing.ts`)
- `useServiceLevelPrices(serviceId)` -- fetch all level prices for a service
- `useUpsertServiceLevelPrices()` -- bulk upsert level prices (uses ON CONFLICT)
- `useStylistPriceOverrides(serviceId)` -- fetch all stylist overrides for a service
- `useUpsertStylistPriceOverride()` -- create/update single override
- `useDeleteStylistPriceOverride()` -- remove an override
- `useResolveServicePrice(serviceId, employeeId)` -- resolve the effective price using the 3-tier fallback

### LevelPricingDialog
- Fetches `stylist_levels` (already queryable) and `service_level_prices` for the selected service
- Renders a row per level: level label + `$` input
- On save: bulk upserts all prices

### StylistPriceOverridesDialog
- Fetches employees (with their level info) and existing overrides
- Shows each override as: stylist name | level | level price (read-only reference) | override price (editable)
- "Add" button to pick a stylist and set their override price
- Delete button to remove an override (reverts to level pricing)

## Build Order
1. Database migration (two tables + RLS + indexes)
2. `useServiceLevelPricing.ts` hooks
3. `LevelPricingDialog.tsx` component
4. `StylistPriceOverridesDialog.tsx` component
5. Wire into `ServicesSettingsContent.tsx` (add buttons/icons per service row)

