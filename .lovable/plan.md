

## Consolidate Service Bundling Intelligence into a Single Card

The three separate `<Card>` elements inside `ServiceBundlingIntelligence.tsx` will be merged into one unified card with internal sections separated by dividers.

### Current Structure (3 standalone cards)
```text
[Card] Standalone vs. Grouped
[Card] Revenue Lift from Grouping
[Card] Category Pairing Heatmap
```

### New Structure (1 card, 3 sections)
```text
[Card] SERVICE BUNDLING INTELLIGENCE
  |-- Icon + Title + Tooltip + FilterBadge (single header)
  |-- Section: Standalone vs. Grouped (with subheading)
  |-- Separator
  |-- Section: Revenue Lift from Grouping (with subheading)
  |-- Separator
  |-- Section: Category Pairing Heatmap (with subheading)
```

### Technical Changes

**File: `src/components/dashboard/sales/ServiceBundlingIntelligence.tsx`**

1. Remove the outer `<div className="space-y-4">` wrapper and the three inner `<Card>` elements
2. Replace with a single `<Card>` that has one `<CardHeader>` using the standard two-column layout:
   - Left: Layers icon + "SERVICE BUNDLING INTELLIGENCE" title + MetricInfoTooltip + CardDescription
   - Right: `AnalyticsFilterBadge`
3. Single `<CardContent>` containing three internal sections, each with:
   - A small subheading (e.g., `text-sm font-medium` label like "Standalone vs. Grouped")
   - The existing content (bar charts, table, heatmap)
   - A `<Separator>` between sections
4. Remove the redundant icon containers, CardHeaders, and CardTitles from the former sub-cards

This eliminates the visual confusion of three cards that appear independent but are really one analytical unit, and ensures a single `AnalyticsFilterBadge` correctly represents the shared filter context.

