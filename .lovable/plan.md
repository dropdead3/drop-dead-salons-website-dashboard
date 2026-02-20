

# Add Client Birthday and Anniversary to Client Directory

## Overview

Add `birthday` and `client_since` (anniversary) date fields to the client data model, capture them when creating new clients, display them in client detail views, and surface upcoming client birthdays/anniversaries for proactive engagement.

## Database Changes

Add two columns to the `clients` table:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `birthday` | `date` | NULL | Client's birthdate |
| `client_since` | `date` | `created_at::date` | Date they became a client (editable anniversary date) |

For existing clients, `client_since` will default to the date the record was created.

## UI Changes

### 1. New Client Dialog (`NewClientDialog.tsx`)

Add two optional date inputs after the phone field:

- **Birthday** -- date picker input (optional)
- **Client Since** -- date picker input, defaults to today (optional, auto-populated)

These get passed through to the `create-phorest-client` edge function and saved to the local `clients` table.

### 2. Client Detail Sheet (`ClientDetailSheet.tsx`)

In the Contact Information card, add:

- Birthday row with Cake icon (e.g., "Mar 15" or "March 15, 1990")
- Client Since row with Heart/Award icon (e.g., "Client since Jan 2023 -- 2 years")

### 3. Client Profile View in Booking Popover (`ClientProfileView.tsx`)

Show birthday and client anniversary if available, consistent with the detail sheet.

### 4. Client Directory Table

No changes to the main table columns -- birthday/anniversary are detail-level fields shown in the sheet.

## Edge Function Update

### `create-phorest-client/index.ts`

Accept optional `birthday` and `client_since` fields in the request body. When inserting into the local `clients` table after Phorest sync, include these fields.

## Data Flow

```text
New Client Dialog
  --> Edge Function (create-phorest-client)
    --> Phorest API (create client -- birthday if supported)
    --> Local clients table (birthday + client_since columns)

Client Detail Sheet / Profile View
  --> Query clients table
  --> Display birthday + client_since
```

## Files Modified

1. **Migration SQL** -- Add `birthday` and `client_since` columns to `clients` table
2. **`supabase/functions/create-phorest-client/index.ts`** -- Accept and store new fields
3. **`src/components/dashboard/schedule/NewClientDialog.tsx`** -- Add birthday and client_since date inputs
4. **`src/components/dashboard/ClientDetailSheet.tsx`** -- Display birthday and anniversary in contact info
5. **`src/components/dashboard/schedule/booking/ClientProfileView.tsx`** -- Display birthday if available
6. **`src/pages/dashboard/ClientDirectory.tsx`** -- Pass new fields through the Client interface if needed

## Future Opportunities

- Surface upcoming client birthdays in a dashboard widget (similar to team birthday widget)
- Auto-generate birthday discount offers via the marketing platform
- Client anniversary milestone recognition (1 year, 5 years, etc.)
- Birthday/anniversary filters in the Client Health Hub
