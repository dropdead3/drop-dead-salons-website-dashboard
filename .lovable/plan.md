
## Increase Bar Chart Height in Capacity Utilization

### Problem
The Capacity Utilization bar charts are noticeably shorter than the Forecasting chart, making the bars look compressed. The Forecasting card uses 220-240px height while the Capacity Utilization cards use only 160-180px.

### Changes

**1. `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- Increase chart container from `h-[160px]` to `h-[220px]` to match the Forecasting card

**2. `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`**
- Increase chart container from `h-[180px]` to `h-[220px]` to match the Forecasting card

Both changes are single-line edits to the container div class. No other modifications needed -- the chart content (bars, labels, average line, moon icons) will automatically scale to fill the taller space.
