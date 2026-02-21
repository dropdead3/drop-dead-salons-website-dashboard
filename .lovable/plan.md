

## Fix: "Haircuts" Category Showing "No Services"

### Root Cause

There are two different tables with mismatched category names:
- The **services** table (your actual service records) stores the category as **"Haircut"** (singular)
- The **service_category_colors** settings table stores it as **"Haircuts"** (plural)

The settings page counts services by looking up `servicesByCategory["Haircuts"]`, but all 8 haircut services are grouped under `"Haircut"` -- so it finds zero.

### Fix

One-line database update to rename the category in the `services` table to match your settings:

```sql
UPDATE services SET category = 'Haircuts' WHERE category = 'Haircut' AND is_active = true;
```

This aligns the 8 existing haircut services with the "Haircuts" entry in your settings. No code changes needed -- the existing matching logic works correctly once the names are consistent.

### Also fix `phorest_services` table

The same mismatch exists in `phorest_services`. We should align that too so the booking wizard also picks up these services:

```sql
UPDATE phorest_services SET category = 'Haircuts' WHERE category = 'Haircut' AND is_active = true;
```

### Files

| File | Action |
|------|--------|
| Database | Update category from "Haircut" to "Haircuts" in both `services` and `phorest_services` tables |

No code changes required.
