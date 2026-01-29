

# Calculate Preferred Stylist from Appointment History

## Overview

Create a database function and edge function to analyze appointment history and automatically assign `preferred_stylist_id` to clients based on which stylist they see most frequently.

---

## Current Data State

| Table | Records | Issue |
|-------|---------|-------|
| `phorest_clients` | 504 | All have `preferred_stylist_id = NULL` |
| `phorest_appointments` | 123 | Only 14 have `phorest_client_id` linked |
| `phorest_staff_mapping` | 2 | Links `phorest_staff_id` → `user_id` |

**Root Cause**: Phorest API doesn't reliably return `preferredStaffId` for clients, and most appointments aren't linked to client records.

---

## Solution Architecture

### Phase 1: Improve Appointment-Client Linking

First, we need to ensure appointments are properly linked to clients during sync.

**Update `sync-phorest-data` edge function:**
- When syncing appointments, perform a lookup against `phorest_clients` using the client ID from the Phorest appointment response
- Populate `phorest_client_id` in `phorest_appointments` for historical correlation

### Phase 2: Calculate Preferred Stylist

**Create database function:**

```sql
CREATE OR REPLACE FUNCTION public.calculate_preferred_stylists()
RETURNS TABLE(client_id uuid, preferred_user_id uuid, appointment_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH client_stylist_counts AS (
    SELECT 
      c.id as client_id,
      sm.user_id as stylist_user_id,
      COUNT(*) as appointment_count,
      ROW_NUMBER() OVER (
        PARTITION BY c.id 
        ORDER BY COUNT(*) DESC, MAX(a.appointment_date) DESC
      ) as rn
    FROM phorest_clients c
    INNER JOIN phorest_appointments a 
      ON c.phorest_client_id = a.phorest_client_id
    INNER JOIN phorest_staff_mapping sm 
      ON a.phorest_staff_id = sm.phorest_staff_id
    WHERE a.phorest_client_id IS NOT NULL
      AND sm.user_id IS NOT NULL
    GROUP BY c.id, sm.user_id
  )
  SELECT 
    client_id,
    stylist_user_id as preferred_user_id,
    appointment_count
  FROM client_stylist_counts
  WHERE rn = 1
$$;
```

**Create update function:**

```sql
CREATE OR REPLACE FUNCTION public.update_preferred_stylists()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE phorest_clients c
  SET preferred_stylist_id = cps.preferred_user_id
  FROM (SELECT * FROM calculate_preferred_stylists()) cps
  WHERE c.id = cps.client_id
    AND (c.preferred_stylist_id IS NULL OR c.preferred_stylist_id != cps.preferred_user_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
```

### Phase 3: Edge Function for Manual Trigger

**Create `calculate-preferred-stylists` edge function:**

```typescript
// supabase/functions/calculate-preferred-stylists/index.ts

serve(async (req) => {
  // Call the database function to update preferred stylists
  const { data, error } = await supabase.rpc('update_preferred_stylists');
  
  return new Response(JSON.stringify({
    success: !error,
    updated_count: data,
    message: `Updated ${data} client records with calculated preferred stylist`
  }));
});
```

### Phase 4: Add to Client Sync Workflow

**Update existing sync logic:**

After clients sync completes, automatically trigger the preferred stylist calculation:

```typescript
// In sync-phorest-data, after syncClients completes:
if (syncType === 'clients' || syncType === 'all') {
  // Calculate preferred stylists from appointment history
  const { data: updateCount } = await supabase.rpc('update_preferred_stylists');
  console.log(`Updated ${updateCount} clients with calculated preferred stylist`);
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database Migration | Create | Add `calculate_preferred_stylists()` and `update_preferred_stylists()` functions |
| `supabase/functions/calculate-preferred-stylists/index.ts` | Create | Standalone edge function for manual trigger |
| `supabase/functions/sync-phorest-data/index.ts` | Modify | Auto-run calculation after client sync |
| `src/hooks/usePhorestSync.ts` | Modify | Add mutation for calculate preferred stylists |

---

## Calculation Logic

The algorithm determines preferred stylist by:

1. **Count appointments** per client-stylist pair
2. **Rank by frequency** - stylist with most appointments wins
3. **Tie-breaker** - if equal, prefer stylist from most recent appointment
4. **Update only if different** - avoid unnecessary writes

---

## UI Integration

Add a button in the My Clients page header or Phorest Settings to manually trigger recalculation:

```tsx
<Button onClick={() => calculatePreferredStylists.mutate()}>
  <RefreshCw className="w-4 h-4 mr-2" />
  Recalculate Assignments
</Button>
```

---

## Result

After implementation:

| Role | Behavior |
|------|----------|
| Stylists | See clients who visit them most frequently |
| Leadership/Front Desk | See all clients (via existing RLS) |
| System | Auto-updates assignments during sync |

This ensures stylists see the clients they actually work with, based on real appointment data rather than relying on Phorest's unreliable `preferredStaffId` field.

