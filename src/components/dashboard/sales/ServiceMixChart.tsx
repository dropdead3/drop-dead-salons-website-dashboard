import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scissors, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ServiceMixChartProps {
  userId: string;
  days?: number;
}

interface ServiceData {
  name: string;
  category: string;
  count: number;
  revenue: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export function ServiceMixChart({ userId, days = 30 }: ServiceMixChartProps) {
  const today = new Date();
  const startDate = format(subDays(today, days), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['stylist-service-mix', userId, days],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('phorest_sales_transactions')
        .select('item_name, item_category, item_type, total_amount')
        .eq('stylist_user_id', userId)
        .eq('item_type', 'service')
        .gte('transaction_date', startDate);

      if (error) throw error;

      // Aggregate by category
      const categoryMap: Record<string, { count: number; revenue: number }> = {};
      
      transactions?.forEach(tx => {
        const category = tx.item_category || 'Other';
        if (!categoryMap[category]) {
          categoryMap[category] = { count: 0, revenue: 0 };
        }
        categoryMap[category].count += 1;
        categoryMap[category].revenue += Number(tx.total_amount) || 0;
      });

      return Object.entries(categoryMap)
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6); // Top 6 categories
    },
    enabled: !!userId,
  });

  const totalRevenue = useMemo(() => 
    data?.reduce((sum, d) => sum + d.revenue, 0) || 0
  , [data]);

  const totalServices = useMemo(() =>
    data?.reduce((sum, d) => sum + d.count, 0) || 0
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">Service Mix</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No service data available for the last {days} days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">Service Mix</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Last {days} days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="w-[160px] h-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="revenue"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend & Stats */}
          <div className="flex-1 space-y-2">
            {data.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate max-w-[120px]">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">${item.revenue.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-1">({item.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-4 mt-4 pt-4 border-t">
          <div className="flex-1 text-center">
            <p className="font-display text-lg">{totalServices}</p>
            <p className="text-xs text-muted-foreground">Total Services</p>
          </div>
          <div className="flex-1 text-center">
            <p className="font-display text-lg">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Service Revenue</p>
          </div>
          <div className="flex-1 text-center">
            <p className="font-display text-lg">
              ${totalServices > 0 ? Math.round(totalRevenue / totalServices).toLocaleString() : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Ticket</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
