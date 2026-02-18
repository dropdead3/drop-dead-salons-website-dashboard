

## Dynamic Y-Axis Domain for Capacity Utilization Charts

### Problem
The Y-axis is hardcoded to `[0, 100]`, so if the highest utilization bar is, say, 40%, there's a large empty gap above it wasting vertical space and making bars look short.

### Solution
Compute a dynamic Y-axis max based on the actual peak utilization value, rounded up to the nearest clean increment (e.g., nearest 10 or 20), with a small buffer. This keeps bars visually tall while preserving readable axis context.

### Changes

**Both files: `CapacityUtilizationCard.tsx` and `CapacityUtilizationSection.tsx`**

1. Before the chart render, compute `yMax`:
   - Find the highest `utilization` value from `chartData`
   - Add a ~20% buffer, then round up to the nearest 10
   - Clamp to a minimum of 20 (so the chart never looks weird with very low data) and a max of 100
   - Example: peak is 38% -> 38 * 1.2 = 45.6 -> round up to 50 -> `yMax = 50`

2. Update `<YAxis>`:
   - Change `domain={[0, 100]}` to `domain={[0, yMax]}`

### Result
Bars fill more of the vertical space regardless of actual utilization values, while the axis ceiling stays a clean round number above the peak. If utilization is already high (80%+), the domain stays near 100 naturally.

### Files Modified
- `src/components/dashboard/sales/CapacityUtilizationCard.tsx`
- `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`
