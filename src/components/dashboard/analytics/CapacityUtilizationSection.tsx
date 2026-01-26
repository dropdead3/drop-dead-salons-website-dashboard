import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { Gauge, Clock, TrendingDown, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { CapacityData, DayCapacity } from '@/hooks/useHistoricalCapacityUtilization';

export type CapacityDateRangeType = 'tomorrow' | '7days' | '30days' | '90days';

interface CapacityUtilizationSectionProps {
  capacityData: CapacityData | null;
  isLoading: boolean;
  dateRange: CapacityDateRangeType;
}

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--muted-foreground))',
];

const DATE_RANGE_LABELS: Record<string, string> = {
  'tomorrow': 'tomorrow',
  '7days': 'the next 7 days',
  '30days': 'the next 30 days',
  '90days': 'the next 90 days',
};

function getUtilizationColor(percent: number): string {
  if (percent >= 70) return 'hsl(var(--chart-2))';
  if (percent >= 50) return 'hsl(45 93% 47%)';
  return 'hsl(0 72% 51%)';
}

function getUtilizationBadgeVariant(percent: number): 'default' | 'secondary' | 'destructive' {
  if (percent >= 70) return 'default';
  if (percent >= 50) return 'secondary';
  return 'destructive';
}

// Custom bar label showing percentage above each bar
function UtilizationBarLabel({ x, y, width, value }: any) {
  if (value === undefined || value === null) return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      className="fill-foreground text-[10px] font-medium tabular-nums"
    >
      {value}%
    </text>
  );
}

// Custom X-axis tick showing day name and hours open
function DayXAxisTick({ x, y, payload, days }: any) {
  const day = days.find((d: DayCapacity) => d.dayName === payload.value);
  if (!day) return null;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} y={0} dy={12} 
        textAnchor="middle" 
        className="fill-foreground text-[11px]"
        style={{ fontWeight: 500 }}
      >
        {day.dayName}
      </text>
      <text 
        x={0} y={0} dy={24} 
        textAnchor="middle" 
        className="fill-muted-foreground text-[10px]"
      >
        {day.gapHours > 0 ? `${Math.round(day.gapHours)}h open` : 'Full'}
      </text>
    </g>
  );
}

export function CapacityUtilizationSection({ 
  capacityData, 
  isLoading,
  dateRange 
}: CapacityUtilizationSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!capacityData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No capacity data available. Check that locations have stylist capacity configured.
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    totalAvailableHours,
    totalBookedHours,
    overallUtilization,
    gapHours,
    gapRevenue,
    avgHourlyRevenue,
    dailyCapacity,
    serviceMix,
    totalAppointments,
    peakDay,
    lowDay,
  } = capacityData;

  // Chart data - limit for 90 days view
  const chartData = dateRange === '90days' 
    ? dailyCapacity.filter((_, i) => i % 7 === 0).map(day => ({
        name: day.dayName,
        utilization: day.utilizationPercent,
        gapHours: day.gapHours,
        bookedHours: day.bookedHours,
        date: day.date,
      }))
    : dailyCapacity.map(day => ({
        name: day.dayName,
        utilization: day.utilizationPercent,
        gapHours: day.gapHours,
        bookedHours: day.bookedHours,
        date: day.date,
      }));

  const pieData = serviceMix.slice(0, 6).map((item, index) => ({
    name: item.category,
    value: item.hours,
    percentage: item.percentage,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));

  const showChart = chartData.length > 1;
  const showPieChart = serviceMix.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-base">Capacity Utilization</CardTitle>
              <MetricInfoTooltip 
                description="Compares booked chair-hours against available capacity (Operating Hours × Stylist Count)"
              />
            </div>
            <Badge 
              variant={getUtilizationBadgeVariant(overallUtilization)}
              className="text-xs whitespace-nowrap"
            >
              {overallUtilization}% utilized
            </Badge>
          </div>
          <CardDescription>How much of your salon's capacity is booked for {DATE_RANGE_LABELS[dateRange]}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Utilization Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalBookedHours}h booked of {totalAvailableHours}h available
            </span>
            <span 
              className="font-medium tabular-nums"
              style={{ color: getUtilizationColor(overallUtilization) }}
            >
              {overallUtilization}%
            </span>
          </div>
          <Progress 
            value={Math.min(overallUtilization, 100)} 
            className="h-3"
            indicatorClassName={cn(
              overallUtilization >= 70 && 'bg-chart-2',
              overallUtilization >= 50 && overallUtilization < 70 && 'bg-amber-500',
              overallUtilization < 50 && 'bg-destructive'
            )}
          />
        </div>

        {/* Summary Stats - 3 column centered layout */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-center mb-1">
              <Clock className="w-4 h-4 text-chart-3" />
            </div>
            <span className="text-lg font-display tabular-nums">{gapHours}h</span>
            <div className="flex items-center gap-1 justify-center">
              <p className="text-xs text-muted-foreground">Unused Hours</p>
              <MetricInfoTooltip description="Total chair-hours available but not booked. Each stylist-hour counts as one chair-hour." />
            </div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-center mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <AnimatedBlurredAmount 
              value={gapRevenue}
              prefix="$"
              className="text-lg font-display tabular-nums"
            />
            <div className="flex items-center gap-1 justify-center">
              <p className="text-xs text-muted-foreground">Gap Revenue</p>
              <MetricInfoTooltip description={`Potential revenue if unused hours were booked. Based on avg hourly revenue of $${avgHourlyRevenue}.`} />
            </div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-center mb-1">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-display tabular-nums">{totalAppointments}</span>
            <div className="flex items-center gap-1 justify-center">
              <p className="text-xs text-muted-foreground">Appointments</p>
              <MetricInfoTooltip description={`Total completed appointments ${DATE_RANGE_LABELS[dateRange]}.`} />
            </div>
          </div>
        </div>

        {/* Daily Utilization Chart */}
        {showChart && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Daily Utilization</span>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 5, bottom: 35, left: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={dateRange === '7days' 
                      ? <DayXAxisTick days={dailyCapacity} /> 
                      : { fontSize: 10 }
                    }
                    tickFormatter={dateRange !== '7days' ? (value, index) => {
                      const day = chartData[index];
                      if (day) {
                        try {
                          return format(parseISO(day.date), dateRange === '90days' ? 'MMM d' : 'EEE');
                        } catch {
                          return value;
                        }
                      }
                      return value;
                    } : undefined}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={dateRange === '7days' ? 40 : 20}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'utilization') return [`${value}%`, 'Utilization'];
                      if (name === 'gapHours') return [`${Math.round(value)}h`, 'Open Hours'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const day = payload[0].payload;
                        try {
                          return format(parseISO(day.date), 'EEEE, MMM d');
                        } catch {
                          return label;
                        }
                      }
                      return label;
                    }}
                  />
                  <Bar 
                    dataKey="utilization" 
                    radius={[4, 4, 0, 0]}
                    label={<UtilizationBarLabel />}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={getUtilizationColor(entry.utilization)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Service Mix Breakdown */}
        {showPieChart && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Service Mix</span>
              <MetricInfoTooltip description="Breakdown of booked time by service category. Shows how salon capacity is being used." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {serviceMix.slice(0, 5).map((item, index) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground truncate max-w-[100px]">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-medium tabular-nums">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Opportunity Insights */}
        {overallUtilization < 70 && gapHours > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  Room for ~{Math.round(gapHours / 2)} more bookings
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lowDay && lowDay.utilizationPercent < 50 ? (
                    <>{format(parseISO(lowDay.date), 'EEEE')} had the most availability ({Math.round(lowDay.gapHours)}h open)</>
                  ) : (
                    <>Fill unused hours to capture ${gapRevenue.toLocaleString()} in potential revenue</>
                  )}
                </p>
                {peakDay && peakDay.utilizationPercent >= 80 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💪 {format(parseISO(peakDay.date), 'EEEE')} was your strongest day ({peakDay.utilizationPercent}% utilized)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
