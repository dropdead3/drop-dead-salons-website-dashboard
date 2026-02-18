

## Fix Bar Alignment in Service Costs and Sales Profits Card

### Problem

The "Total Sales" column renders the bar and dollar amount together in a flex row with `justify-end`. Because dollar amounts vary in character width ("$935.00" is narrower than "$2,479.00"), the bar's left edge shifts per row, creating the visual misalignment shown in the screenshot.

### Solution

Give the dollar amount a fixed minimum width so all bars start at the same horizontal position, regardless of the number of digits. The amount text will be left-aligned within that fixed space (matching the request to left-align numerical values), and the bar will always occupy the same fixed width to its left.

### Technical Change

**File: `src/components/dashboard/sales/ServiceCostsProfitsCard.tsx`**

Update the Total Sales cell (lines 223-235) to use a fixed-width amount span:

```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(barWidth, 1)}%`, backgroundColor: barColor }}
      />
    </div>
    <span className="text-sm tabular-nums min-w-[5.5rem] text-left">
      <BlurredAmount>{formatCurrency(row.totalSales)}</BlurredAmount>
    </span>
  </div>
</TableCell>
```

Key changes:
- Remove `text-right` and `justify-end` from the cell and inner flex -- the bar+amount pair will flow naturally left-to-right
- Add `flex-shrink-0` to the bar container so it never compresses
- Add `min-w-[5.5rem] text-left` to the amount span so all dollar values occupy the same horizontal space, left-aligned
- Also left-align the other numeric columns (# Services, Unit Cost, Total Cost, Profit, Margin) by removing `text-right` from their `TableCell` wrappers and using `text-left tabular-nums` instead, per the user's request for all numerical values to be left-aligned

