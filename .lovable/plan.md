

## Standardize Warning/Status Badges Across the Dashboard

### Problem

Two visually similar badges use completely different styling approaches, creating an inconsistent experience:

| Badge | Current Style | Visual Result |
|-------|--------------|---------------|
| "18% utilized" (Capacity) | `Badge variant="destructive"` | Solid red fill, white text, heavy shadow |
| "Behind Pace" (Goal Tracker) | Custom `div` with `bg-destructive/10 text-destructive` | Soft red tint, red text, no fill |

The soft pill style (used by Goal Tracker) better matches the project's calm, luxury aesthetic. The solid `Badge` variant feels clinical and heavy by comparison.

### Solution

Replace the `Badge` component usage in both Capacity Utilization cards with the same soft pill pattern used by the Goal Tracker pace badges. This creates a unified "status pill" language across the dashboard.

### Unified Status Pill Pattern

All three states (good / warning / critical) will use the same soft-tint formula:

```text
Good (>=70%):    bg-chart-2/10 text-chart-2      (soft green tint)
Warning (50-69%): bg-amber-500/10 text-amber-600  (soft amber tint)
Critical (<50%):  bg-destructive/10 text-destructive (soft red tint)
```

### Files to Modify

**1. `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- Replace the `Badge` component at line 209 with a styled `span` using the soft pill pattern
- Remove the `getUtilizationBadgeVariant` function (no longer needed)
- Add a new `getUtilizationPillClasses` function returning the appropriate soft-tint classes
- The badge at line 372 (single-day detail view) gets the same treatment

**2. `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`**
- Same changes: replace `Badge` at line 199 with the soft pill pattern
- Remove `getUtilizationBadgeVariant`, add `getUtilizationPillClasses`

### Technical Details

The helper function:

```tsx
function getUtilizationPillClasses(percent: number): string {
  if (percent >= 70) return 'bg-chart-2/10 text-chart-2';
  if (percent >= 50) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  return 'bg-destructive/10 text-destructive';
}
```

The badge markup changes from:
```tsx
<Badge variant={getUtilizationBadgeVariant(overallUtilization)} className="text-xs whitespace-nowrap">
  {overallUtilization}% utilized
</Badge>
```

To:
```tsx
<span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', getUtilizationPillClasses(overallUtilization))}>
  {overallUtilization}% utilized
</span>
```

This exactly mirrors the Goal Tracker's pace badge structure, creating visual harmony across both cards.
