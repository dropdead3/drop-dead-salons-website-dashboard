import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface ServicePairing {
  serviceA: string;
  serviceB: string;
  count: number;
  pctOfVisits: number; // % of multi-service visits that include this pair
}

export function useServicePairings(
  dateFrom: string,
  dateTo: string,
  locationId?: string
) {
  const query = useQuery({
    queryKey: ['service-pairings', dateFrom, dateTo, locationId],
    queryFn: async () => {
      let q = supabase
        .from('phorest_appointments')
        .select('phorest_client_id, appointment_date, service_name')
        .neq('status', 'cancelled')
        .gte('appointment_date', dateFrom)
        .lte('appointment_date', dateTo);

      if (locationId) {
        q = q.eq('location_id', locationId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const pairings = useMemo<ServicePairing[]>(() => {
    if (!query.data) return [];

    // Group by client + date
    const visits = new Map<string, Set<string>>();
    for (const a of query.data) {
      if (!a.phorest_client_id || !a.service_name) continue;
      const key = `${a.phorest_client_id}::${a.appointment_date}`;
      if (!visits.has(key)) visits.set(key, new Set());
      visits.get(key)!.add(a.service_name);
    }

    // Find co-occurring pairs (only from multi-service visits)
    const pairCounts = new Map<string, number>();
    let multiServiceVisitCount = 0;

    for (const services of visits.values()) {
      if (services.size < 2) continue;
      multiServiceVisitCount++;
      const sorted = [...services].sort();
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const pairKey = `${sorted[i]}|||${sorted[j]}`;
          pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
        }
      }
    }

    return [...pairCounts.entries()]
      .map(([key, count]) => {
        const [serviceA, serviceB] = key.split('|||');
        return {
          serviceA,
          serviceB,
          count,
          pctOfVisits: multiServiceVisitCount > 0 ? (count / multiServiceVisitCount) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [query.data]);

  return { data: pairings, isLoading: query.isLoading };
}
