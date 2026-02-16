import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { format, addDays, subDays } from 'date-fns';

export type LocationPipelineStatus = 'critical' | 'slowing' | 'healthy' | 'no_data';

export interface LocationPipeline {
  locationId: string;
  locationName: string;
  forwardCount: number;
  baselineCount: number;
  ratio: number;
  status: LocationPipelineStatus;
  label: string;
}

export interface PipelineSummary {
  critical: number;
  slowing: number;
  healthy: number;
  noData: number;
}

export function useBookingPipelineByLocation(locationId?: string) {
  const { data: locations } = useLocations();
  const today = new Date();
  const tomorrow = format(addDays(today, 1), 'yyyy-MM-dd');
  const plus14 = format(addDays(today, 14), 'yyyy-MM-dd');
  const minus14 = format(subDays(today, 14), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['booking-pipeline-by-location', locationId, todayStr],
    queryFn: async () => {
      // Forward pipeline: next 14 days
      let forwardQuery = supabase
        .from('appointments')
        .select('location_id')
        .gte('appointment_date', tomorrow)
        .lte('appointment_date', plus14)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId) {
        forwardQuery = forwardQuery.eq('location_id', locationId);
      }

      // Trailing baseline: past 14 days
      let baselineQuery = supabase
        .from('appointments')
        .select('location_id')
        .gte('appointment_date', minus14)
        .lte('appointment_date', todayStr)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId) {
        baselineQuery = baselineQuery.eq('location_id', locationId);
      }

      const [forwardResult, baselineResult] = await Promise.all([
        forwardQuery,
        baselineQuery,
      ]);

      if (forwardResult.error) throw forwardResult.error;
      if (baselineResult.error) throw baselineResult.error;

      // Group by location_id
      const forwardMap = new Map<string, number>();
      for (const row of forwardResult.data || []) {
        if (row.location_id) {
          forwardMap.set(row.location_id, (forwardMap.get(row.location_id) || 0) + 1);
        }
      }

      const baselineMap = new Map<string, number>();
      for (const row of baselineResult.data || []) {
        if (row.location_id) {
          baselineMap.set(row.location_id, (baselineMap.get(row.location_id) || 0) + 1);
        }
      }

      return { forwardMap: Object.fromEntries(forwardMap), baselineMap: Object.fromEntries(baselineMap) };
    },
    staleTime: 10 * 60 * 1000,
  });

  // Build location pipeline array
  const locationPipelines: LocationPipeline[] = (locations || []).map(loc => {
    const forwardCount = data?.forwardMap[loc.id] || 0;
    const baselineCount = data?.baselineMap[loc.id] || 0;

    if (forwardCount === 0 && baselineCount === 0) {
      return {
        locationId: loc.id,
        locationName: loc.name,
        forwardCount: 0,
        baselineCount: 0,
        ratio: 0,
        status: 'no_data' as const,
        label: 'No Data',
      };
    }

    const ratio = baselineCount > 0 ? forwardCount / baselineCount : forwardCount > 0 ? 1 : 0;

    let status: LocationPipelineStatus;
    let label: string;
    if (ratio >= 0.9) {
      status = 'healthy';
      label = 'Healthy';
    } else if (ratio >= 0.7) {
      status = 'slowing';
      label = 'Slowing';
    } else {
      status = 'critical';
      label = 'Critical';
    }

    return { locationId: loc.id, locationName: loc.name, forwardCount, baselineCount, ratio, status, label };
  });

  // Filter to single location if specified
  const filtered = locationId
    ? locationPipelines.filter(l => l.locationId === locationId)
    : locationPipelines;

  const summary: PipelineSummary = {
    critical: filtered.filter(l => l.status === 'critical').length,
    slowing: filtered.filter(l => l.status === 'slowing').length,
    healthy: filtered.filter(l => l.status === 'healthy').length,
    noData: filtered.filter(l => l.status === 'no_data').length,
  };

  return { locations: filtered, summary, isLoading };
}
