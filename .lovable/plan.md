

# Enhanced New Bookings Card - Detailed Breakdown

## Overview

Redesign the New Bookings card to show:
1. **Total Appointments Booked Today** (hero metric)
2. **New Client Bookings** (breakdown)
3. **Returning Client Bookings** (breakdown)
4. **Last 30 Days vs Previous 30 Days** comparison with trend indicator

---

## Proposed Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│  📅  NEW BOOKINGS                                               │
│      Appointments created                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          16                                     │
│                     Booked Today                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │   👤  4             │    │   🔄  12            │            │
│  │   New Clients       │    │   Returning Clients │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Last 30 Days: 124        ▲ +12% vs Previous 30 Days   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Update useNewBookings Hook

**File:** `src/hooks/useNewBookings.ts`

Expand the query to include:
- The `is_new_client` field to categorize bookings
- A 30-day window for current period
- A previous 30-day window for comparison

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

export function useNewBookings() {
  const today = new Date();
  const todayStart = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  const todayEnd = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  
  // 30-day ranges
  const thirtyDaysAgo = format(startOfDay(subDays(today, 30)), "yyyy-MM-dd'T'HH:mm:ss");
  const sixtyDaysAgo = format(startOfDay(subDays(today, 60)), "yyyy-MM-dd'T'HH:mm:ss");
  const thirtyOneDaysAgo = format(endOfDay(subDays(today, 31)), "yyyy-MM-dd'T'HH:mm:ss");

  return useQuery({
    queryKey: ['new-bookings', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Fetch appointments created today with is_new_client flag
      const { data: todayBookings, error: todayError } = await supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at, is_new_client')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (todayError) throw todayError;

      // Fetch last 30 days bookings
      const { data: last30DaysBookings, error: last30Error } = await supabase
        .from('phorest_appointments')
        .select('id, created_at, is_new_client')
        .gte('created_at', thirtyDaysAgo)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (last30Error) throw last30Error;

      // Fetch previous 30 days (31-60 days ago)
      const { data: prev30DaysBookings, error: prev30Error } = await supabase
        .from('phorest_appointments')
        .select('id, created_at')
        .gte('created_at', sixtyDaysAgo)
        .lte('created_at', thirtyOneDaysAgo)
        .not('status', 'eq', 'cancelled');

      if (prev30Error) throw prev30Error;

      const bookedToday = todayBookings || [];
      const last30Days = last30DaysBookings || [];
      const prev30Days = prev30DaysBookings || [];

      // Break down today's bookings
      const newClientToday = bookedToday.filter(apt => apt.is_new_client).length;
      const returningClientToday = bookedToday.filter(apt => !apt.is_new_client).length;

      // Calculate 30-day comparison
      const last30Count = last30Days.length;
      const prev30Count = prev30Days.length;
      const percentChange = prev30Count > 0 
        ? Math.round(((last30Count - prev30Count) / prev30Count) * 100)
        : 0;

      return {
        bookedToday: bookedToday.length,
        newClientToday,
        returningClientToday,
        last30Days: last30Count,
        prev30Days: prev30Count,
        percentChange,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

### 2. Update NewBookingsCard Component

**File:** `src/components/dashboard/NewBookingsCard.tsx`

Redesign the layout to show the new breakdown structure:

```tsx
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarPlus, UserPlus, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNewBookings } from '@/hooks/useNewBookings';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

export function NewBookingsCard() {
  const { data, isLoading } = useNewBookings();

  // Trend icon based on percent change
  const TrendIcon = data?.percentChange > 0 ? TrendingUp 
    : data?.percentChange < 0 ? TrendingDown 
    : Minus;
  const trendColor = data?.percentChange > 0 ? 'text-green-500' 
    : data?.percentChange < 0 ? 'text-red-500' 
    : 'text-muted-foreground';

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded-lg">
          <CalendarPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-display text-sm tracking-wide">NEW BOOKINGS</h2>
            <p className="text-xs text-muted-foreground">Appointments created</p>
          </div>
          <CommandCenterVisibilityToggle elementKey="new_bookings" elementName="New Bookings" />
        </div>
      </div>

      {/* Hero: Total Booked Today */}
      <div className="text-center mb-6">
        {isLoading ? (
          <Skeleton className="h-12 w-16 mx-auto" />
        ) : (
          <p className="text-4xl font-display tabular-nums">{data?.bookedToday || 0}</p>
        )}
        <div className="flex items-center gap-1 justify-center mt-1">
          <p className="text-sm text-muted-foreground">Booked Today</p>
          <MetricInfoTooltip description="Total new appointments created today (by creation date)." />
        </div>
      </div>

      {/* Breakdown: New vs Returning */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-center mb-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-10 mx-auto" />
          ) : (
            <p className="text-xl font-display tabular-nums">{data?.newClientToday || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">New Clients</p>
            <MetricInfoTooltip description="Bookings today from first-time clients." />
          </div>
        </div>

        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-center mb-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-10 mx-auto" />
          ) : (
            <p className="text-xl font-display tabular-nums">{data?.returningClientToday || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Returning Clients</p>
            <MetricInfoTooltip description="Bookings today from repeat clients." />
          </div>
        </div>
      </div>

      {/* 30-Day Comparison */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Last 30 Days:</span>
            {isLoading ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <span className="font-display tabular-nums">{data?.last30Days || 0}</span>
            )}
          </div>
          {!isLoading && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {data?.percentChange > 0 ? '+' : ''}{data?.percentChange}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs prev 30d</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useNewBookings.ts` | Expand queries to include `is_new_client`, 30-day and previous 30-day windows |
| `src/components/dashboard/NewBookingsCard.tsx` | Redesign layout with hero metric, new/returning breakdown, and 30-day comparison |

---

## Data Flow

```text
useNewBookings Hook
├── Query 1: Today's bookings (with is_new_client)
│   ├── Total count → bookedToday
│   ├── New clients → newClientToday  
│   └── Returning → returningClientToday
│
├── Query 2: Last 30 days bookings
│   └── Count → last30Days
│
└── Query 3: Previous 30 days (31-60 days ago)
    └── Count → prev30Days
    └── Calculate → percentChange
```

---

## New Metrics Added

| Metric | Description |
|--------|-------------|
| `bookedToday` | Total appointments created today |
| `newClientToday` | Today's bookings from first-time clients |
| `returningClientToday` | Today's bookings from repeat clients |
| `last30Days` | Total bookings created in last 30 days |
| `prev30Days` | Total bookings created 31-60 days ago |
| `percentChange` | Percentage difference between periods |

