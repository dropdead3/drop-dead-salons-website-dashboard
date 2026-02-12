import { useMemo } from 'react';
import { useGoalPeriodRevenue } from './useGoalPeriodRevenue';
import { useSalesGoals } from './useSalesGoals';
import { useActiveLocations, type HoursJson, type HolidayClosure } from './useLocations';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  differenceInDays, addDays, getDay, format, getDaysInMonth,
} from 'date-fns';

type GoalPeriod = 'weekly' | 'monthly';

const dayNameByIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function countOpenDays(
  from: Date,
  to: Date,
  hoursJson?: HoursJson | null,
  holidayClosures?: HolidayClosure[] | null,
): number {
  if (!hoursJson) {
    return Math.max(differenceInDays(to, from) + 1, 1);
  }
  const holidaySet = new Set((holidayClosures || []).map(h => h.date));
  let count = 0;
  let current = new Date(from);
  while (current <= to) {
    const dayName = dayNameByIndex[getDay(current)];
    const isClosed = hoursJson[dayName]?.closed === true;
    const isHoliday = holidaySet.has(format(current, 'yyyy-MM-dd'));
    if (!isClosed && !isHoliday) count++;
    current = addDays(current, 1);
  }
  return Math.max(count, 1);
}

export interface LocationMetric {
  locationId: string;
  locationName: string;
  revenue: number;
  target: number;
  percentage: number;
  paceStatus: 'ahead' | 'on-track' | 'behind';
  dailyRunRate: number;
  requiredDailyRate: number;
  daysRemaining: number;
  projectedRevenue: number;
}

export interface OrgMetrics {
  revenue: number;
  target: number;
  percentage: number;
  paceStatus: 'ahead' | 'on-track' | 'behind';
  projectedRevenue: number;
  dailyRunRate: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
}

function getPeriodRange(period: GoalPeriod): { start: Date; end: Date } {
  const now = new Date();
  if (period === 'weekly') {
    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  }
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

function computePaceStatus(actualPct: number, expectedPct: number): 'ahead' | 'on-track' | 'behind' {
  const diff = actualPct - expectedPct;
  if (diff >= 5) return 'ahead';
  if (diff <= -5) return 'behind';
  return 'on-track';
}

export function useGoalTrackerData(period: GoalPeriod) {
  const { data: locations } = useActiveLocations();
  const { goals } = useSalesGoals();
  const { data: orgRevenue = 0, isLoading: orgLoading } = useGoalPeriodRevenue(period);

  // Per-location revenue queries — we call the hook for each known location
  // Since hooks can't be called conditionally, we compute derived data in useMemo
  const locationIds = useMemo(() => (locations || []).map(l => l.id), [locations]);

  const { start, end } = getPeriodRange(period);
  const now = new Date();

  const orgTarget = period === 'monthly' ? (goals?.monthlyTarget || 50000) : (goals?.weeklyTarget || 12500);

  const orgMetrics = useMemo<OrgMetrics>(() => {
    const daysTotal = differenceInDays(end, start) + 1;
    const daysElapsed = Math.max(differenceInDays(now, start) + 1, 1);
    const daysRemaining = Math.max(daysTotal - daysElapsed, 0);
    const dailyRunRate = orgRevenue / daysElapsed;
    const projectedRevenue = dailyRunRate * daysTotal;
    const expectedPct = (daysElapsed / daysTotal) * 100;
    const actualPct = orgTarget > 0 ? (orgRevenue / orgTarget) * 100 : 0;
    const percentage = Math.min(actualPct, 100);
    const paceStatus = computePaceStatus(actualPct, expectedPct);

    return { revenue: orgRevenue, target: orgTarget, percentage, paceStatus, projectedRevenue, dailyRunRate, daysElapsed, daysTotal, daysRemaining };
  }, [orgRevenue, orgTarget, start, end, now]);

  // Build location metrics from org-level data + locations
  // Individual location revenue will be fetched by the card component per-row
  // to avoid breaking hook rules. Here we provide the scaffolding.
  const locationScaffold = useMemo(() => {
    if (!locations) return [];
    return locations.map(loc => {
      const locTarget = goals?.locationTargets?.[loc.id]
        ? (period === 'monthly' ? goals.locationTargets[loc.id].monthly : goals.locationTargets[loc.id].weekly)
        : orgTarget / (locations.length || 1);

      return {
        locationId: loc.id,
        locationName: loc.name,
        target: locTarget,
        hoursJson: loc.hours_json,
        holidayClosures: loc.holiday_closures,
      };
    });
  }, [locations, goals, period, orgTarget]);

  return {
    orgMetrics,
    locationScaffold,
    locations,
    period,
    isLoading: orgLoading,
    countOpenDays,
    getPeriodRange,
    computePaceStatus,
  };
}
