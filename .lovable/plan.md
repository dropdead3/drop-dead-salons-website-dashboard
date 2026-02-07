

# Add "Today to Next Pay Day" Filter with Pay Schedule Configuration

## Overview

Add a new date range filter option "Today to Next Pay Day" that dynamically calculates the date range based on configurable pay schedule settings. This pay schedule configuration will also integrate with the native payroll system.

---

## Changes Summary

| Change | Description |
|--------|-------------|
| Database migration | Create `organization_payroll_settings` table to store pay schedule configuration |
| New hook | Create `usePaySchedule` hook to manage pay schedule settings and calculate next pay day |
| Update DateRangeType | Add `todayToPayday` option to all DateRangeType definitions |
| Update filter bars | Add "Today to Next Pay Day" option to analytics filter dropdowns |
| Update getDateRange | Calculate date range based on stored pay schedule settings |
| Pay Schedule Settings UI | Add configuration card in Payroll Settings tab |
| Integrate with payroll wizard | Pre-populate pay period dates based on schedule |

---

## Database Schema

### New Table: `organization_payroll_settings`

```sql
CREATE TABLE organization_payroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Pay schedule type: 'semi_monthly', 'bi_weekly', 'weekly', 'monthly'
  pay_schedule_type TEXT NOT NULL DEFAULT 'semi_monthly',
  
  -- For semi-monthly: day of month for first pay day (e.g., 1, 15)
  semi_monthly_first_day INTEGER DEFAULT 1,
  semi_monthly_second_day INTEGER DEFAULT 15,
  
  -- For bi-weekly: day of week (0=Sunday, 1=Monday, etc.)
  bi_weekly_day_of_week INTEGER DEFAULT 5, -- Friday
  bi_weekly_start_date DATE, -- Anchor date for bi-weekly calculation
  
  -- For weekly: day of week
  weekly_day_of_week INTEGER DEFAULT 5, -- Friday
  
  -- For monthly: day of month
  monthly_pay_day INTEGER DEFAULT 1,
  
  -- Days after period end when check is issued
  days_until_check INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE organization_payroll_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "Admins can manage pay schedule settings"
  ON organization_payroll_settings
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE om.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- All org members can read
CREATE POLICY "Org members can read pay schedule"
  ON organization_payroll_settings
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

---

## Technical Implementation

### 1. New Hook: `usePaySchedule.ts`

```typescript
// src/hooks/usePaySchedule.ts

export type PayScheduleType = 'semi_monthly' | 'bi_weekly' | 'weekly' | 'monthly';

export interface PayScheduleSettings {
  id: string;
  organization_id: string;
  pay_schedule_type: PayScheduleType;
  semi_monthly_first_day: number;
  semi_monthly_second_day: number;
  bi_weekly_day_of_week: number;
  bi_weekly_start_date: string | null;
  weekly_day_of_week: number;
  monthly_pay_day: number;
  days_until_check: number;
}

export interface PayPeriodInfo {
  periodStart: Date;
  periodEnd: Date;
  nextPayDay: Date;
}

export function usePaySchedule() {
  // Query to fetch organization pay schedule settings
  // Function to calculate next pay day based on schedule type
  // Function to get current pay period
  // Mutation to update settings
}

export function getNextPayDay(settings: PayScheduleSettings): Date {
  // Calculate next pay day based on schedule type
}

export function getCurrentPayPeriod(settings: PayScheduleSettings): PayPeriodInfo {
  // Calculate current pay period dates
}
```

**Key Functions:**

- `getNextPayDay()` - Calculates the next pay day based on schedule type
- `getCurrentPayPeriod()` - Returns current period start/end and next check date
- `getPayPeriodForPayDay(payDay: Date)` - Returns the pay period that ends on a specific pay day

---

### 2. Update DateRangeType Definitions

**Files to update:**
- `src/components/dashboard/PinnedAnalyticsCard.tsx`
- `src/components/dashboard/AnalyticsFilterBar.tsx`
- `src/components/dashboard/AnalyticsFilterBadge.tsx`
- `src/components/dashboard/CommandCenterAnalytics.tsx`
- `src/pages/dashboard/admin/AnalyticsHub.tsx`

**Add new type:**
```typescript
export type DateRangeType = 
  | 'today' 
  | 'yesterday' 
  | '7d' 
  | '30d' 
  | 'thisWeek' 
  | 'thisMonth' 
  | 'todayToEom' 
  | 'todayToPayday'  // NEW
  | 'lastMonth';
```

**Add label:**
```typescript
const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  // ... existing labels
  todayToPayday: 'Today to Next Pay Day',
};
```

---

### 3. Update `getDateRange()` Function

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

```typescript
import { usePaySchedule, getNextPayDay } from '@/hooks/usePaySchedule';

export function getDateRange(
  dateRange: DateRangeType, 
  payScheduleSettings?: PayScheduleSettings
): { dateFrom: string; dateTo: string } {
  const now = new Date();
  
  switch (dateRange) {
    // ... existing cases
    
    case 'todayToPayday': {
      if (!payScheduleSettings) {
        // Fallback to end of month if no settings
        return { 
          dateFrom: format(now, 'yyyy-MM-dd'), 
          dateTo: format(endOfMonth(now), 'yyyy-MM-dd') 
        };
      }
      const nextPayDay = getNextPayDay(payScheduleSettings);
      return { 
        dateFrom: format(now, 'yyyy-MM-dd'), 
        dateTo: format(nextPayDay, 'yyyy-MM-dd') 
      };
    }
    
    default:
      return { dateFrom: format(now, 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
  }
}
```

---

### 4. Pay Schedule Settings Card

**New Component: `src/components/dashboard/payroll/PayScheduleCard.tsx`**

A settings card that allows admins to configure:

| Field | Description |
|-------|-------------|
| Schedule Type | Semi-monthly, Bi-weekly, Weekly, Monthly |
| Pay Days | Specific days based on schedule type |
| Days Until Check | How many days after period end the check is issued |

**UI Preview:**

```text
┌─────────────────────────────────────────────────┐
│ Pay Schedule                                     │
├─────────────────────────────────────────────────┤
│                                                  │
│ Schedule Type: [Semi-Monthly ▼]                 │
│                                                  │
│ Pay Days:                                        │
│   First Pay Day:  [1st ▼]  of the month        │
│   Second Pay Day: [15th ▼] of the month        │
│                                                  │
│ Days Until Check: [5 ▼] days after period end  │
│                                                  │
│ ─────────────────────────────────────────────   │
│ Next Pay Day: February 15, 2026                 │
│ Current Period: Feb 1 - Feb 15, 2026            │
│                                                  │
│                              [Save Changes]      │
└─────────────────────────────────────────────────┘
```

---

### 5. Integrate with Payroll Wizard

**File: `src/components/dashboard/payroll/steps/PayPeriodStep.tsx`**

Add a new preset based on the configured pay schedule:

```typescript
// Add dynamic preset based on pay schedule
const paySchedulePreset = useMemo(() => {
  if (!paySchedule) return null;
  
  const period = getCurrentPayPeriod(paySchedule);
  return {
    label: 'Current Pay Period',
    getRange: () => ({
      start: period.periodStart,
      end: period.periodEnd,
    }),
    checkDate: period.nextPayDay,
  };
}, [paySchedule]);

// Render as first preset option
{paySchedulePreset && (
  <Button variant="default" size="sm" onClick={() => applyPreset(paySchedulePreset)}>
    <CalendarCheck className="h-3 w-3 mr-1" />
    Current Pay Period
  </Button>
)}
```

---

### 6. Update My Pay Data Hook

**File: `src/hooks/useMyPayData.ts`**

Replace hardcoded `inferCurrentPayPeriod()` with dynamic calculation:

```typescript
import { usePaySchedule, getCurrentPayPeriod } from './usePaySchedule';

export function useMyPayData(): MyPayData {
  const { settings: paySchedule } = usePaySchedule();
  
  // Use configured pay schedule instead of hardcoded logic
  const currentPeriod = useMemo(() => {
    if (!paySchedule) return inferCurrentPayPeriod(); // Fallback
    const period = getCurrentPayPeriod(paySchedule);
    return {
      startDate: format(period.periodStart, 'yyyy-MM-dd'),
      endDate: format(period.periodEnd, 'yyyy-MM-dd'),
      checkDate: format(period.nextPayDay, 'yyyy-MM-dd'),
    };
  }, [paySchedule]);
  
  // ... rest of the hook
}
```

---

## Pay Schedule Calculation Logic

### Semi-Monthly (1st and 15th)

```typescript
function getNextSemiMonthlyPayDay(settings: PayScheduleSettings): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const { semi_monthly_first_day, semi_monthly_second_day } = settings;
  
  if (currentDay < semi_monthly_first_day) {
    return new Date(today.getFullYear(), today.getMonth(), semi_monthly_first_day);
  } else if (currentDay < semi_monthly_second_day) {
    return new Date(today.getFullYear(), today.getMonth(), semi_monthly_second_day);
  } else {
    // Next month's first pay day
    return new Date(today.getFullYear(), today.getMonth() + 1, semi_monthly_first_day);
  }
}
```

### Bi-Weekly (every other Friday)

```typescript
function getNextBiWeeklyPayDay(settings: PayScheduleSettings): Date {
  const today = new Date();
  const anchor = new Date(settings.bi_weekly_start_date);
  const dayOfWeek = settings.bi_weekly_day_of_week;
  
  // Calculate weeks since anchor
  const weeksSinceAnchor = differenceInWeeks(today, anchor);
  const weeksToNextPayDay = weeksSinceAnchor % 2 === 0 ? 0 : 1;
  
  // Find next occurrence of pay day
  const nextPayWeekStart = addWeeks(anchor, weeksSinceAnchor + weeksToNextPayDay);
  return setDay(nextPayWeekStart, dayOfWeek);
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/usePaySchedule.ts` | Hook for managing pay schedule settings |
| `src/components/dashboard/payroll/PayScheduleCard.tsx` | Settings UI component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Add `todayToPayday` type and calculation |
| `src/components/dashboard/AnalyticsFilterBar.tsx` | Add new filter option |
| `src/components/dashboard/AnalyticsFilterBadge.tsx` | Add label for new option |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Add new filter option |
| `src/pages/dashboard/admin/AnalyticsHub.tsx` | Add new filter option |
| `src/pages/dashboard/admin/Payroll.tsx` | Add PayScheduleCard to Settings tab |
| `src/components/dashboard/payroll/steps/PayPeriodStep.tsx` | Add "Current Pay Period" preset |
| `src/hooks/useMyPayData.ts` | Use configured pay schedule |

---

## User Experience

| Role | Can Configure Pay Schedule? | Can Use "Today to Next Pay Day" Filter? |
|------|-----------------------------|----------------------------------------|
| Admin/Owner | Yes | Yes |
| Manager | No | Yes |
| Stylist | No | Yes (for My Stats) |

---

## Default Values

If no pay schedule is configured:
- Falls back to semi-monthly schedule (1st and 15th)
- "Today to Next Pay Day" calculates based on this default
- Users are prompted to configure in Payroll Settings

