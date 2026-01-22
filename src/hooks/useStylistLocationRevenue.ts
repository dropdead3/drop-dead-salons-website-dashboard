import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, subWeeks } from 'date-fns';

export interface LocationRevenueData {
  locationId: string | null;
  branchName: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  totalServices: number;
  totalProducts: number;
  averageTicket: number;
}

export interface LocationTrendData {
  weekLabel: string;
  [locationKey: string]: string | number; // Dynamic location keys
}

/**
 * Fetches revenue breakdown by location for a specific stylist
 */
export function useStylistLocationRevenue(userId: string | undefined, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['stylist-location-revenue', userId, dateFrom, dateTo],
    queryFn: async () => {
      if (!userId) return [];

      // First fetch locations to map IDs to names
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name');

      let query = supabase
        .from('phorest_daily_sales_summary')
        .select('location_id, branch_name, total_revenue, service_revenue, product_revenue, total_services, total_products, total_transactions')
        .eq('user_id', userId);

      if (dateFrom) {
        query = query.gte('summary_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('summary_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by location
      const byLocation: Record<string, LocationRevenueData> = {};
      data?.forEach(row => {
        const key = row.location_id || row.branch_name || 'Unknown';
        if (!byLocation[key]) {
          const loc = locations?.find(l => l.id === row.location_id);
          byLocation[key] = {
            locationId: row.location_id,
            branchName: loc?.name || row.branch_name || 'Unknown',
            totalRevenue: 0,
            serviceRevenue: 0,
            productRevenue: 0,
            totalTransactions: 0,
            totalServices: 0,
            totalProducts: 0,
            averageTicket: 0,
          };
        }
        byLocation[key].totalRevenue += Number(row.total_revenue) || 0;
        byLocation[key].serviceRevenue += Number(row.service_revenue) || 0;
        byLocation[key].productRevenue += Number(row.product_revenue) || 0;
        byLocation[key].totalTransactions += row.total_transactions || 0;
        byLocation[key].totalServices += row.total_services || 0;
        byLocation[key].totalProducts += row.total_products || 0;
      });

      // Calculate average ticket
      Object.values(byLocation).forEach(loc => {
        loc.averageTicket = loc.totalTransactions > 0 
          ? loc.totalRevenue / loc.totalTransactions 
          : 0;
      });

      return Object.values(byLocation).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
    enabled: !!userId,
  });
}

/**
 * Fetches weekly revenue trend by location for a specific stylist
 */
export function useStylistLocationTrend(userId: string | undefined, weeks: number = 8) {
  return useQuery({
    queryKey: ['stylist-location-trend', userId, weeks],
    queryFn: async () => {
      if (!userId) return { weeklyData: [], locations: [] };

      const today = new Date();
      const weekRanges: { start: string; end: string; label: string }[] = [];
      
      for (let i = weeks - 1; i >= 0; i--) {
        const weekDate = subWeeks(today, i);
        const start = startOfWeek(weekDate, { weekStartsOn: 1 });
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        weekRanges.push({
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd'),
          label: format(start, 'MMM d'),
        });
      }

      // Fetch locations
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name');

      // Fetch all summaries in date range
      const { data: summaries, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('summary_date, location_id, branch_name, total_revenue')
        .eq('user_id', userId)
        .gte('summary_date', weekRanges[0].start)
        .lte('summary_date', weekRanges[weekRanges.length - 1].end)
        .order('summary_date', { ascending: true });

      if (error) throw error;

      // Get unique locations from the data
      const locationNames: Record<string, string> = {};
      summaries?.forEach(s => {
        const key = s.location_id || s.branch_name || 'Unknown';
        if (!locationNames[key]) {
          const loc = locations?.find(l => l.id === s.location_id);
          locationNames[key] = loc?.name || s.branch_name || 'Unknown';
        }
      });

      // Aggregate by week and location
      const weeklyData: LocationTrendData[] = weekRanges.map(range => {
        const weekSummaries = (summaries || []).filter(s => 
          s.summary_date >= range.start && s.summary_date <= range.end
        );
        
        const dataPoint: LocationTrendData = { weekLabel: range.label };
        
        // Initialize all locations to 0
        Object.entries(locationNames).forEach(([key, name]) => {
          dataPoint[name] = 0;
        });

        // Sum up revenue by location
        weekSummaries.forEach(s => {
          const locKey = s.location_id || s.branch_name || 'Unknown';
          const locName = locationNames[locKey];
          if (locName) {
            dataPoint[locName] = (dataPoint[locName] as number || 0) + (Number(s.total_revenue) || 0);
          }
        });

        return dataPoint;
      });

      return {
        weeklyData,
        locations: Object.values(locationNames),
      };
    },
    enabled: !!userId,
  });
}
