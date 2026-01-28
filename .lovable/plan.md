

# Add "Today to EOM" Filter and Yearly Goal Visual to Forecasting Card

## Overview

Add a new time range filter option "Today to EOM" (End of Month) that shows projected revenue from today through the end of the current month, combining:
1. **Today's actual revenue** (from scheduled appointments for today)
2. **Future forecast** (scheduled appointments from tomorrow through month end)

Also add a yearly goal progress visual showing if the business is on track or behind for hitting the annual target.

---

## Implementation Steps

### 1. Update the ForecastPeriod Type and Hook

**File: `src/hooks/useForecastRevenue.ts`**

Add `'todayToEom'` to the `ForecastPeriod` type and modify the date range logic:

```text
Current:
type ForecastPeriod = 'tomorrow' | '7days' | '30days' | '60days'

Updated:
type ForecastPeriod = 'tomorrow' | '7days' | '30days' | '60days' | 'todayToEom'
```

The hook will calculate the dynamic day count using:
- `differenceInDays(endOfMonth(today), today) + 1` for "Today to EOM"
- Date range: Start from **today** (not tomorrow) through end of month

Update `PERIOD_DAYS` to handle dynamic calculation:

```text
const getDayCount = (period: ForecastPeriod): number => {
  if (period === 'todayToEom') {
    const today = new Date();
    return differenceInDays(endOfMonth(today), today) + 1;
  }
  return PERIOD_DAYS[period];
};
```

Modify date generation to start from **today** for `todayToEom` period:

```text
const startFromToday = period === 'todayToEom';
const dates = Array.from({ length: dayCount }, (_, i) => {
  const date = addDays(today, startFromToday ? i : i + 1);
  // ...
});
```

---

### 2. Add New Period Labels

**File: `src/components/dashboard/sales/ForecastingCard.tsx`**

Update label mappings:

```text
const PERIOD_LABELS = {
  // ... existing
  'todayToEom': 'Today to EOM',
};

const PERIOD_TOTAL_LABELS = {
  // ... existing
  'todayToEom': 'Month Total',
};

const PERIOD_AVG_LABELS = {
  // ... existing
  'todayToEom': 'Daily Avg',
};
```

---

### 3. Add Toggle Button for New Period

**File: `src/components/dashboard/sales/ForecastingCard.tsx`**

Add a new ToggleGroupItem between "Tomorrow" and "7 Days":

```text
<ToggleGroupItem value="todayToEom" className="...">
  EOM
</ToggleGroupItem>
```

The toggle order will be: Tomorrow | EOM | 7 Days | 30 Days | 60 Days

---

### 4. Add Yearly Goal Progress Visual

**File: `src/components/dashboard/sales/ForecastingCard.tsx`**

Create a new section that appears when the `todayToEom` period is selected. This section will show:

| Component | Description |
|-----------|-------------|
| Progress bar | Shows YTD revenue vs yearly goal (monthlyTarget * 12) |
| Expected progress marker | Vertical line at current % of year elapsed |
| On-track / Behind badge | Dynamic status indicator |
| Required monthly pace | What's needed each remaining month to hit goal |

**Data Requirements:**
- **YTD Revenue**: Query appointments from Jan 1 through today
- **Yearly Goal**: `monthlyTarget * 12` from `useSalesGoals` hook
- **Expected Progress**: `(dayOfYear / 365) * 100`

**New hook: `useYearlyGoalProgress`**

Create a new hook in `src/hooks/useYearlyGoalProgress.ts`:

```text
interface YearlyGoalProgress {
  ytdRevenue: number;
  yearlyGoal: number;
  percentComplete: number;
  expectedPercent: number;
  isOnTrack: boolean;
  projectedYearEnd: number;
  remainingMonths: number;
  requiredMonthlyPace: number;
}
```

---

### 5. Update Chart Display Logic

**File: `src/components/dashboard/sales/ForecastingCard.tsx`**

For `todayToEom` period:
- Show daily bars (like 7 days view)
- Highlight today differently (first bar)
- Show weekly aggregation if more than 14 days remain

---

### 6. Visual Design for Yearly Goal Section

When `todayToEom` is selected, display a new card section below the chart:

```text
+--------------------------------------------------+
| Yearly Goal Progress                              |
|                                                   |
| [======|===============] 34.2%                   |
|        ^ expected (28%)                          |
|                                                   |
| $205,432 earned  •  $600,000 goal                |
|                                                   |
| [On Track Badge]  +$37,000 ahead of pace         |
+--------------------------------------------------+
```

Key elements:
- Progress bar with current YTD percentage
- Vertical marker showing expected % based on day of year
- Status badge: "On Track" (green) or "Behind" (amber/red)
- Ahead/behind amount
- "Required pace: $X/month for remaining Y months" if behind

---

## Technical Details

### New Hook: `useYearlyGoalProgress.ts`

```text
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSalesGoals } from './useSalesGoals';
import { format, startOfYear, getDayOfYear } from 'date-fns';

export function useYearlyGoalProgress(locationId?: string) {
  const { goals } = useSalesGoals();
  const yearlyGoal = (goals?.monthlyTarget || 50000) * 12;
  
  return useQuery({
    queryKey: ['yearly-goal-progress', locationId],
    queryFn: async () => {
      const today = new Date();
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');
      const dayOfYear = getDayOfYear(today);
      const daysInYear = 365; // simplified
      
      // Query YTD revenue
      let query = supabase
        .from('phorest_appointments')
        .select('total_price')
        .gte('appointment_date', yearStart)
        .lte('appointment_date', todayStr)
        .not('status', 'in', '("cancelled","no_show")');
      
      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }
      
      const { data } = await query;
      const ytdRevenue = data?.reduce((sum, apt) => 
        sum + (Number(apt.total_price) || 0), 0) || 0;
      
      // Calculate metrics
      const expectedPercent = (dayOfYear / daysInYear) * 100;
      const percentComplete = (ytdRevenue / yearlyGoal) * 100;
      const isOnTrack = percentComplete >= expectedPercent;
      
      // Project year-end
      const dailyAverage = ytdRevenue / dayOfYear;
      const projectedYearEnd = dailyAverage * daysInYear;
      
      // Required pace
      const remainingMonths = 12 - (new Date().getMonth() + 1) + 1;
      const remaining = Math.max(yearlyGoal - ytdRevenue, 0);
      const requiredMonthlyPace = remainingMonths > 0 
        ? remaining / remainingMonths : 0;
      
      return {
        ytdRevenue,
        yearlyGoal,
        percentComplete,
        expectedPercent,
        isOnTrack,
        projectedYearEnd,
        remainingMonths,
        requiredMonthlyPace,
        aheadBehindAmount: ytdRevenue - (yearlyGoal * (dayOfYear / daysInYear)),
      };
    },
  });
}
```

### Modified Files Summary

| File | Changes |
|------|---------|
| `src/hooks/useForecastRevenue.ts` | Add `todayToEom` to type, handle dynamic date range starting from today |
| `src/hooks/useYearlyGoalProgress.ts` | **New file** - Hook for YTD revenue and yearly goal calculations |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add toggle option, new labels, yearly goal progress section |

---

## Edge Cases

1. **End of month** (e.g., Jan 31): "Today to EOM" shows only 1 day (same as tomorrow)
2. **New Year** (Jan 1): YTD starts fresh with $0 revenue
3. **No appointments**: Show $0 with appropriate empty state messaging
4. **Location filter**: All calculations respect the selected location filter

---

## Result

After implementation:
- Users can toggle to "EOM" to see projected revenue through month end
- Includes today's appointments (not just tomorrow forward)
- Yearly goal progress bar shows if business is on track for annual target
- Clear ahead/behind indicator with actionable "required pace" metric

