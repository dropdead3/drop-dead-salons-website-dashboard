

# Fix Settings Category Card Heights for Uniform Grid

## Problem

The Kiosks card has a longer description ("Check-in, self-service booking & device configuration") that wraps to two lines, making it taller than sibling cards whose descriptions fit on one line. This breaks the visual cohesion of the settings grid.

## Solution

Add a minimum height to the `CardDescription` area within the `SettingsCategoryCard` component so all cards reserve space for two lines of description text. This ensures uniform card heights regardless of description length.

## Change

**File: `src/pages/dashboard/admin/Settings.tsx`** (SettingsCategoryCard component, ~line 251-254)

Update the `CardContent` section to add a `min-h-[2.5rem]` (40px, enough for two lines of `text-sm`) on the `CardDescription`:

```tsx
// Before:
<CardContent>
  <CardTitle className="font-display text-lg mb-1">{category.label}</CardTitle>
  <CardDescription>{category.description}</CardDescription>
</CardContent>

// After:
<CardContent>
  <CardTitle className="font-display text-lg mb-1">{category.label}</CardTitle>
  <CardDescription className="min-h-[2.5rem]">{category.description}</CardDescription>
</CardContent>
```

This is a single-line change that forces all description areas to the same minimum height (two lines of small text), so shorter descriptions get bottom padding while longer ones display naturally. No layout, grid, or other component changes needed.
