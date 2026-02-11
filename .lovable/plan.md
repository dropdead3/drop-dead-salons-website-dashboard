

# Organization Quick-Switch with Favorites on Platform Overview

## What This Does
Adds a prominent organization toggle directly on the Platform Overview page -- a searchable dropdown that lets you quickly jump into any organization's dashboard. Organizations you visit often can be starred/favorited and will float to the top of the list automatically.

## User Experience

### The Toggle
- Placed in the Platform Overview header area, next to the "New Account" button
- Styled as a prominent dropdown button showing "Switch to Account..." placeholder
- Opens a popover with a search bar and categorized org list

### Search + Favorites
- Search bar at top filters organizations by name, slug, or account number
- Favorited orgs appear in a "Pinned" section at the top, marked with a filled star icon
- Remaining orgs appear below under "All Accounts"
- Click the star icon on any org to toggle favorite status
- Selecting an org sets it as the active context and navigates to `/dashboard`

### Favorite Persistence
- Favorites are stored in a new `platform_favorite_organizations` database table
- Tied to the platform user's ID so each admin has their own pinned list
- Persists across sessions

## Visual Layout

```text
Platform Overview Header:
+-------------------------------------------------------------+
| GOOD MORNING, ERIC                 [Switch to Account v] [+ New Account] |
| Early start -- here's your platform...                                    |
+-------------------------------------------------------------+

Dropdown open:
+-----------------------------------+
| [Search accounts...]              |
|-----------------------------------|
| * PINNED                          |
| [star] Drop Dead Salons  #001    |
|-----------------------------------|
| ALL ACCOUNTS                      |
| [star] Acme Hair Studio  #002   |
| [star] Belle Salon       #003   |
+-----------------------------------+
```

---

## Technical Details

### New Database Table: `platform_favorite_organizations`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default `gen_random_uuid()` |
| user_id | uuid | References `auth.users`, not null |
| organization_id | uuid | References `organizations`, not null |
| created_at | timestamptz | Default `now()` |

- Unique constraint on `(user_id, organization_id)`
- RLS: users can only read/write their own favorites

### New Component: `src/components/platform/PlatformOrgQuickSwitch.tsx`

A self-contained popover component:
- Uses `useOrganizations()` to fetch all orgs
- New `useFavoriteOrganizations()` hook to fetch/toggle favorites
- `Command` + `CommandInput` + `CommandGroup` for searchable dropdown (reusing existing cmdk pattern from `OrganizationSwitcher`)
- Star icon (`Star` from lucide) on each row -- filled for favorites, outlined for non-favorites
- Click star = toggle mutation, click row = navigate to org dashboard
- Separates list into "Pinned" and "All Accounts" groups

### New Hook: `src/hooks/useFavoriteOrganizations.ts`

- `useFavoriteOrganizations()` -- query to fetch user's favorites
- `useToggleFavoriteOrg()` -- mutation to insert/delete from `platform_favorite_organizations`
- Optimistic updates for instant star toggle feedback

### Modified File: `src/pages/dashboard/platform/Overview.tsx`

- Import and render `PlatformOrgQuickSwitch` in the header, between the greeting and "New Account" button
- No other changes to the overview page

### Files Changed

| File | Change |
|---|---|
| Migration SQL | Create `platform_favorite_organizations` table with RLS |
| `src/hooks/useFavoriteOrganizations.ts` | New hook for fetching and toggling favorite orgs |
| `src/components/platform/PlatformOrgQuickSwitch.tsx` | New searchable org dropdown with favorites pinning |
| `src/pages/dashboard/platform/Overview.tsx` | Add quick-switch component to header area |
