import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface LocationData {
  location_id: string;
  name: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  totalServices: number;
  totalProducts: number;
}

interface LocationComparisonProps {
  locations: LocationData[];
  isLoading?: boolean;
}

export function LocationComparison({ locations, isLoading }: LocationComparisonProps) {
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [locations]);

  const maxRevenue = useMemo(() => {
    return Math.max(...locations.map(l => l.totalRevenue), 1);
  }, [locations]);

  const totalRevenue = useMemo(() => {
    return locations.reduce((sum, l) => sum + l.totalRevenue, 0);
  }, [locations]);

  const chartData = useMemo(() => {
    return sortedLocations.map((location, idx) => ({
      name: location.name,
      value: location.totalRevenue,
      percentage: totalRevenue > 0 
        ? ((location.totalRevenue / totalRevenue) * 100).toFixed(0)
        : 0,
      color: COLORS[idx % COLORS.length],
    }));
  }, [sortedLocations, totalRevenue]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locations.length < 2) {
    return null;
  }

  const leader = sortedLocations[0];
  const trailing = sortedLocations[sortedLocations.length - 1];
  const gap = leader.totalRevenue - trailing.totalRevenue;
  const gapPercent = trailing.totalRevenue > 0 
    ? ((gap / trailing.totalRevenue) * 100).toFixed(0)
    : '∞';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-sm flex items-center justify-between">
          <span>LOCATION COMPARISON</span>
          <Badge variant="outline" className="font-normal">
            ${totalRevenue.toLocaleString()} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side by side comparison */}
        <div className="grid grid-cols-2 gap-4">
          {sortedLocations.slice(0, 2).map((location, idx) => {
            const isLeader = idx === 0;
            const sharePercent = totalRevenue > 0 
              ? ((location.totalRevenue / totalRevenue) * 100).toFixed(0)
              : 0;
            
            return (
              <div 
                key={location.location_id} 
                className={cn(
                  'p-4 rounded-lg border',
                  isLeader ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">{location.name}</span>
                  {isLeader ? (
                    <Badge className="bg-primary/10 text-primary border-0 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Leader
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -{gapPercent}%
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-display mb-2">
                  ${location.totalRevenue.toLocaleString()}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Share of total</span>
                    <span>{sharePercent}%</span>
                  </div>
                  <Progress value={Number(sharePercent)} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-center">
                  <div>
                    <p className="text-lg font-display">{location.totalServices}</p>
                    <p className="text-xs text-muted-foreground">Services</p>
                  </div>
                  <div>
                    <p className="text-lg font-display">{location.totalProducts}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <p className="text-lg font-display">
                      ${location.totalTransactions > 0 
                        ? Math.round(location.totalRevenue / location.totalTransactions)
                        : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Share Donut Chart */}
        <div className="flex items-center justify-center gap-6">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="space-y-2">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-display">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
