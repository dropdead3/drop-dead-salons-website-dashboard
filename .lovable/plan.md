

# Tokenize Compact Filter Toggle and Standardize All Analytics Cards

## What Changes

### 1. Add compact filter variant to the token system

Add `filterList` and `filterTrigger` entries to `TABS_CLASSES` in `src/components/ui/tabs.tokens.ts`. These encode the compact size (h-8, p-1, text-xs, px-2.5 py-1) used for inline filter toggles on analytics cards, distinct from the full-size page-level tabs.

### 2. Create FilterTabsList and FilterTabsTrigger components

Add these two thin wrapper components to `src/components/ui/tabs.tsx` that automatically apply the compact token classes. This means card code becomes:

```text
<Tabs value={...} onValueChange={...}>
  <FilterTabsList>
    <FilterTabsTrigger value="7days">7 Days</FilterTabsTrigger>
    <FilterTabsTrigger value="30days">30 Days</FilterTabsTrigger>
  </FilterTabsList>
</Tabs>
```

No more inline `className="h-8 p-1"` / `className="text-xs px-2.5 py-1"` scattered across cards.

### 3. Update all analytics cards to use the new filter components

| File | Current Pattern | Change |
|------|----------------|--------|
| `sales/ForecastingCard.tsx` | `TabsList className="h-8 p-1"` + inline trigger classes | Switch to `FilterTabsList` / `FilterTabsTrigger` (both selectors) |
| `sales/CapacityUtilizationCard.tsx` | `ToggleGroup` with custom classes | Replace with `Tabs` + `FilterTabsList` / `FilterTabsTrigger` |
| `sales/GrowthForecastCard.tsx` | `ToggleGroup` with custom classes | Replace with `Tabs` + `FilterTabsList` / `FilterTabsTrigger` |
| `sales/ServicePopularityChart.tsx` | `TabsList className="mb-4"` (full-size, oversized for context) | Switch to `FilterTabsList` / `FilterTabsTrigger` |
| `analytics/StaffRevenueLeaderboard.tsx` | `TabsList className="h-8"` + partial inline classes | Switch to `FilterTabsList` / `FilterTabsTrigger` |

### Token Values

```
filterList:    "inline-flex h-8 items-center justify-center p-1 text-muted-foreground gap-0.5 bg-muted/70 rounded-[7px]"
filterTrigger: "inline-flex items-center justify-center whitespace-nowrap rounded-[5px] px-2.5 py-1 text-xs font-medium ..."
               (same active/focus states as standard trigger)
```

The 7px/5px radii maintain the 2px nested offset ratio from the standard 9px/6px pair, scaled down proportionally.

## Files Changed

1. **`src/components/ui/tabs.tokens.ts`** -- Add `filterList` and `filterTrigger` token strings
2. **`src/components/ui/tabs.tsx`** -- Add `FilterTabsList` and `FilterTabsTrigger` components, export them
3. **`src/components/dashboard/sales/ForecastingCard.tsx`** -- Use new filter components (both selectors)
4. **`src/components/dashboard/sales/CapacityUtilizationCard.tsx`** -- Replace ToggleGroup with filter tabs
5. **`src/components/dashboard/sales/GrowthForecastCard.tsx`** -- Replace ToggleGroup with filter tabs
6. **`src/components/dashboard/sales/ServicePopularityChart.tsx`** -- Use new filter components
7. **`src/components/dashboard/analytics/StaffRevenueLeaderboard.tsx`** -- Use new filter components
