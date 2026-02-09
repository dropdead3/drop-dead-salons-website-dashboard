
# Fix Redundant "TeamTools" Section in Sidebar

## Problem Analysis

You have a **legacy "teamTools" section** saved in the database that's showing up as a separate section, while the same links also appear inside the "Management" section under the "Team Tools" collapsible group.

### Current Database State

```
sectionOrder: [main, stats, growth, teamTools, manager, housekeeping, website, adminOnly]
                                      ↑
                              This causes duplication!
```

The saved layout has `teamTools` as a standalone section, but the current codebase consolidated those links into the Management section's collapsible sub-groups.

### Root Cause

1. Previously, "Team Tools" was a standalone section
2. Code was refactored to move those links into the Management section as a collapsible sub-group
3. The saved `sectionOrder` in `business_settings.sidebar_layout` still contains the old `teamTools` section
4. Since `teamTools` isn't in `DEFAULT_SECTION_ORDER`, it's treated as a "custom section" and rendered separately
5. The same links also render in Management → Team Tools collapsible group

---

## Solution

### Option A: Update Database Layout (Recommended)

Remove `teamTools` from `sectionOrder` and `linkOrder` in the saved layout. This is a data fix.

**SQL to execute:**
```sql
UPDATE business_settings 
SET sidebar_layout = jsonb_set(
  jsonb_set(
    sidebar_layout::jsonb,
    '{sectionOrder}',
    '["main", "stats", "growth", "manager", "housekeeping", "website", "adminOnly"]'::jsonb
  ),
  '{linkOrder}',
  (sidebar_layout::jsonb->'linkOrder') - 'teamTools'
)
WHERE sidebar_layout IS NOT NULL;
```

### Option B: Code-Level Migration

Add a migration step in `useSidebarLayout` hook to automatically remove `teamTools` from legacy saved layouts.

---

## Implementation

I'll update the database to remove the redundant `teamTools` section from the saved layout. This will:

1. Remove `teamTools` from `sectionOrder`
2. Remove `teamTools` from `linkOrder`
3. Keep all other layout customizations intact

The links (Shift Swaps, Rewards, Assistant Scheduling, Meetings & Accountability) will continue to appear in the correct place: inside the **Management** section's **Team Tools** collapsible group.

---

## Files to Modify

| File | Change |
|------|--------|
| Database | Update `business_settings.sidebar_layout` to remove redundant section |

---

## Visual Result

**Before (Current - Redundant):**
```
TEAMTOOLS              ← Standalone section (redundant)
├── Assistant Scheduling
└── Meetings & Accountability

MANAGEMENT
├── Team Tools          ← Collapsible group (same links!)
│   ├── Schedule
│   ├── Assistant Scheduling
│   └── Meetings & Accountability
└── Analytics & Insights
    └── ...
```

**After (Fixed):**
```
MANAGEMENT
├── Team Tools          ← Links only appear here
│   ├── Schedule
│   ├── Shift Swaps
│   ├── Rewards
│   ├── Assistant Scheduling
│   └── Meetings & Accountability
├── Analytics & Insights
│   └── ...
└── ...
```
