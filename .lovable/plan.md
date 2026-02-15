

## Fix Top Padding on Top Performers Card Header

### Problem
The trophy icon container has less space above it (8px from `py-2`) than on the sides (16px from `px-4`), creating an unbalanced look.

### Change

**File: `src/components/dashboard/sales/TopPerformersCard.tsx`**

Update all three `CardHeader` instances (loading, empty, and populated states) from:
```
className="px-4 py-2 pb-1"
```
to:
```
className="px-4 pt-4 pb-1"
```

This sets the top padding to 16px (`pt-4`), matching the 16px side padding (`px-4`), while keeping the bottom padding tight at 4px (`pb-1`).

