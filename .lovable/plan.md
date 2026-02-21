

## Stylist Level Assignment Configurator

### What This Solves

There's currently no way in the settings UI to assign stylists to experience levels. The `employee_profiles.stylist_level` field exists but there's no dedicated configurator on the Stylist Levels page to manage assignments. Operators have to set levels individually somewhere else. This feature adds a "Level Assignments" card to the Stylist Levels settings page where you can assign each stylist to a level and get prompted to verify their services and overrides.

### What Gets Built

**1. Level Assignment Card (new section on Stylist Levels page)**

A new card below the Experience Levels card titled "LEVEL ASSIGNMENTS" with:
- A dropdown or list of all active stylists (filterable by location)
- Each stylist row shows their current level (or "Unassigned")
- A level picker (dropdown) per stylist to assign/change their level
- When a level is changed, a toast/prompt appears: "Level updated. Review [stylist name]'s services and pricing overrides?" with a link to the Services & Schedule settings page (staff service configurator)
- Visual grouping: stylists grouped by their current level, with unassigned stylists highlighted at the top

**2. Prompt Flow**

When assigning or changing a stylist's level:
1. Level is saved immediately to `employee_profiles.stylist_level`
2. A confirmation toast appears with an action button: "Review Services & Overrides" that navigates to `/dashboard/admin/settings?category=services` (the staff service configurator)
3. This ensures operators don't forget to check that service offerings and custom pricing/timing are correct after a level change

**3. Bulk Assignment**

- A "Set Level" bulk action: select multiple stylists via checkboxes, then assign them all to a level at once
- Same prompt to review services appears after bulk changes

### What the UI Looks Like

```text
LEVEL ASSIGNMENTS
Assign stylists to experience levels. Changing a level affects their
default commission rates and level-based pricing.

[Location: All v]

-- Unassigned (2) --
[ ] Jordan T.         [Select Level v]
[ ] New Stylist       [Select Level v]

-- New Talent (1) --
[ ] Rising Star       Level 1 - New Talent  [Change v]

-- Core Artist (1) --
[ ] Kristi D.         Level 3 - Core Artist [Change v]

[Set Level for Selected ▾]
```

### Technical Plan

**File: `src/components/dashboard/settings/StylistLevelAssignments.tsx` (new)**
- Fetches active employee profiles for the org (using existing `useTeamDirectory` or a lighter query)
- Fetches stylist levels via `useStylistLevels`
- Groups stylists by their current `stylist_level` value
- Each row has a Select dropdown with all available levels
- On change: updates `employee_profiles.stylist_level` via a mutation
- On success: shows a toast with "Review Services & Overrides" action button that navigates to the services settings tab
- Supports multi-select for bulk level assignment

**File: `src/hooks/useAssignStylistLevel.ts` (new)**
- `useAssignStylistLevel` mutation: updates `employee_profiles.stylist_level` for a given `user_id`
- `useBulkAssignStylistLevel` mutation: updates multiple stylists at once
- Invalidates `team-directory`, `employee-profile`, `stylists-by-level`, and `homepage-stylists` queries on success

**File: `src/components/dashboard/settings/StylistLevelsContent.tsx` (modified)**
- Import and render `StylistLevelAssignments` as a new card between the Experience Levels card and the Commission Overrides card
- Pass `orgId` and `levels` as props

### Data Flow

The `stylist_level` column on `employee_profiles` currently stores strings like `"LEVEL 3 STYLIST"`. The new configurator will write the `stylist_levels.slug` value instead (e.g., `"emerging"`, `"senior"`). The existing `getLevelSlug()` utility in `levelPricing.ts` handles the old format, and the commission resolution engine already maps slugs to level IDs -- so both formats will continue to work. Over time, all profiles will migrate to slug-based values.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/settings/StylistLevelAssignments.tsx` | New component: level assignment card with grouped stylist list, level pickers, bulk assign, and review prompt |
| `src/hooks/useAssignStylistLevel.ts` | New hook: single and bulk level assignment mutations |
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Import and render the new assignments card |

