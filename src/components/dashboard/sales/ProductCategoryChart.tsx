import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useProductCategoryBreakdown, ProductCategoryData } from '@/hooks/useSalesAnalytics';
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

interface ProductCategoryChartProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

export function ProductCategoryChart({ dateFrom, dateTo, locationId, filterContext }: ProductCategoryChartProps) {
  const { data, isLoading } = useProductCategoryBreakdown(dateFrom, dateTo, locationId);

  const topCategories = data?.slice(0, 6) || [];
  const totalRevenue = data?.reduce((sum, cat) => sum + cat.totalRevenue, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-[350px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-chart-2" />
            <CardTitle className="font-display">Product Categories</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {filterContext && (
              <AnalyticsFilterBadge 
                locationId={filterContext.locationId} 
                dateRange={filterContext.dateRange} 
              />
            )}
            <Badge variant="outline">${totalRevenue.toLocaleString()}</Badge>
          </div>
        </div>
        <CardDescription>Revenue breakdown by product category</CardDescription>
      </CardHeader>
      <CardContent>
        {topCategories.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ShoppingBag className="w-8 h-8 opacity-50" />
            <p className="text-center">
              No product sales data available
              <br />
              <span className="text-xs">Product data syncs from Phorest sales transactions</span>
            </p>
          </div>
        ) : (
          <>
            <div className="h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]}>
                    {topCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Top 3 with details */}
            <div className="space-y-2">
              {topCategories.slice(0, 3).map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                    <span className="text-sm font-medium truncate max-w-[120px]">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{cat.totalQuantity} sold</span>
                    <Badge variant="secondary">${cat.totalRevenue.toLocaleString()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
