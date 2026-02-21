

# Add Preferred Stylist Selection to Client Detail Sheet

## What This Adds

1. **Preferred Stylist display and edit** in the Client Detail Sheet's Settings card -- a dropdown populated from the team directory, allowing staff to manually assign a client's preferred stylist.

2. **Inactive stylist handling** -- when a preferred stylist is archived (`is_active = false`), the client directory and detail sheet show their name with a visual indicator like "Sarina L. (no longer active)" instead of silently hiding the assignment.

## Implementation

### 1. Client Detail Sheet (`src/components/dashboard/ClientDetailSheet.tsx`)

- Add `preferred_stylist_id` to the `Client` interface
- In the Settings card (where lead source, category, etc. live), add a "Preferred Stylist" row
- **View mode**: Show the stylist's display name (fetched via a lightweight query), or "None assigned"
  - If the stylist is inactive: show name + muted "(no longer active)" label
- **Edit mode**: Show a `Select` dropdown populated from active team members
  - Include a "None" option to clear the assignment
  - If current preferred stylist is inactive, show them as a disabled option at the top with "(inactive)" label so the assignment is visible but not re-selectable
- Save updates to `preferred_stylist_id` on the `clients` table (for native clients) or `phorest_clients` table (for Phorest clients)

### 2. Preferred Stylist Data Hook

- Create a small helper or inline query in the detail sheet that fetches `employee_profiles` for the preferred stylist ID to get `display_name` and `is_active`
- For the edit dropdown, reuse the existing `useTeamDirectory` hook (already fetches active employees)

### 3. Client Directory (`src/pages/dashboard/ClientDirectory.tsx`)

- Where `preferred_stylist_id` is already available in the data, resolve the stylist name for display
- If the stylist is inactive, append a visual indicator (muted text or badge)

### 4. New Client Dialog (`src/components/dashboard/schedule/NewClientDialog.tsx`)

- Add a "Preferred Stylist" dropdown field to the new client form
- Populated from active team members via `useTeamDirectory`
- Optional field -- defaults to "None"

## Technical Details

### Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/ClientDetailSheet.tsx` | Add `preferred_stylist_id` to interface, add stylist display/edit in Settings card, fetch stylist profile |
| `src/pages/dashboard/ClientDirectory.tsx` | Resolve and display preferred stylist name with inactive indicator |
| `src/components/dashboard/schedule/NewClientDialog.tsx` | Add optional preferred stylist dropdown |
| `src/hooks/usePreferredStylist.ts` (new) | Small hook to fetch stylist name + active status by user ID |

### Data Flow

- `clients.preferred_stylist_id` references `employee_profiles.user_id`
- `employee_profiles.is_active` determines whether to show "(no longer active)"
- No schema changes needed -- `preferred_stylist_id` already exists on both `clients` and `phorest_clients` tables

### Inactive Stylist Display Rules

- Client detail view: "Sarina L." shown normally if active; "Sarina L. (no longer active)" with muted styling if archived
- Client directory list: Same pattern -- name visible, muted indicator if inactive
- Edit dropdown: Only active stylists appear as selectable options; if current assignment is inactive, show as disabled top option for context
- The `preferred_stylist_id` is NOT automatically cleared when a stylist is archived -- it preserves the historical assignment

