

## Move View Toggle Below KPI Cards

A simple layout repositioning -- move the "By Category | By Service" toggle from the card header's right column down into `CardContent`, placed between the 4 KPI summary tiles and the table.

### Changes

**File: `src/components/dashboard/sales/ServiceCostsProfitsCard.tsx`**

1. **Remove** `{viewToggle}` from the header's right-side `div` (line 311)
2. **Insert** `{viewToggle}` inside `CardContent`, after the KPI grid's closing `</div>` (after line 349) and before the table's `<div className="overflow-x-auto">` (line 352), with `mb-4` spacing

The toggle will sit naturally between the summary numbers and the data table, making it easier to scan KPIs first and then choose the level of detail. This also follows the design rule that sort/view toggles controlling table content belong inside `CardContent`.
