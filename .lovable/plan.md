

# Add Gender to Create-Client Flow and Update Phorest Sync Mapping

## Problem

Two gaps remain after the Phorest field alignment:

1. The **New Client Dialog** (`NewClientDialog.tsx`) does not include a Gender dropdown, so clients created through the booking flow won't have gender mapped to Phorest.
2. The **Phorest sync function** (`sync-phorest-data/index.ts`) does not pull any of the 16 new fields during import -- meaning data already in Phorest (gender, landline, address, etc.) never flows into local records.

## Changes

### 1. Add Gender Dropdown to NewClientDialog

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx`

- Add `gender` state variable (default empty string)
- Add a Gender `Select` dropdown between Last Name and Location fields, using the same four options as the edit form: Male, Female, Non-Binary, Prefer not to say
- Pass `gender` to the `create-phorest-client` edge function body
- Reset `gender` in `resetForm()`

### 2. Update create-phorest-client Edge Function

**File:** `supabase/functions/create-phorest-client/index.ts`

- The edge function already accepts and stores `gender` -- no changes needed here.

### 3. Update Phorest Sync to Map New Fields

**File:** `supabase/functions/sync-phorest-data/index.ts`

Update the `syncClients` function's `clientRecord` object (around line 484-500) to include the new fields from the Phorest API response:

```text
Current mapping (line 484-500):
  phorest_client_id, name, email, phone, visit_count, last_visit,
  first_visit, preferred_stylist_id, total_spend, is_vip, notes,
  location_id, phorest_branch_id, branch_name

Add these mappings:
  first_name    <- client.firstName
  last_name     <- client.lastName
  gender        <- client.gender
  landline      <- client.landline
  birthday      <- client.dateOfBirth or client.birthday
  client_since  <- client.createdAt (already used for first_visit)
  client_category <- client.clientCategory
  referred_by   <- client.referredBy
  address_line1 <- client.address?.streetAddress1 or client.streetAddress1
  address_line2 <- client.address?.streetAddress2 or client.streetAddress2
  city          <- client.address?.city or client.city
  state         <- client.address?.state or client.state
  zip           <- client.address?.zip or client.zip
  country       <- client.address?.country or client.country
```

The Phorest API returns these fields on client objects, but the sync currently discards them. Each field will use optional chaining with a null fallback so missing data from Phorest doesn't cause errors.

## Files Modified

1. `src/components/dashboard/schedule/NewClientDialog.tsx` -- Add gender dropdown
2. `supabase/functions/sync-phorest-data/index.ts` -- Map 14 additional Phorest fields in syncClients

## Notes

- Gender values from Phorest may not exactly match our dropdown options (Male/Female/Non-Binary/Prefer not to say). The sync will store whatever Phorest returns as-is since it's a text column.
- The upsert on `phorest_client_id` means existing local records will be enriched with the new fields on the next sync run.
- No database migration needed -- the columns were already added in the previous step.

