import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Target, CalendarDays, Loader2 } from 'lucide-react';
import { format, getDaysInMonth, getDate, startOfMonth, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

interface RevenueForecastProps {
  dailyData: { date: string; revenue: number }[];
  monthlyTarget: number;
  isLoading?: boolean;
}

export function RevenueForecast({ dailyData, monthlyTarget, isLoading }: RevenueForecastProps) {
  const forecast = useMemo(() => {
    if (!dailyData?.length) return null;

    const today = new Date();
    const daysInMonth = getDaysInMonth(today);
    const currentDay = getDate(today);
    const daysRemaining = daysInMonth - currentDay;
    const monthStart = startOfMonth(today);

    // Calculate total revenue so far
    const totalSoFar = dailyData.reduce((sum, d) => sum + d.revenue, 0);
    
    // Calculate daily average from actual data
    const daysWithData = dailyData.length;
    const dailyAverage = daysWithData > 0 ? totalSoFar / daysWithData : 0;

    // Project month-end revenue
    const projectedTotal = totalSoFar + (dailyAverage * daysRemaining);
    
    // Calculate required daily revenue to hit target
    const remaining = Math.max(monthlyTarget - totalSoFar, 0);
    const requiredDaily = daysRemaining > 0 ? remaining / daysRemaining : 0;

    // Determine if on track
    const projectedVsTarget = ((projectedTotal - monthlyTarget) / monthlyTarget) * 100;
    const isOnTrack = projectedTotal >= monthlyTarget;
    const isClose = Math.abs(projectedVsTarget) < 10;

    // Generate chart data with projections
    const chartData = [];
    
    // Historical data
    dailyData.forEach(d => {
      chartData.push({
        date: format(new Date(d.date), 'MMM d'),
        actual: d.revenue,
        projected: null,
      });
    });

    // Projected data (remaining days)
    let runningTotal = totalSoFar;
    for (let i = 1; i <= Math.min(daysRemaining, 14); i++) {
      const projectedDay = addDays(today, i);
      runningTotal += dailyAverage;
      chartData.push({
        date: format(projectedDay, 'MMM d'),
        actual: null,
        projected: dailyAverage,
      });
    }

    return {
      totalSoFar,
      dailyAverage,
      projectedTotal,
      remaining,
      requiredDaily,
      daysRemaining,
      currentDay,
      daysInMonth,
      isOnTrack,
      isClose,
      projectedVsTarget,
      chartData,
    };
  }, [dailyData, monthlyTarget]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No data available for forecast
        </CardContent>
      </Card>
    );
  }

  const statusColor = forecast.isOnTrack ? 'text-chart-2' : forecast.isClose ? 'text-chart-4' : 'text-destructive';
  const StatusIcon = forecast.isOnTrack ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Revenue Forecast</CardTitle>
            <CommandCenterVisibilityToggle 
              elementKey="revenue_forecast" 
              elementName="Revenue Forecast" 
            />
          </div>
          <Badge variant={forecast.isOnTrack ? 'default' : 'secondary'}>
            <StatusIcon className={cn('w-3 h-3 mr-1', statusColor)} />
            {forecast.isOnTrack ? 'On Track' : 'Behind'}
          </Badge>
        </div>
        <CardDescription>Month-end projection based on current trend</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-display">${forecast.totalSoFar.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Earned to Date</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-display">${Math.round(forecast.dailyAverage).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Daily Average</p>
          </div>
          <div className={cn('text-center p-3 rounded-lg', forecast.isOnTrack ? 'bg-chart-2/10' : 'bg-chart-4/10')}>
            <p className={cn('text-lg font-display', statusColor)}>
              ${Math.round(forecast.projectedTotal).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Projected Total</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-display">${Math.round(forecast.requiredDaily).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Required Daily</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Progress to ${monthlyTarget.toLocaleString()} goal
            </span>
            <span className="font-medium">
              Day {forecast.currentDay} of {forecast.daysInMonth}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={(forecast.totalSoFar / monthlyTarget) * 100} 
              className="h-3"
            />
            {/* Expected progress marker */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-foreground/50"
              style={{ left: `${(forecast.currentDay / forecast.daysInMonth) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{((forecast.totalSoFar / monthlyTarget) * 100).toFixed(1)}% achieved</span>
            <span>{forecast.daysRemaining} days remaining</span>
          </div>
        </div>

        {/* Trend chart */}
        <div className="h-[150px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.chartData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                hide 
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `$${value?.toLocaleString() || '0'}`,
                  name === 'actual' ? 'Actual' : 'Projected'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="projected" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <ReferenceLine 
                y={forecast.dailyAverage} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insight message */}
        <div className={cn(
          'p-3 rounded-lg text-sm',
          forecast.isOnTrack ? 'bg-chart-2/10 text-chart-2' : 'bg-chart-4/10 text-chart-4'
        )}>
          {forecast.isOnTrack ? (
            <>
              🎯 At this pace, you'll exceed your goal by{' '}
              <strong>${Math.round(forecast.projectedTotal - monthlyTarget).toLocaleString()}</strong>
            </>
          ) : (
            <>
              ⚡ To hit your goal, increase daily revenue to{' '}
              <strong>${Math.round(forecast.requiredDaily).toLocaleString()}</strong>
              {' '}(+${Math.round(forecast.requiredDaily - forecast.dailyAverage).toLocaleString()}/day)
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
