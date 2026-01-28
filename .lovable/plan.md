

# Add Rebook Rate Analytics to Appointments Section

## Overview

Add a new KPI card to the Appointments analytics section that tracks the "Rebook Rate" - the percentage of completed appointments where the client rebooked their next appointment before leaving. This requires database schema updates, checkout UI changes, and analytics integration.

---

## Current State

- The `phorest_appointments` table has no field to track if an appointment resulted in a rebooking at checkout
- The checkout flow (`CheckoutSummarySheet`) only captures tip amounts
- The Appointments Summary section displays 6 KPI cards in a 3x2 grid
- A `rebooking_rate` exists in `phorest_performance_metrics` but is empty and only syncs weekly aggregated data

---

## Proposed Solution

### 1. Database Schema Update

Add a new boolean column to the `phorest_appointments` table:

```sql
ALTER TABLE phorest_appointments 
ADD COLUMN rebooked_at_checkout BOOLEAN DEFAULT false;
```

This will track whether each individual completed appointment resulted in a client rebooking.

---

### 2. Checkout Flow Update

Modify `CheckoutSummarySheet.tsx` to include a "Did client rebook?" toggle before the "Mark as Paid" button.

**UI Changes:**
- Add a toggle/switch labeled "Client Rebooked?" with a brief description
- The toggle defaults to OFF (not rebooked)
- Update the `onConfirm` callback to pass both `tipAmount` and `rebooked` status

```text
┌─────────────────────────────────────────┐
│  📅 Client Rebooked?                    │
│  ○═════○  Did client book next appt?    │
└─────────────────────────────────────────┘
```

---

### 3. Status Update Flow

Update the appointment update flow to persist the rebook status:

**Schedule.tsx:**
- Modify `handleCheckoutConfirm` to accept `rebooked` boolean
- Pass the rebook status to the update mutation

**usePhorestCalendar.ts:**
- Update the `updateStatus` mutation to accept an optional `rebooked_at_checkout` field
- Include this in the edge function call

**update-phorest-appointment Edge Function:**
- Add `rebooked_at_checkout` to the `UpdateRequest` interface
- Include it in the local database update

---

### 4. Analytics Hook Update

Update `useOperationalAnalytics.ts` to calculate rebook metrics:

**New Query:**
```typescript
const rebookQuery = useQuery({
  queryKey: ['operational-analytics-rebook', locationId, startDateStr, endDateStr],
  queryFn: async () => {
    let query = supabase
      .from('phorest_appointments')
      .select('rebooked_at_checkout')
      .eq('status', 'completed')
      .gte('appointment_date', startDateStr)
      .lte('appointment_date', endDateStr);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const completed = data?.length || 0;
    const rebooked = data?.filter(a => a.rebooked_at_checkout).length || 0;
    const rebookRate = completed > 0 ? (rebooked / completed) * 100 : 0;

    return { completedCount: completed, rebookedCount: rebooked, rebookRate };
  },
});
```

**Update Summary Interface:**
Add `rebookRate` and `rebookedCount` to the summary object returned by the hook.

---

### 5. Analytics UI Update

Update `AppointmentsContent.tsx` to display the Rebook Rate KPI:

**Grid Layout Change:**
Expand the grid to accommodate a 7th card (change to 4-column layout or add a second row):

```text
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Appts     │ Completed       │ Booked Today    │ Booked Last 7D  │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ No-Show Rate    │ Cancel Rate     │ Rebook Rate ✓   │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

**New Card Component:**
```tsx
<Card className="p-4">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
      <CalendarCheck className="w-5 h-5 text-green-600" />
    </div>
    <div>
      <p className={cn(
        "font-display text-2xl",
        summary.rebookRate >= 75 && "text-green-600"
      )}>
        {summary.rebookRate.toFixed(1)}%
      </p>
      <p className="text-xs text-muted-foreground">Rebook Rate</p>
    </div>
  </div>
</Card>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| **Database Migration** | Add `rebooked_at_checkout` column to `phorest_appointments` |
| `src/components/dashboard/schedule/CheckoutSummarySheet.tsx` | Add rebook toggle, update `onConfirm` signature |
| `src/pages/dashboard/Schedule.tsx` | Update `handleCheckoutConfirm` to pass rebook status |
| `src/hooks/usePhorestCalendar.ts` | Add `rebooked_at_checkout` to updateStatus mutation |
| `supabase/functions/update-phorest-appointment/index.ts` | Handle `rebooked_at_checkout` in update request |
| `src/hooks/useOperationalAnalytics.ts` | Add rebook metrics query and return values |
| `src/components/dashboard/analytics/AppointmentsContent.tsx` | Add Rebook Rate KPI card |

---

## User Experience

| Action | Result |
|--------|--------|
| Client rebooks during checkout | Stylist toggles "Client Rebooked?" ON before marking as paid |
| Viewing Appointments Analytics | New "Rebook Rate" card shows percentage of completed appointments with rebookings |
| 75%+ rebook rate | Card number displays in green to highlight good performance |

---

## Data Flow

```text
Checkout UI → Schedule.tsx → usePhorestCalendar → Edge Function → Database
                                                                      ↓
Analytics UI ← AppointmentsContent ← useOperationalAnalytics ← Database Query
```

---

## Metrics Glossary Update

Add this metric to `src/data/metricsGlossary.ts`:

```typescript
{
  id: 'rebook-rate-operational',
  name: 'Rebook Rate (Operational)',
  category: 'operations',
  description: 'Percentage of completed appointments where the client booked their next visit at checkout.',
  formula: '(Appointments with rebooking ÷ Completed appointments) × 100',
  dataSource: 'phorest_appointments',
  updateFrequency: 'Real-time',
  example: '72%',
  relatedMetrics: ['retention-rate', 'rebooking-rate'],
}
```

