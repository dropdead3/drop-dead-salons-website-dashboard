

## Move View Toggle to Card Header (Top Right)

The "By Service / By Category" toggle on the **Service Popularity** card is currently stacked vertically inside `CardContent`, below the header. Per the card header design rules, toggles like this belong in the **right column** of the card header, next to the filter badge and stat badges.

### What Changes

**File: `src/components/dashboard/sales/ServicePopularityChart.tsx`**

1. Move the "By Service / By Category" `FilterTabsList` from `CardContent` (line 582) into the `CardHeader` right column (after the filter badge and stat badges, around line 568-577)
2. Remove the `mb-4` spacing class since it will no longer need bottom margin in the header context

The header right column will become:
```text
[AnalyticsFilterBadge] [139 services] [$15,553] [By Service | By Category]
```

The "By Revenue / By Frequency" sort toggle remains inside `CardContent` -- that is correct per the design rules (sort controls stay in the body).

**File: `src/CARD_HEADER_DESIGN_RULES.md`**

3. Add a clarification under Rule 4 that **view-level toggles** (e.g., "By Service / By Category") belong in the header right column alongside filter badges, while **sort toggles** (e.g., "By Revenue / By Frequency") remain inside `CardContent`.

### No other cards affected
The remaining cards on the Services tab (Efficiency Matrix, Rebooking Rates, Price Realization, Demand Trends, Client Type, Bundling Intelligence) all follow the correct header layout already.
