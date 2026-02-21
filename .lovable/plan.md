

## Fix: Booking Wizard Showing Deleted Categories

### Root Cause

The booking wizard pulls categories directly from the `phorest_services` table (via `useAllServicesByCategory`) and groups by whatever `category` value each service has. It does **not** filter against the `service_category_colors` settings table. This means:

- "Extension Add Ons" and "Haircuts" still exist as categories on active Phorest services
- Deleting a category from the Services Settings page only removes its color/order config -- it does not hide it from booking
- The Phorest sync may not be deactivating removed services, so `is_active = true` persists

Additionally, category names are mismatched: Phorest has "Haircuts" (plural) while your settings have "Haircut" (singular), causing it to appear as a separate unsorted category at the bottom.

### What Changes

**1. Filter booking categories to only those defined in `service_category_colors`**

In `useAllServicesByCategory()` (src/hooks/usePhorestServices.ts), after grouping services by category, remove any category key that does NOT have a matching entry in the `service_category_colors` table. This makes the settings page the source of truth for which categories appear in the booking wizard.

Also apply the same fix to `useServicesByCategory()` for location-specific booking flows.

**2. Also exclude Block and Break categories from booking**

These internal-only categories (Block, Break) should never appear in the booking wizard. Add an explicit filter to exclude them during grouping.

### Technical Detail

**File: `src/hooks/usePhorestServices.ts`**

In both `useServicesByCategory()` and `useAllServicesByCategory()`:
- After building the `grouped` object, filter its keys to only include categories present in the `categoryColors` data
- Exclude "Block" and "Break" categories
- This is ~3 lines added to each function's grouping logic

```typescript
// After building grouped, filter to only configured categories
const configuredCategories = new Set(categoryColors.map(c => c.category_name));
const filtered = Object.fromEntries(
  Object.entries(grouped).filter(([cat]) => 
    configuredCategories.has(cat) && !['Block', 'Break'].includes(cat)
  )
);
```

**3. Data cleanup (optional but recommended)**

The `phorest_services` table still has active records for "Extension Add Ons" and possibly other removed services. A one-time SQL update can deactivate them:

```sql
UPDATE phorest_services 
SET is_active = false 
WHERE category IN ('Extension Add Ons') 
  AND is_active = true;
```

This is optional because the code fix above will hide them regardless, but it keeps the data clean.

### Files

| File | Action |
|------|--------|
| `src/hooks/usePhorestServices.ts` | Edit - filter categories to only those in service_category_colors |

### Result

After this change, only categories explicitly configured in your Services Settings hub will appear in the booking wizard. Removing a category from settings will immediately remove it from booking. No more ghost categories.
