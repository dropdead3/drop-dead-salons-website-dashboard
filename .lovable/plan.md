

## Fix Profit and Margin Text Color

### Problem

The profit values and margin percentages use `text-success`, which resolves to `hsl(145 40% 85%)` — a very light pastel green designed for backgrounds/badges, not body text. This makes the numbers nearly invisible against the white card background, as shown in the screenshot.

### Solution

Switch all profit/margin text from `text-success` to `text-success-foreground`, which resolves to `hsl(145 50% 30%)` — a rich, readable green that maintains the cohesive color ramp while being clearly legible.

### Changes

**File: `src/components/dashboard/sales/ServiceCostsProfitsCard.tsx`**

Update every instance of `text-success` to `text-success-foreground`:

1. **Summary KPI tiles** — "Total Profit" and "Avg Margin" large stat values
2. **Category subtotal rows** — profit and margin in collapsed category headers
3. **Individual service rows** — profit column and margin column conditional classes
4. **Totals row** — profit and margin in the bottom summary row

All conditional logic stays the same (positive = green, negative = destructive). Only the green shade changes from the background-tier pastel to the foreground-tier rich green.

