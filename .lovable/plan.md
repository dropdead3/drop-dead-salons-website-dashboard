
# Fix Revenue per Hour Calculation

## The Problem

The current "Rev/Hour" metric divides revenue by **location operating hours**, but the correct formula is:

```text
Revenue per Hour = Total Revenue ÷ Total Hours Worked (service durations)
```

---

## Correct Formula

| Component | Source |
|-----------|--------|
| Total Revenue | Sum of `total_price` from appointments |
| Total Hours Worked | Sum of (end_time - start_time) for each appointment |

This gives you revenue generated per hour of actual stylist service time.

---

## Technical Changes

### 1. Update `useSalesMetrics` Hook

**File: `src/hooks/useSalesData.ts`**

Modify the query to include `start_time` and `end_time`, then calculate total service hours:

```typescript
// Add to the select query
.select('id, total_price, service_name, phorest_staff_id, location_id, appointment_date, start_time, end_time')

// Add helper function
function getAppointmentDurationHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

// Calculate total service hours
const totalServiceHours = data.reduce((sum, apt) => {
  if (apt.start_time && apt.end_time) {
    return sum + getAppointmentDurationHours(apt.start_time, apt.end_time);
  }
  return sum;
}, 0);

// Return new field
return {
  ...existingFields,
  totalServiceHours,
};
```

### 2. Update `SalesBentoCard` Component

**File: `src/components/dashboard/sales/SalesBentoCard.tsx`**

Remove the operating hours calculation and use the new `totalServiceHours` from the hook:

```typescript
// Remove: calculateOperatingHours function (lines 30-72)
// Remove: operatingHours useMemo (lines 229-237)

// Update revenuePerHour calculation
const revenuePerHour = useMemo(() => {
  const serviceHours = metrics?.totalServiceHours || 0;
  if (serviceHours === 0) return 0;
  return totalRevenue / serviceHours;
}, [totalRevenue, metrics?.totalServiceHours]);

// Update tooltip to reflect new formula
tooltip="Total Revenue ÷ Service Hours. Average revenue generated per hour of stylist work."
```

---

## Example Calculation

| Day | Appointments | Total Duration | Revenue |
|-----|--------------|----------------|---------|
| Mon | 5 services   | 6.5 hours      | $850    |
| Tue | 4 services   | 5.0 hours      | $720    |
| **Total** | 9 services | **11.5 hours** | **$1,570** |

**Rev/Hour = $1,570 ÷ 11.5 = $137/hr**

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSalesData.ts` | Add `start_time`, `end_time` to query; calculate and return `totalServiceHours` |
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Remove operating hours logic; use `totalServiceHours` from metrics; update tooltip |
