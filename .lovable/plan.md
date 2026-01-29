# Calculate Preferred Stylist from Appointment History

## Status: ✅ IMPLEMENTED

---

## What Was Built

### Database Functions
- **`calculate_preferred_stylists()`** - SQL function that analyzes appointment history and ranks stylists by visit frequency per client
- **`update_preferred_stylists()`** - PL/pgSQL function that updates `phorest_clients.preferred_stylist_id` based on calculation

### Edge Function
- **`calculate-preferred-stylists`** - Manual trigger endpoint to recalculate assignments on demand

### Sync Integration
- **`sync-phorest-data`** - Now auto-runs `update_preferred_stylists()` after client sync completes

### Frontend Hook
- **`useCalculatePreferredStylists()`** - Mutation hook for manual trigger from UI

---

## How It Works

1. **Calculation Logic**:
   - Counts appointments per client-stylist pair via `phorest_appointments` ↔ `phorest_staff_mapping`
   - Ranks stylists by frequency (most appointments wins)
   - Tie-breaker: most recent appointment date
   - Updates only when value differs from current

2. **Auto-Update Flow**:
   - Client sync triggers → clients upserted → `update_preferred_stylists()` runs → clients get assigned stylists

3. **Manual Trigger**:
   - Call `useCalculatePreferredStylists().mutate()` from any component
   - Or POST to `/functions/v1/calculate-preferred-stylists`

---

## Current Data Gap

| Metric | Value |
|--------|-------|
| Clients | 504 |
| Appointments | 123 |
| Appointments with `phorest_client_id` | ~14 |

**Issue**: Appointments aren't fully linked to clients yet. The sync function already performs client lookups during appointment sync (lines 308-323 in `sync-phorest-data`), but historical data gaps exist.

**Solution**: As new appointments sync, they'll be properly linked. Running a full appointment sync should improve linking over time.

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/migrations/*` | Added `calculate_preferred_stylists()` and `update_preferred_stylists()` |
| `supabase/functions/calculate-preferred-stylists/index.ts` | New edge function |
| `supabase/functions/sync-phorest-data/index.ts` | Auto-run calculation after client sync |
| `supabase/config.toml` | Added function config |
| `src/hooks/usePhorestSync.ts` | Added `useCalculatePreferredStylists()` hook |

---

## UI Integration (Pending)

Add a "Recalculate Assignments" button using:

```tsx
import { useCalculatePreferredStylists } from '@/hooks/usePhorestSync';

const calculatePreferred = useCalculatePreferredStylists();

<Button 
  onClick={() => calculatePreferred.mutate()}
  disabled={calculatePreferred.isPending}
>
  <RefreshCw className="w-4 h-4 mr-2" />
  Recalculate Assignments
</Button>
```
