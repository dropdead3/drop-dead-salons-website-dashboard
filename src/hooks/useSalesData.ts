import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalesTransaction {
  id: string;
  phorest_transaction_id: string;
  transaction_date: string;
  stylist_user_id: string | null;
  phorest_staff_id: string | null;
  client_name: string | null;
  item_type: string;
  item_name: string;
  category: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number | null;
  total_amount: number;
  payment_method: string | null;
  branch_name: string | null;
  location_id: string | null;
  created_at: string;
}

export interface DailySalesSummary {
  id: string;
  summary_date: string;
  user_id: string | null;
  location_id: string | null;
  branch_name: string | null;
  total_revenue: number | null;
  service_revenue: number | null;
  product_revenue: number | null;
  total_services: number | null;
  total_products: number | null;
  total_transactions: number | null;
  average_ticket: number | null;
  total_discounts: number | null;
}

export interface SalesFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  locationId?: string;
  itemType?: string;
}

// Fetch sales transactions with filters
export function useSalesTransactions(filters: SalesFilters = {}) {
  return useQuery({
    queryKey: ['sales-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('phorest_sales_transactions')
        .select(`
          *,
          employee_profiles:stylist_user_id (
            full_name,
            display_name,
            photo_url
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(500);

      if (filters.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }
      if (filters.userId) {
        query = query.eq('stylist_user_id', filters.userId);
      }
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters.itemType) {
        query = query.eq('item_type', filters.itemType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Fetch daily sales summaries
export function useDailySalesSummary(filters: SalesFilters = {}) {
  return useQuery({
    queryKey: ['daily-sales-summary', filters],
    queryFn: async () => {
      let query = supabase
        .from('phorest_daily_sales_summary')
        .select(`
          *,
          employee_profiles:user_id (
            full_name,
            display_name,
            photo_url
          )
        `)
        .order('summary_date', { ascending: false });

      if (filters.dateFrom) {
        query = query.gte('summary_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('summary_date', filters.dateTo);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Get sales summary for a specific user (for My Stats page)
export function useUserSalesSummary(userId: string | undefined, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['user-sales-summary', userId, dateFrom, dateTo],
    queryFn: async () => {
      if (!userId) return null;

      let query = supabase
        .from('phorest_daily_sales_summary')
        .select('*')
        .eq('user_id', userId)
        .order('summary_date', { ascending: false });

      if (dateFrom) {
        query = query.gte('summary_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('summary_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Aggregate the data
      if (!data || data.length === 0) return null;

      const totals = data.reduce((acc, day) => ({
        totalRevenue: acc.totalRevenue + (Number(day.total_revenue) || 0),
        serviceRevenue: acc.serviceRevenue + (Number(day.service_revenue) || 0),
        productRevenue: acc.productRevenue + (Number(day.product_revenue) || 0),
        totalServices: acc.totalServices + (day.total_services || 0),
        totalProducts: acc.totalProducts + (day.total_products || 0),
        totalTransactions: acc.totalTransactions + (day.total_transactions || 0),
        totalDiscounts: acc.totalDiscounts + (Number(day.total_discounts) || 0),
      }), {
        totalRevenue: 0,
        serviceRevenue: 0,
        productRevenue: 0,
        totalServices: 0,
        totalProducts: 0,
        totalTransactions: 0,
        totalDiscounts: 0,
      });

      return {
        ...totals,
        averageTicket: totals.totalTransactions > 0 
          ? totals.totalRevenue / totals.totalTransactions 
          : 0,
        daysWithData: data.length,
        dailyData: data,
      };
    },
    enabled: !!userId,
  });
}

// Get aggregated sales metrics for dashboard (includes ALL staff data, not just mapped)
export function useSalesMetrics(filters: SalesFilters = {}) {
  const { data: summaries, isLoading } = useDailySalesSummary(filters);

  const metrics = summaries ? {
    totalRevenue: summaries.reduce((sum, d) => sum + (Number(d.total_revenue) || 0), 0),
    serviceRevenue: summaries.reduce((sum, d) => sum + (Number(d.service_revenue) || 0), 0),
    productRevenue: summaries.reduce((sum, d) => sum + (Number(d.product_revenue) || 0), 0),
    totalServices: summaries.reduce((sum, d) => sum + (d.total_services || 0), 0),
    totalProducts: summaries.reduce((sum, d) => sum + (d.total_products || 0), 0),
    totalTransactions: summaries.reduce((sum, d) => sum + (d.total_transactions || 0), 0),
    averageTicket: summaries.length > 0 
      ? summaries.reduce((sum, d) => sum + (Number(d.total_revenue) || 0), 0) / 
        summaries.reduce((sum, d) => sum + (d.total_transactions || 0), 0)
      : 0,
    totalDiscounts: summaries.reduce((sum, d) => sum + (Number(d.total_discounts) || 0), 0),
    // Track how many records are from unmapped staff
    unmappedStaffRecords: summaries.filter(d => !d.user_id).length,
  } : null;

  return { data: metrics, isLoading, rawData: summaries };
}

// Get sales by stylist for leaderboard
export function useSalesByStylist(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['sales-by-stylist', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('phorest_daily_sales_summary')
        .select(`
          user_id,
          total_revenue,
          service_revenue,
          product_revenue,
          total_services,
          total_products,
          total_transactions,
          employee_profiles:user_id (
            full_name,
            display_name,
            photo_url
          )
        `)
        .not('user_id', 'is', null);

      if (dateFrom) {
        query = query.gte('summary_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('summary_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by stylist
      const byUser: Record<string, any> = {};
      data?.forEach(row => {
        if (!row.user_id) return;
        if (!byUser[row.user_id]) {
          byUser[row.user_id] = {
            user_id: row.user_id,
            name: (row.employee_profiles as any)?.display_name || (row.employee_profiles as any)?.full_name || 'Unknown',
            photo_url: (row.employee_profiles as any)?.photo_url,
            totalRevenue: 0,
            serviceRevenue: 0,
            productRevenue: 0,
            totalServices: 0,
            totalProducts: 0,
            totalTransactions: 0,
          };
        }
        byUser[row.user_id].totalRevenue += Number(row.total_revenue) || 0;
        byUser[row.user_id].serviceRevenue += Number(row.service_revenue) || 0;
        byUser[row.user_id].productRevenue += Number(row.product_revenue) || 0;
        byUser[row.user_id].totalServices += row.total_services || 0;
        byUser[row.user_id].totalProducts += row.total_products || 0;
        byUser[row.user_id].totalTransactions += row.total_transactions || 0;
      });

      return Object.values(byUser).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
  });
}

// Get sales by location
export function useSalesByLocation(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['sales-by-location', dateFrom, dateTo],
    queryFn: async () => {
      // First fetch locations to map IDs to names
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name');

      let query = supabase
        .from('phorest_daily_sales_summary')
        .select('location_id, branch_name, total_revenue, service_revenue, product_revenue, total_services, total_products, total_transactions');

      if (dateFrom) {
        query = query.gte('summary_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('summary_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by location
      const byLocation: Record<string, any> = {};
      data?.forEach(row => {
        const key = row.location_id || row.branch_name || 'Unknown';
        if (!byLocation[key]) {
          const loc = locations?.find(l => l.id === row.location_id);
          byLocation[key] = {
            location_id: row.location_id,
            name: loc?.name || row.branch_name || 'Unknown',
            totalRevenue: 0,
            serviceRevenue: 0,
            productRevenue: 0,
            totalServices: 0,
            totalProducts: 0,
            totalTransactions: 0,
          };
        }
        byLocation[key].totalRevenue += Number(row.total_revenue) || 0;
        byLocation[key].serviceRevenue += Number(row.service_revenue) || 0;
        byLocation[key].productRevenue += Number(row.product_revenue) || 0;
        byLocation[key].totalServices += row.total_services || 0;
        byLocation[key].totalProducts += row.total_products || 0;
        byLocation[key].totalTransactions += row.total_transactions || 0;
      });

      return Object.values(byLocation).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
  });
}

// Get daily trend data for charts
export function useSalesTrend(dateFrom?: string, dateTo?: string, locationId?: string) {
  return useQuery({
    queryKey: ['sales-trend', dateFrom, dateTo, locationId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_daily_sales_summary')
        .select('summary_date, total_revenue, service_revenue, product_revenue, total_transactions, location_id')
        .order('summary_date', { ascending: true });

      if (dateFrom) {
        query = query.gte('summary_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('summary_date', dateTo);
      }
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by date (for overall trend)
      const byDate: Record<string, any> = {};
      // Also track by location
      const byLocationDate: Record<string, Record<string, number>> = {};
      
      data?.forEach(row => {
        // Overall aggregation
        if (!byDate[row.summary_date]) {
          byDate[row.summary_date] = {
            date: row.summary_date,
            revenue: 0,
            services: 0,
            products: 0,
            transactions: 0,
          };
        }
        byDate[row.summary_date].revenue += Number(row.total_revenue) || 0;
        byDate[row.summary_date].services += Number(row.service_revenue) || 0;
        byDate[row.summary_date].products += Number(row.product_revenue) || 0;
        byDate[row.summary_date].transactions += row.total_transactions || 0;

        // Per-location aggregation
        if (row.location_id) {
          if (!byLocationDate[row.location_id]) {
            byLocationDate[row.location_id] = {};
          }
          if (!byLocationDate[row.location_id][row.summary_date]) {
            byLocationDate[row.location_id][row.summary_date] = 0;
          }
          byLocationDate[row.location_id][row.summary_date] += Number(row.total_revenue) || 0;
        }
      });

      // Convert location data to arrays
      const locationTrends: Record<string, { date: string; value: number }[]> = {};
      Object.entries(byLocationDate).forEach(([locId, dates]) => {
        locationTrends[locId] = Object.entries(dates)
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => a.date.localeCompare(b.date));
      });

      return {
        overall: Object.values(byDate),
        byLocation: locationTrends,
      };
    },
  });
}
