import { TrendingUp, TrendingDown, Minus, RefreshCw, Globe, Eye, Clock, MousePointerClick } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsiteAnalytics } from '@/hooks/useWebsiteAnalytics';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendSparkline } from './TrendSparkline';
import { useMemo } from 'react';

interface TrendBadgeProps {
  value: number;
  inverted?: boolean; // For metrics where down is good (like bounce rate)
}

function TrendBadge({ value, inverted = false }: TrendBadgeProps) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNeutral = Math.abs(value) < 0.5;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>0%</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>
    </span>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function WebsiteAnalyticsWidget() {
  const { summary, isLoading, refreshAnalytics, isRefreshing } = useWebsiteAnalytics();

  // Extract sparkline data from weekly data
  const sparklineData = useMemo(() => {
    if (!summary?.weeklyData) return { pageviews: [], duration: [], bounce: [] };
    return {
      pageviews: summary.weeklyData.map(w => w.pageviews),
      duration: summary.weeklyData.map(w => w.avgSessionDuration),
      bounce: summary.weeklyData.map(w => w.bounceRate),
    };
  }, [summary?.weeklyData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.weeklyData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-primary" />
            Website Traffic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No analytics data available yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Publish your site to start tracking visitors.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => refreshAnalytics()}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-2" />
              )}
              Fetch Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = summary.weeklyData.map(week => ({
    week: format(parseISO(week.weekStart), 'MMM d'),
    visitors: week.visitors,
    pageviews: week.pageviews,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-primary" />
            Website Traffic
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => refreshAnalytics()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metric */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {summary.thisWeek.visitors.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">visitors this week</p>
          </div>
          <div className="text-right">
            <TrendBadge value={summary.trends.visitors} />
            <p className="text-xs text-muted-foreground mt-0.5">vs last week</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <p className="text-xs font-medium">{payload[0]?.payload?.week}</p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0]?.value?.toLocaleString()} visitors
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorVisitors)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Secondary metrics with sparklines */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="h-3 w-3" />
            </div>
            <p className="text-sm font-medium">{summary.thisWeek.pageviews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pageviews</p>
            {sparklineData.pageviews.length >= 2 && (
              <div className="flex justify-center mt-1.5">
                <TrendSparkline data={sparklineData.pageviews} size="xs" variant="primary" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
            </div>
            <p className="text-sm font-medium">{formatDuration(summary.thisWeek.avgSessionDuration)}</p>
            <p className="text-xs text-muted-foreground">Avg. Duration</p>
            {sparklineData.duration.length >= 2 && (
              <div className="flex justify-center mt-1.5">
                <TrendSparkline data={sparklineData.duration} size="xs" variant="success" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MousePointerClick className="h-3 w-3" />
            </div>
            <p className="text-sm font-medium">{summary.thisWeek.bounceRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
            {sparklineData.bounce.length >= 2 && (
              <div className="flex justify-center mt-1.5">
                <TrendSparkline data={sparklineData.bounce} size="xs" invertTrend />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
