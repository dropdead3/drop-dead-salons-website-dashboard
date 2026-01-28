

# Add "Revenue per Hour" KPI to Sales Dashboard

## Overview

Add a new "Rev/Hour" metric card to the Sales Dashboard that calculates and displays revenue generated per operating hour for the selected date range.

---

## Formula

```text
Revenue per Hour = Total Revenue ÷ Total Operating Hours
```

Where **Total Operating Hours** is calculated by:
1. Counting each day in the selected date range
2. For each day, looking up the location's scheduled hours from `hours_json`
3. Summing all operating hours (excluding closed days)

---

## Data Requirements

| Data | Source |
|------|--------|
| Total Revenue | Already available from `useSalesMetrics` hook |
| Operating Hours | Calculate from `locations.hours_json` based on date range |

---

## Technical Implementation

### 1. Create Utility Function

Add a helper function to calculate total operating hours for a date range:

```typescript
function calculateOperatingHours(
  locations: Location[],
  locationId: string | undefined,
  dateFrom: string,
  dateTo: string
): number {
  // Get applicable location(s)
  const targetLocations = locationId && locationId !== 'all'
    ? locations.filter(l => l.id === locationId)
    : locations.filter(l => l.is_active);
  
  // Iterate through each day in range
  let totalHours = 0;
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0 = Sunday
    
    for (const loc of targetLocations) {
      const dayName = DAY_NAMES[dayOfWeek];
      const dayHours = loc.hours_json?.[dayName];
      
      if (dayHours && !dayHours.closed && dayHours.open && dayHours.close) {
        const [openH, openM] = dayHours.open.split(':').map(Number);
        const [closeH, closeM] = dayHours.close.split(':').map(Number);
        const hours = ((closeH * 60 + closeM) - (openH * 60 + openM)) / 60;
        totalHours += Math.max(0, hours);
      }
    }
  }
  
  return totalHours;
}
```

### 2. Add Calculation to SalesBentoCard

**File: `src/components/dashboard/sales/SalesBentoCard.tsx`**

```typescript
// Import Clock icon
import { Clock } from 'lucide-react';

// Calculate operating hours
const operatingHours = useMemo(() => {
  if (!locations) return 0;
  return calculateOperatingHours(
    locations,
    locationFilter,
    dateFilters.dateFrom,
    dateFilters.dateTo
  );
}, [locations, locationFilter, dateFilters]);

// Calculate revenue per hour
const revenuePerHour = useMemo(() => {
  if (operatingHours === 0) return 0;
  return totalRevenue / operatingHours;
}, [totalRevenue, operatingHours]);
```

### 3. Add KPI Cell

Add as the 6th KPI card in the grid:

```typescript
<KPICell 
  icon={Clock} 
  value={Math.round(revenuePerHour)} 
  label="Rev/Hour" 
  prefix="$"
  iconColor="text-chart-5"
  tooltip="Total Revenue ÷ Operating Hours. Average revenue generated per hour of operation."
/>
```

---

## Updated KPI Grid (6 cards)

| Position | Metric | Icon |
|----------|--------|------|
| 1 | Total Revenue | DollarSign |
| 2 | Services | Scissors |
| 3 | Products | ShoppingBag |
| 4 | Transactions | CreditCard |
| 5 | Avg Ticket | Receipt |
| 6 | **Rev/Hour** | Clock |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No operating hours (closed all days) | Display $0 |
| "All Locations" selected | Sum hours across all active locations |
| Single location selected | Use that location's hours only |
| Location has no hours_json | Skip that location in calculation |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Add operating hours calculation, add Rev/Hour KPICell |

