
## Make Hours-Open Labels Bold on Capacity Utilization X-Axis

### Problem
The "Xh open" labels on the Capacity Utilization x-axis use muted, lightweight styling (`fill-muted-foreground text-[10px]`, no font-weight), while the Forecasting card's equivalent third line (appointment count) is bold. The "Closed" label is already bold but the hours-open label is not.

### Changes

**Both files: `CapacityUtilizationCard.tsx` and `CapacityUtilizationSection.tsx`**

Update the hours-open text element in the `DayXAxisTick` open-day branch:

Before:
```tsx
<text x={0} y={0} dy={38} textAnchor="middle" className="fill-muted-foreground text-[10px]">
  {day.gapHours > 0 ? `${day.gapHours}h open` : 'Full'}
</text>
```

After:
```tsx
<text x={0} y={0} dy={38} textAnchor="middle" className="fill-foreground text-[11px]" style={{ fontWeight: 500 }}>
  {day.gapHours > 0 ? `${day.gapHours}h open` : 'Full'}
</text>
```

This matches the "Closed" label styling (`fill-foreground text-[11px]`, `fontWeight: 500`) and aligns with the Forecasting card's appointment count typography.

### Files Modified
- `src/components/dashboard/sales/CapacityUtilizationCard.tsx`
- `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`
