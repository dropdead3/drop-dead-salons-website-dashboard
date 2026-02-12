

## Fix: Align Column Headers to Data Values

**Problem**: The sortable column headers use a `flex` button that left-aligns within the table cell, while the data values below are right-aligned via `text-right`. This creates a visual misalignment.

**Solution**: Add `ml-auto` (or `justify-end` with `w-full`) to the `SortHeader` button so it aligns to the right edge of the cell, matching the numeric data beneath it.

---

### Change

**File**: `src/components/dashboard/sales/location-comparison/LocationComparisonTable.tsx`

Update the `SortHeader` component (lines 85-96) to add `ml-auto` to the button class, pushing the flex content to the right side of the cell:

```tsx
const SortHeader = ({ label, column }: { label: string; column: SortKey }) => (
  <button
    className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
    onClick={() => toggleSort(column)}
  >
    {label}
    <ChevronsUpDown className={cn(
      'w-3 h-3',
      sortKey === column ? 'text-foreground' : 'text-muted-foreground/50'
    )} />
  </button>
);
```

This single addition (`ml-auto`) will push every sortable header flush-right to align with the `text-right` data cells below. No other files need changes.

