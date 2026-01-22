import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subWeeks, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';

interface PerformanceTrendChartProps {
  userId: string;
  weeks?: number;
}

interface WeeklyData {
  weekLabel: string;
  weekStart: string;
  revenue: number;
  services: number;
  products: number;
}

export function PerformanceTrendChart({ userId, weeks = 8 }: PerformanceTrendChartProps) {
  // Fetch weekly performance data
  const { data, isLoading } = useQuery({
    queryKey: ['stylist-weekly-trend', userId, weeks],
    queryFn: async () => {
      const weekRanges: { start: string; end: string; label: string }[] = [];
      const today = new Date();
      
      for (let i = weeks - 1; i >= 0; i--) {
        const weekDate = subWeeks(today, i);
        const start = startOfWeek(weekDate, { weekStartsOn: 1 });
        const end = endOfWeek(weekDate, { weekStartsOn: 1 });
        weekRanges.push({
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd'),
          label: format(start, 'MMM d'),
        });
      }

      // Fetch all summaries in date range
      const { data: summaries, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('summary_date', weekRanges[0].start)
        .lte('summary_date', weekRanges[weekRanges.length - 1].end)
        .order('summary_date', { ascending: true });

      if (error) throw error;

      // Aggregate by week
      const weeklyData: WeeklyData[] = weekRanges.map(range => {
        const weekSummaries = (summaries || []).filter(s => 
          s.summary_date >= range.start && s.summary_date <= range.end
        );
        
        return {
          weekLabel: range.label,
          weekStart: range.start,
          revenue: weekSummaries.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0),
          services: weekSummaries.reduce((sum, s) => sum + (s.total_services || 0), 0),
          products: weekSummaries.reduce((sum, s) => sum + (s.total_products || 0), 0),
        };
      });

      return weeklyData;
    },
    enabled: !!userId,
  });

  // Calculate trend
  const trend = useMemo(() => {
    if (!data || data.length < 2) return { direction: 'neutral' as const, percentage: 0 };
    
    const currentWeek = data[data.length - 1]?.revenue || 0;
    const previousWeek = data[data.length - 2]?.revenue || 0;
    
    if (previousWeek === 0) return { direction: 'up' as const, percentage: currentWeek > 0 ? 100 : 0 };
    
    const change = ((currentWeek - previousWeek) / previousWeek) * 100;
    return {
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
      percentage: Math.abs(change),
    };
  }, [data]);

  const totalRevenue = useMemo(() => 
    data?.reduce((sum, d) => sum + d.revenue, 0) || 0
  , [data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg">Revenue Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last {weeks} weeks performance</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl">${totalRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 justify-end">
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend.direction === 'up' && "text-green-600",
                trend.direction === 'down' && "text-red-600"
              )}>
                {trend.percentage.toFixed(1)}% vs last week
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="weekLabel" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly breakdown badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <Badge variant="outline" className="text-xs">
            {data?.[data.length - 1]?.services || 0} services this week
          </Badge>
          <Badge variant="outline" className="text-xs">
            {data?.[data.length - 1]?.products || 0} products sold
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
