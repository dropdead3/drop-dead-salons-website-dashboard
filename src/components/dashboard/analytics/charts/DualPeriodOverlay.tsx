import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OverlayDataPoint {
  date: string;
  periodA: number;
  periodB: number;
  delta: number;
}

interface DualPeriodOverlayProps {
  data: OverlayDataPoint[];
  isLoading?: boolean;
  title?: string;
  periodALabel?: string;
  periodBLabel?: string;
}

export function DualPeriodOverlay({
  data,
  isLoading,
  title = 'Period Comparison',
  periodALabel = 'Previous',
  periodBLabel = 'Current',
}: DualPeriodOverlayProps) {
  const chartData = useMemo(() => {
    return data.map((d, index) => ({
      ...d,
      dayLabel: `Day ${index + 1}`,
    }));
  }, [data]);

  const averageDelta = useMemo(() => {
    if (!data.length) return 0;
    const totalDelta = data.reduce((sum, d) => sum + d.delta, 0);
    return totalDelta / data.length;
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Avg daily difference:{' '}
            <span className={averageDelta >= 0 ? 'text-chart-2' : 'text-destructive'}>
              {averageDelta >= 0 ? '+' : ''}${averageDelta.toFixed(0)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="dayLabel" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === 'periodA' ? periodALabel : periodBLabel,
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={(value) => value === 'periodA' ? periodALabel : periodBLabel}
              />
              {/* Previous period - dashed area */}
              <Area
                type="monotone"
                dataKey="periodA"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={0.3}
              />
              {/* Current period - solid area */}
              <Area
                type="monotone"
                dataKey="periodB"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{periodALabel} Avg</p>
            <p className="font-semibold">
              ${(data.reduce((s, d) => s + d.periodA, 0) / (data.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{periodBLabel} Avg</p>
            <p className="font-semibold">
              ${(data.reduce((s, d) => s + d.periodB, 0) / (data.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Days Improved</p>
            <p className="font-semibold">
              {data.filter(d => d.delta > 0).length} / {data.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
