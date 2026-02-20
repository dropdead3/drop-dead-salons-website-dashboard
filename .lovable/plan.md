

# Add "Source" as a First-Class Client Data Point

## Problem

The `lead_source` field exists in the database and is editable in the Client Settings card, but:
- It's a free-text input with no standardized options, making aggregation impossible
- It's buried inside "Client Settings" -- not visible at a glance
- It's NULL for all 586 clients
- There's no way to filter or report by source in the client directory

## Solution

Make "Source" a prominent, standardized field with a dropdown of predefined options plus a custom "Other" entry, visible in both the client list and detail panel, and filterable in the directory.

---

## Changes

### 1. Standardized Source Options

Define a shared constant of common referral sources:

```text
Instagram, TikTok, Google, Yelp, Facebook, Referral (Friend/Family), 
Referral (Stylist), Walk-In, Website, Event, Other
```

This list will be used in the detail panel edit mode, the directory filter, and stats.

### 2. Client Detail Panel -- Promote Source Field

**File: `src/components/dashboard/ClientDetailSheet.tsx`**

- Move "Source" out of the buried Client Settings card and into the Contact Information card (or a new small card right below it) so it's immediately visible
- Replace the free-text `Input` with a `Select` dropdown using the standardized options, plus an "Other" option that reveals a text input
- Show the source as a colored Badge in read mode (e.g., Instagram = pink, Google = blue, Walk-In = gray, Referral = green)

### 3. Client Directory List -- Show Source Inline

**File: `src/pages/dashboard/ClientDirectory.tsx`**

- Add a small `lead_source` Badge next to location in each client row's metadata line (the line showing visits, last visit, location)
- Only display if `lead_source` is not null -- no visual noise for clients without data yet

### 4. Client Directory -- Add Source Filter

**File: `src/pages/dashboard/ClientDirectory.tsx`**

- Add a "Source" dropdown filter alongside the existing Location and Stylist filters
- Filter options populated from the standardized list, plus dynamic detection of any custom "Other" values in the data
- State variable `selectedSource` with default `'all'`

### 5. Source Stats Card

**File: `src/pages/dashboard/ClientDirectory.tsx`**

- Add a small "Top Source" stat card to the existing bento stats row showing the most common lead source (once data starts populating)
- Shows "No data" gracefully until sources are entered

---

## Technical Details

### New shared file: `src/lib/leadSources.ts`

```typescript
export const LEAD_SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referral_friend', label: 'Referral (Friend/Family)' },
  { value: 'referral_stylist', label: 'Referral (Stylist)' },
  { value: 'walk_in', label: 'Walk-In' },
  { value: 'website', label: 'Website' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
] as const;
```

### ClientDetailSheet.tsx changes (lines ~750-780)
- Replace `<Input>` for lead source with `<Select>` using LEAD_SOURCES options
- When "Other" is selected, show a secondary text input for custom entry
- In read mode, render `lead_source` as a styled Badge with color mapping
- Move the source display from "Client Settings" up to the contact/info section

### ClientDirectory.tsx changes (lines ~330-400, ~517-542)
- Add `selectedSource` state and a Source filter `<Select>` in the filter bar
- Add source badge inline in the client row metadata
- Add filtering logic in the `filteredClients` memo

### No database changes needed
The `lead_source` column already exists as `text` on `phorest_clients`. Standardized values are stored as lowercase slugs (e.g., `instagram`, `referral_friend`). Custom "Other" entries store the user's free text.

## Files Modified
- **New**: `src/lib/leadSources.ts` (shared constants + color mapping)
- **Edit**: `src/components/dashboard/ClientDetailSheet.tsx` (promote source field, use Select dropdown)
- **Edit**: `src/pages/dashboard/ClientDirectory.tsx` (source badge in rows, source filter, top source stat)

## Result
"Source" becomes a visible, standardized, filterable data point across the client experience -- ready for reporting and campaign attribution as data is entered.
