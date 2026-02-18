

# Merge Handbooks into Onboarding Settings

## What Changes

The standalone "Handbooks" settings card gets absorbed into the "Onboarding" settings card. Handbooks are part of the onboarding process, so they belong together. After this change, clicking "Onboarding" in settings gives you three tabs instead of two: **Tasks**, **Requests & Docs**, and **Handbooks**.

The separate "Handbooks" card disappears from the settings grid entirely.

## Changes

### 1. Update OnboardingConfigurator -- add Handbooks tab

**File: `src/components/dashboard/settings/OnboardingConfigurator.tsx`**

- Import `HandbooksContent`
- Change the inner `Tabs` from a 2-column grid to a 3-column grid
- Add a third tab trigger: "Handbooks" with a `BookOpen` icon
- Add a `TabsContent` for "handbooks" that renders `<HandbooksContent />`
- Update the card description to: "Tasks, role configuration & team handbooks"

### 2. Remove handbooks category from Settings.tsx

**File: `src/pages/dashboard/admin/Settings.tsx`**

- Remove `handbooks` from the `SettingsCategory` type union
- Remove the `handbooks` entry from the categories object (~lines 782-787)
- Remove the `{activeCategory === 'handbooks' && <HandbooksContent />}` render block (~line 1397)
- Remove the `HandbooksContent` import (line 80) since it moves to OnboardingConfigurator

### 3. Remove handbooks from settings layout defaults

**File: `src/hooks/useSettingsLayout.ts`**

- Remove `'handbooks'` from `DEFAULT_ICON_COLORS`
- Remove `'handbooks'` from the `operations` group in `SECTION_GROUPS`
- Remove `'handbooks'` from `DEFAULT_ORDER` (derived automatically)

### 4. Update Onboarding card description

**File: `src/pages/dashboard/admin/Settings.tsx`**

- Change the onboarding category description from "Tasks & role configuration" to "Tasks, handbooks & role configuration"

## What Stays the Same

- `HandbooksContent` component itself is unchanged -- it just renders inside a different parent
- The `handbooks` database table, RLS policies, and all handbook CRUD logic remain untouched
- The onboarding card icon (Rocket) stays the same
- All other settings categories are unaffected
