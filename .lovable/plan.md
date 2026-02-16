

# Admin-Level Service Category Ordering

## Overview
Add a `display_order` column to the existing `service_category_colors` table so salon owners can control the order categories appear in the scheduling wizard. Categories will be sorted by this order everywhere services are grouped.

## Changes

### 1. Database Migration
Add an integer `display_order` column to `service_category_colors`, defaulting to 0. Backfill existing rows with sequential values based on current alphabetical order.

```sql
ALTER TABLE public.service_category_colors
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with sequential order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY category_name) as rn
  FROM public.service_category_colors
)
UPDATE public.service_category_colors c
SET display_order = o.rn
FROM ordered o WHERE c.id = o.id;
```

### 2. Sort categories by display_order in hook
**File:** `src/hooks/usePhorestServices.ts`

In `useServicesByCategory`, fetch `service_category_colors` display_order and sort the grouped result by it before returning. This ensures the booking wizard (and all other consumers) respects the admin-defined order.

### 3. Sort in useServiceCategoryColors hook
**File:** `src/hooks/useServiceCategoryColors.ts`

Update the query to `ORDER BY display_order, category_name` instead of just `category_name`.

### 4. Admin UI for reordering (drag-and-drop)
Add a reorder interface in the existing category color management area. Each category row gets a drag handle. On reorder, update `display_order` values in the database.

This will use the already-installed `@dnd-kit/sortable` library for drag-and-drop reordering.

## Result
- Salon owners define the order once in settings
- All service lists (booking wizard, walk-in dialog, public booking) respect that order
- Default order is alphabetical for new installs
