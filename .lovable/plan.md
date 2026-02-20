

# Align Client Fields with Phorest Data Model

## Problem

The current `phorest_clients` table is missing several fields that Phorest uses for client management. This creates a mapping gap between local data and the POS system.

## Fields Comparison

| Phorest Field | Current Status | Action |
|---|---|---|
| First Name | Missing (only `name`) | Add `first_name` column |
| Last Name | Missing (only `name`) | Add `last_name` column |
| Gender | Missing | Add `gender` column |
| Phone Number | Exists (`phone`) | No change |
| Landline | Missing | Add `landline` column |
| Email | Exists | No change |
| Date of Birth | Exists (`birthday`) | No change |
| Marketing Permissions (Email) | In `client_email_preferences` | Keep as-is |
| Marketing Permissions (SMS) | In `client_email_preferences` | Keep as-is |
| Reminder Consent (Email) | Missing | Add `reminder_email_opt_in` |
| Reminder Consent (SMS) | Missing | Add `reminder_sms_opt_in` |
| Client Category | Missing | Add `client_category` column |
| Preferred Staff Member | Exists (`preferred_stylist_id`) | No change |
| Where did they hear of us | Exists (`lead_source`) | No change |
| Referred By | Missing | Add `referred_by` column |
| Client ID (external/medical) | Missing | Add `external_client_id` column |
| Prompt on client notes | Missing | Add `prompt_client_notes` |
| Prompt on appointment notes | Missing | Add `prompt_appointment_notes` |
| Address Line 1 | Missing | Add `address_line1` |
| Address Line 2 | Missing | Add `address_line2` |
| City | Missing | Add `city` |
| State/Region | Missing | Add `state` |
| Zip/Postcode | Missing | Add `zip` |
| Country | Missing | Add `country` |

---

## Changes

### 1. Database Migration

Add 16 new columns to `phorest_clients`:

- `first_name` (text, nullable) -- split from `name`
- `last_name` (text, nullable) -- split from `name`
- `gender` (text, nullable) -- values: Male, Female, Non-Binary, Prefer not to say
- `landline` (text, nullable)
- `reminder_email_opt_in` (boolean, default true)
- `reminder_sms_opt_in` (boolean, default true)
- `client_category` (text, nullable)
- `referred_by` (text, nullable)
- `external_client_id` (text, nullable) -- medical/national ID
- `prompt_client_notes` (boolean, default false)
- `prompt_appointment_notes` (boolean, default false)
- `address_line1` (text, nullable)
- `address_line2` (text, nullable)
- `city` (text, nullable)
- `state` (text, nullable)
- `zip` (text, nullable)
- `country` (text, nullable)

After adding columns, backfill `first_name` and `last_name` by splitting the existing `name` column.

### 2. Client Detail Sheet Updates

Reorganize the edit form to match Phorest's structure with these sections:

**Contact Information card** -- First Name, Last Name, Gender, Phone, Landline, Email (edit mode shows all fields in a 2-column grid)

**Important Dates card** -- Birthday, Client Since (no change)

**Notifications card** (new, replaces current Marketing Status) -- Marketing Permissions (Email/SMS toggles) and Reminder Consent (Email/SMS toggles) in a 2-column layout

**Client Settings card** (new) -- Client Category, Preferred Staff Member (display only), Where did they hear (lead_source), Referred By, External Client ID

**Prompts card** (new) -- Prompt on client notes checkbox, Prompt on appointment notes checkbox

**Address card** (new) -- Address Line 1, Line 2, City, State/Region, Zip, Country (edit mode shows 2-column grid)

### 3. Client Interface Update

Expand the `Client` interface in `ClientDetailSheet.tsx` to include all new fields so they can be displayed and edited.

### 4. Save Mutation Update

Update the `saveMutation` to save `first_name` and `last_name` as separate columns (alongside keeping `name` as a computed concatenation). Add new mutations for the additional sections (settings, address, notifications, prompts).

### 5. Create Client Edge Function

Update `create-phorest-client` to accept and store the new fields when creating clients.

### 6. Sync Edge Function

Update the Phorest sync functions to map these new fields during import so data flows correctly from Phorest into the local database.

---

## Files Modified

1. **New migration SQL** -- Add 16 columns, backfill first/last name
2. **`src/components/dashboard/ClientDetailSheet.tsx`** -- Restructure edit form into Phorest-aligned sections, add new field states and mutations
3. **`src/components/dashboard/clients/ClientMarketingStatus.tsx`** -- Extend to include Reminder Consent toggles alongside Marketing Permissions
4. **`supabase/functions/create-phorest-client/index.ts`** -- Accept and store new fields
5. **Client Directory query** -- Ensure new fields are selected when loading client data

## Notes

- The `name` column will continue to be maintained as a concatenation of `first_name + last_name` for backward compatibility with all existing queries and UI that reference `name`.
- Address and settings sections only appear in expanded edit mode to keep the default view clean.
- All new fields are nullable so existing data and flows are unaffected.

