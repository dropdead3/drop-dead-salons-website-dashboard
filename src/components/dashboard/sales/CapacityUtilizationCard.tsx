import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { useCapacityUtilization, CapacityPeriod, DayCapacity } from '@/hooks/useCapacityUtilization';
import { LocationSelect } from '@/components/ui/location-select';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Gauge, Clock, DollarSign, TrendingDown, Calendar, PieChart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  Legend,
} from 'recharts';

const PERIOD_LABELS: Record<CapacityPeriod, string> = {
  'tomorrow': 'Tomorrow',
  '7days': 'Next 7 Days',
  '30days': 'Next 30 Days',
};

// Utilization color thresholds
function getUtilizationColor(percent: number): string {
  if (percent >= 70) return 'hsl(var(--chart-2))'; // Green
  if (percent >= 50) return 'hsl(45 93% 47%)'; // Amber
  return 'hsl(0 72% 51%)'; // Red
}

function getUtilizationBadgeVariant(percent: number): 'default' | 'secondary' | 'destructive' {
  if (percent >= 70) return 'default';
  if (percent >= 50) return 'secondary';
  return 'destructive';
}

// Custom bar label
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

// Custom X-axis tick
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
        {day.gapHours > 0 ? `${day.gapHours}h open` : 'Full'}
      </text>
    </g>
  );
}

// Category colors for pie chart
const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--muted-foreground))',
];

export function CapacityUtilizationCard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<CapacityPeriod>('7days');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const { data, isLoading, error } = useCapacityUtilization(period, selectedLocation);

  const handleViewDetails = () => {
    navigate('/dashboard/admin/operational-analytics?tab=appointments');
  };

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

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Unable to load capacity data
        </CardContent>
      </Card>
    );
  }

  const {
    days,
    totalAvailableHours,
    totalBookedHours,
    totalGapHours,
    overallUtilization,
    totalAppointments,
    avgHourlyRevenue,
    gapRevenue,
    serviceMix,
    peakDay,
    lowDay,
  } = data;

  // Chart data
  const chartData = days.map(day => ({
    name: day.dayName,
    utilization: day.utilizationPercent,
    gapHours: day.gapHours,
    bookedHours: day.bookedHours,
  }));

  // Pie chart data for service mix
  const pieData = serviceMix.slice(0, 6).map((item, index) => ({
    name: item.category,
    value: item.hours,
    percentage: item.percentage,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));

  const showChart = period !== 'tomorrow' && days.length > 1;
  const showPieChart = serviceMix.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-base">Capacity Utilization</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleViewDetails}
              >
                View Details
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <LocationSelect
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                includeAll={true}
                allLabel="All Locations"
                triggerClassName="h-8 w-[180px] text-xs"
              />
              <Badge 
                variant={getUtilizationBadgeVariant(overallUtilization)}
                className="text-xs whitespace-nowrap"
              >
                {overallUtilization}% utilized
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <CardDescription>How much of your salon's capacity is booked</CardDescription>
            <ToggleGroup 
              type="single" 
              value={period} 
              onValueChange={(v) => v && setPeriod(v as CapacityPeriod)}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem value="tomorrow" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                Tomorrow
              </ToggleGroupItem>
              <ToggleGroupItem value="7days" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                7 Days
              </ToggleGroupItem>
              <ToggleGroupItem value="30days" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                30 Days
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
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
            value={overallUtilization} 
            className="h-3"
            indicatorClassName={cn(
              overallUtilization >= 70 && 'bg-chart-2',
              overallUtilization >= 50 && overallUtilization < 70 && 'bg-amber-500',
              overallUtilization < 50 && 'bg-destructive'
            )}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-center mb-1">
              <Clock className="w-4 h-4 text-chart-3" />
            </div>
            <span className="text-lg font-display tabular-nums">{totalGapHours}h</span>
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
              <MetricInfoTooltip description={`Total scheduled appointments for ${PERIOD_LABELS[period].toLowerCase()}.`} />
            </div>
          </div>
        </div>

        {/* Daily Utilization Chart */}
        {showChart && chartData.length > 0 && (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 5, bottom: 35, left: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={<DayXAxisTick days={days} />}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={40}
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
                    if (name === 'gapHours') return [`${value}h`, 'Open Hours'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    const day = days.find(d => d.dayName === label);
                    return day ? format(parseISO(day.date), 'EEEE, MMM d') : label;
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
        )}

        {/* Tomorrow View */}
        {period === 'tomorrow' && days.length > 0 && days[0] && (
          <div className="p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {format(parseISO(days[0].date), 'EEEE, MMMM d')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {days[0].bookedHours}h booked • {days[0].gapHours}h available
                </p>
              </div>
              <div className="text-right">
                <Badge 
                  variant={getUtilizationBadgeVariant(days[0].utilizationPercent)}
                  className="text-sm"
                >
                  {days[0].utilizationPercent}% capacity
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Service Mix Breakdown */}
        {showPieChart && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Service Mix</span>
              <MetricInfoTooltip description="Breakdown of booked time by service category. Shows how salon capacity is being used." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
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
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {serviceMix.slice(0, 5).map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
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

        {/* Opportunity Callout */}
        {overallUtilization < 70 && totalGapHours > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  Room for {Math.round(totalGapHours / 2)} more bookings
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lowDay && lowDay.utilizationPercent < 50 && (
                    <>{format(parseISO(lowDay.date), 'EEEE')} has the most availability ({lowDay.gapHours}h open)</>
                  )}
                  {!lowDay && `Fill unused hours to capture $${gapRevenue.toLocaleString()} in potential revenue`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
