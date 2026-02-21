

# Phorest Write-Back Safety Gate

## Problem

Six edge functions currently make **write calls to the Phorest API** (POST, PUT, PATCH). As you begin testing native appointment creation, any booking or status change will push data into your live Phorest system, which is dangerous during development.

## Phorest Write-Back Inventory

| Edge Function | Write Type | Called From |
|---|---|---|
| `create-phorest-booking` | POST (create appointment) | QuickBookingPopover, NewBookingSheet, BookingWizard, PublicBooking |
| `update-phorest-appointment` | PUT (status/notes) | usePhorestCalendar, useTodaysQueue |
| `update-phorest-appointment-time` | PATCH (reschedule) | useRescheduleAppointment |
| `create-phorest-client` | POST (create client) | NewClientDialog |
| `sync-phorest-data` | POST (CSV export jobs) | Read-heavy but triggers Phorest exports |
| `check-phorest-availability` | GET (read-only) | No write risk |

## Solution: Organization-Level Write Gate

Add a `phorest_write_enabled` boolean to `organizations.settings` (default `false`). Each write-path edge function checks this flag before calling the Phorest API. If disabled, the function skips the Phorest call and operates on local/native data only.

This is safer than removing code because:
- Phorest write-back can be re-enabled per-org when ready
- No code paths break; they just skip the external call
- Native data (appointments table, clients table) still works

## Changes

### 1. Edge Functions (4 files)

Each function gets a guard at the top, after loading the org context:

**`create-phorest-booking/index.ts`**
- After credential check, look up org settings via the `branch_id` -> `locations` -> `organizations` join
- If `phorest_write_enabled` is not `true`, skip the `phorestRequest(POST)` call
- Still create the local `phorest_appointments` record (or better, use the native `create_booking` RPC instead)
- Log: "Phorest write-back disabled for this organization, local-only booking created"

**`update-phorest-appointment/index.ts`**
- Look up org from the appointment record
- If `phorest_write_enabled` is not `true`, skip the `phorestRequest(PUT)` call
- Still update the local `phorest_appointments` record

**`update-phorest-appointment-time/index.ts`**
- Same pattern: skip the PATCH call if write-back is disabled
- Still update local appointment times

**`create-phorest-client/index.ts`**
- Skip the POST to Phorest
- Still create/update the local client record

### 2. Booking Flow: Route to Native `create-booking`

For new bookings when Phorest write-back is off, the `create-phorest-booking` function should delegate to the native `create_booking` DB function (which writes to the `appointments` table). This means:
- Bookings created during testing land in the native `appointments` table
- No data pushed to Phorest
- The schedule calendar already reads from both `appointments` and `phorest_appointments`

### 3. Settings UI (optional, lightweight)

Add a toggle in the existing Phorest Settings page (or org settings) labeled:
- "Sync changes back to Phorest"
- Default: OFF
- Only visible to super_admin / primary_owner

### 4. No Migration Required

`organizations.settings` is already a JSONB column. The `phorest_write_enabled` key is read from settings with a default of `false` -- no schema change needed.

## What This Does NOT Change

- **Phorest read/sync**: `sync-phorest-data` and `sync-phorest-services` continue pulling data FROM Phorest (read-only). These are safe.
- **Existing appointments**: No existing data is modified.
- **Native booking flow**: The `create-booking` edge function and `create_booking` DB function are already Phorest-free and continue to work.

## File Summary

| File | Action |
|---|---|
| `supabase/functions/create-phorest-booking/index.ts` | Add write-gate; delegate to native `create_booking` when off |
| `supabase/functions/update-phorest-appointment/index.ts` | Add write-gate around Phorest PUT |
| `supabase/functions/update-phorest-appointment-time/index.ts` | Add write-gate around Phorest PATCH |
| `supabase/functions/create-phorest-client/index.ts` | Add write-gate around Phorest POST |
| Phorest Settings UI component | Add "Sync to Phorest" toggle (if desired) |

## Rollback

To re-enable Phorest write-back later, set `phorest_write_enabled: true` in the organization settings. All write paths immediately resume pushing to Phorest with zero code changes.

