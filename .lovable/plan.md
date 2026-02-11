

# Fix After-Service Rebook: Missing Client Data in Sync

## Root Cause

The Phorest sync function intentionally drops `phorest_client_id` from appointments when the client does not already exist in the local `phorest_clients` table. Out of 321 total appointments, only 53 (16.5%) have a `phorest_client_id` populated. Yesterday, only 5 of 20 appointments had client IDs linked.

This means 75% of appointments are invisible to any client-based analytics -- including new/returning classification and rebook rate.

The code at line 330 of `sync-phorest-data/index.ts`:
```text
phorest_client_id: localClientId  // null if client not in local DB
```

Should instead always store the raw ID from the Phorest API, since it serves as a grouping key for analytics (not a foreign key constraint).

## Fix Plan

### 1. Fix the sync function (`supabase/functions/sync-phorest-data/index.ts`)

- **Line 330**: Change from `localClientId` to the raw `phorestClientId` value from the API response. This ensures every appointment with a client in Phorest gets properly tagged, regardless of whether that client has been separately synced to the local table.
- Keep the existing client lookup logic (lines 311-322) for logging purposes, but do not gate the `phorest_client_id` field on it.

### 2. Backfill existing appointments

- Run a one-time data fix after deploying the sync update. Re-trigger a sync (or write a targeted update query) to populate `phorest_client_id` on the 268 appointments currently missing it. The simplest approach: re-run the sync for recent date ranges, which will now correctly upsert the client IDs.

### 3. No changes needed in `useNewBookings.ts`

The rebook logic is already correct -- it groups by `phorest_client_id`, checks for prior visits, and looks for future appointments. It will work properly once the data is populated.

## What This Fixes

- "New Clients" and "Returning Clients" counts will reflect all booked clients, not just the 16% with local records.
- "After-Service Rebook" will correctly identify returning clients who scheduled future appointments.
- All downstream analytics (rebook rate, client retention, stylist experience scores) that depend on `phorest_client_id` will become accurate.

## Technical Detail

**File**: `supabase/functions/sync-phorest-data/index.ts`

Change line 330 from:
```text
phorest_client_id: localClientId,
```
to:
```text
phorest_client_id: phorestClientId,
```

This is a one-line fix in the sync function. After deploying, the next sync cycle will backfill the missing client IDs for any appointments it processes. For historical data outside the sync window, a manual re-sync or SQL update may be needed.
