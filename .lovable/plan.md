

## Fix Show/Hide $ on Simple Card View

### Problem
The "Simple" (compact) card view on the Command Center renders all metric values as plain text. When the user toggles "Show/hide $", the values on these cards are not blurred because they are not wrapped in the `BlurredAmount` component. This is a privacy gap -- financial data remains visible in Simple mode even when hidden everywhere else.

### Root Cause
In `src/components/dashboard/PinnedAnalyticsCard.tsx`, the compact view (lines 308-500) builds a `metricValue` string and renders it directly:
```
<p className="font-display text-2xl font-medium">{metricValue}</p>
```
No `BlurredAmount` wrapper is applied, so the HideNumbers context has no effect.

### Solution
Wrap the `metricValue` output in the `BlurredAmount` component for cards that display financial/sensitive data. Non-financial cards (like "0 NEW" bookings count or location counts) can optionally remain unblurred, but for consistency and simplicity, wrapping all compact metrics in `BlurredAmount` is the safest approach since even counts and percentages could be considered sensitive business data.

### Changes

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

1. Import `BlurredAmount` from `@/contexts/HideNumbersContext` (add to existing imports)
2. On line 482, wrap the metric value output:
   - Before: `<p className="font-display text-2xl font-medium">{metricValue}</p>`
   - After: `<BlurredAmount className="font-display text-2xl font-medium">{metricValue}</BlurredAmount>`

This is a single-line change that ensures all compact card metrics respect the show/hide privacy toggle, matching the behavior of the Detailed view which already uses `BlurredAmount` throughout.

### Result
When the user clicks "Show/hide $" in the top bar, the Simple card view will blur/unblur all metric values (dollar amounts, percentages, counts) just like the Detailed view does.
