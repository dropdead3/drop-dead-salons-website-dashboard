import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useForecastRevenue, ForecastPeriod, DayForecast, WeekForecast } from '@/hooks/useForecastRevenue';
import { useYearlyGoalProgress } from '@/hooks/useYearlyGoalProgress';
import { LocationSelect } from '@/components/ui/location-select';
import { DayAppointmentsSheet } from './DayAppointmentsSheet';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarRange, TrendingUp, TrendingDown, Calendar, Users, Info, Target } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList 
} from 'recharts';

const PERIOD_LABELS: Record<ForecastPeriod, string> = {
  'tomorrow': 'Tomorrow',
  'todayToEom': 'Today to EOM',
  '7days': '7 Days',
  '30days': '30 Days',
  '60days': '60 Days',
};

const PERIOD_TOTAL_LABELS: Record<ForecastPeriod, string> = {
  'tomorrow': 'Tomorrow Total',
  'todayToEom': 'Month Total',
  '7days': '7-Day Total',
  '30days': '30-Day Total',
  '60days': '60-Day Total',
};

const PERIOD_AVG_LABELS: Record<ForecastPeriod, string> = {
  'tomorrow': 'Projected',
  'todayToEom': 'Daily Avg',
  '7days': 'Daily Avg',
  '30days': 'Weekly Avg',
  '60days': 'Weekly Avg',
};

// Label positioned above each bar for revenue
function AboveBarLabel({ x, y, width, value }: any) {
  if (value === undefined || value === null || value === 0) return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      className="fill-foreground text-xs font-medium tabular-nums"
      style={{ pointerEvents: 'none' }}
    >
      ${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
    </text>
  );
}

// Custom X-axis tick for daily view
function DailyXAxisTick({ x, y, payload, days, peakDate, onDayClick, isEomPeriod, is7DaysPeriod }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const day = days.find((d: DayForecast) => d.dayName === payload.value);
  if (!day) return null;
  
  const dayIndex = days.findIndex((d: DayForecast) => d.dayName === payload.value);
  
  // For EOM: index 0 = Today, index 1 = Tomorrow
  // For 7 Days: index 0 = Tomorrow (starts from tomorrow)
  const isTodayHighlight = isEomPeriod && dayIndex === 0;
  const isTomorrowHighlight = (isEomPeriod && dayIndex === 1) || (is7DaysPeriod && dayIndex === 0);
  
  // Determine the label to display
  const getDisplayLabel = () => {
    if (isTodayHighlight) return 'Today';
    if (isTomorrowHighlight) return 'Tomorrow';
    return day.dayName;
  };
  
  return (
    <g 
      transform={`translate(${x},${y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <motion.g
        animate={{ scale: isHovered ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{ originX: 0.5, originY: 0 }}
      >
        <text 
          x={0} y={0} dy={12} 
          textAnchor="middle" 
          className="text-[11px] fill-foreground"
          style={{ fontWeight: (isTodayHighlight || isTomorrowHighlight) ? 600 : 500 }}
        >
          {getDisplayLabel()}
        </text>
        <text 
          x={0} y={0} dy={26} 
          textAnchor="middle" 
          className="fill-primary text-[11px] cursor-pointer"
          style={{ 
            fontWeight: 500,
            textDecoration: isHovered ? 'underline' : 'none',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDayClick(day);
          }}
        >
          {day.appointmentCount} appt{day.appointmentCount !== 1 ? 's' : ''}
        </text>
      </motion.g>
    </g>
  );
}

// Custom X-axis tick for weekly view
function WeeklyXAxisTick({ x, y, payload, weeks, peakWeekStart }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const week = weeks.find((w: WeekForecast) => w.weekLabel === payload.value);
  if (!week) return null;
  const isPeak = week.weekStart === peakWeekStart;
  
  return (
    <g 
      transform={`translate(${x},${y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.g
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{ originX: 0.5, originY: 0 }}
      >
        <text 
          x={0} y={0} dy={12} 
          textAnchor="middle" 
          className={cn("text-[10px]", isPeak ? "fill-chart-2" : "fill-foreground")}
          style={{ fontWeight: 500 }}
        >
          {week.weekLabel}
        </text>
        <text 
          x={0} y={0} dy={24} 
          textAnchor="middle" 
          className="fill-muted-foreground text-[10px]"
        >
          {week.appointmentCount} appts
        </text>
      </motion.g>
    </g>
  );
}

// Yearly Goal Progress Section
function YearlyGoalProgressSection({ locationId }: { locationId?: string }) {
  const { data: goalData, isLoading } = useYearlyGoalProgress(locationId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!goalData) return null;

  const {
    ytdRevenue,
    yearlyGoal,
    percentComplete,
    expectedPercent,
    isOnTrack,
    aheadBehindAmount,
    requiredMonthlyPace,
    remainingMonths,
  } = goalData;

  const statusColor = isOnTrack ? 'text-chart-2' : 'text-chart-4';
  const StatusIcon = isOnTrack ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Yearly Goal Progress</span>
        </div>
        <Badge variant={isOnTrack ? 'default' : 'secondary'} className="text-xs">
          <StatusIcon className={cn('w-3 h-3 mr-1', statusColor)} />
          {isOnTrack ? 'On Track' : 'Behind'}
        </Badge>
      </div>

      {/* Progress bar with expected marker */}
      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={Math.min(percentComplete, 100)} 
            className="h-3"
            indicatorClassName={isOnTrack ? 'bg-chart-2' : 'bg-chart-4'}
          />
          {/* Expected progress marker */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-foreground/60"
            style={{ left: `${Math.min(expectedPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentComplete.toFixed(1)}% achieved</span>
          <span>Expected: {expectedPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <BlurredAmount>${ytdRevenue.toLocaleString()}</BlurredAmount> earned
        </span>
        <span className="text-muted-foreground">
          <BlurredAmount>${yearlyGoal.toLocaleString()}</BlurredAmount> goal
        </span>
      </div>

      {/* Ahead/Behind indicator */}
      <div className={cn(
        'p-2 rounded-lg text-sm flex items-center justify-between',
        isOnTrack ? 'bg-chart-2/10' : 'bg-chart-4/10'
      )}>
        <span className={statusColor}>
          {isOnTrack ? (
            <>+<BlurredAmount>${Math.abs(aheadBehindAmount).toLocaleString()}</BlurredAmount> ahead of pace</>
          ) : (
            <>-<BlurredAmount>${Math.abs(aheadBehindAmount).toLocaleString()}</BlurredAmount> behind pace</>
          )}
        </span>
        {!isOnTrack && remainingMonths > 0 && (
          <span className="text-xs text-muted-foreground">
            Need <BlurredAmount>${Math.round(requiredMonthlyPace).toLocaleString()}</BlurredAmount>/mo
          </span>
        )}
      </div>
    </div>
  );
}

export function ForecastingCard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ForecastPeriod>('tomorrow');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, error } = useForecastRevenue(period, selectedLocation);

  const handleDayClick = (day: DayForecast) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

  const handleViewDetails = () => {
    navigate('/dashboard/admin/sales');
  };

  const showWeeklyChart = period === '30days' || period === '60days';
  const showChart = period !== 'tomorrow';
  const isEomPeriod = period === 'todayToEom';
  const is7DaysPeriod = period === '7days';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
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
          Unable to load forecast
        </CardContent>
      </Card>
    );
  }

  const { days, weeks, totalRevenue, totalAppointments, averageDaily, averageWeekly, peakDay, peakWeek } = data;

  // Chart data for daily view
  const dailyChartData = days.map((day, index) => ({
    name: day.dayName,
    confirmedRevenue: day.confirmedRevenue,
    unconfirmedRevenue: day.unconfirmedRevenue,
    totalRevenue: day.revenue,
    appointments: day.appointmentCount,
    isPeak: peakDay?.date === day.date,
    isToday: isEomPeriod && index === 0,
  }));

  // Chart data for weekly view
  const weeklyChartData = weeks.map(week => ({
    name: week.weekLabel,
    confirmedRevenue: week.confirmedRevenue,
    unconfirmedRevenue: week.unconfirmedRevenue,
    totalRevenue: week.revenue,
    appointments: week.appointmentCount,
    isPeak: peakWeek?.weekStart === week.weekStart,
  }));

  const chartData = showWeeklyChart ? weeklyChartData : dailyChartData;

  // Determine average value to show
  const avgValue = (period === '30days' || period === '60days') 
    ? Math.round(averageWeekly) 
    : Math.round(averageDaily);

  // Tooltip descriptions based on period
  const totalTooltip = `Sum of projected revenue from all scheduled appointments over the ${PERIOD_LABELS[period].toLowerCase()}.`;
  const avgTooltip = period === 'tomorrow' 
    ? 'Total projected revenue for tomorrow.'
    : (period === '7days' || period === 'todayToEom'
      ? `${PERIOD_TOTAL_LABELS[period]} ÷ ${days.length}. Average projected daily revenue.`
      : `${PERIOD_TOTAL_LABELS[period]} ÷ ${weeks.length || 1}. Average projected weekly revenue.`);
  const apptTooltip = `Total count of scheduled appointments for the ${PERIOD_LABELS[period].toLowerCase()}.`;

  return (
    <>
      <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-base">Forecasting</CardTitle>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-primary/10"
                    onClick={handleViewDetails}
                  >
                    <Info className="w-4 h-4 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  View full analytics
                </TooltipContent>
              </UITooltip>
              <CommandCenterVisibilityToggle 
                elementKey="week_ahead_forecast" 
                elementName="Forecasting" 
              />
            </div>
            <div className="flex items-center gap-2">
                <LocationSelect
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                  includeAll={true}
                  allLabel="All Locations"
                  triggerClassName="h-8 w-[180px] text-xs"
                />
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {totalAppointments} bookings
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <CardDescription>Projected revenue from scheduled appointments</CardDescription>
              <ToggleGroup 
                type="single" 
                value={period} 
                onValueChange={(v) => v && setPeriod(v as ForecastPeriod)}
                className="bg-muted/50 p-1 rounded-lg"
              >
                <ToggleGroupItem value="tomorrow" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                  Tomorrow
                </ToggleGroupItem>
                <ToggleGroupItem value="todayToEom" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                  EOM
                </ToggleGroupItem>
                <ToggleGroupItem value="7days" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                  7 Days
                </ToggleGroupItem>
                <ToggleGroupItem value="30days" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                  30 Days
                </ToggleGroupItem>
                <ToggleGroupItem value="60days" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                  60 Days
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className={cn("grid gap-3", period === 'tomorrow' ? 'grid-cols-2' : 'grid-cols-3')}>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <AnimatedBlurredAmount 
                value={totalRevenue}
                prefix="$"
                className="text-lg font-display tabular-nums"
              />
              <div className="flex items-center gap-1 justify-center">
                <p className="text-xs text-muted-foreground">{PERIOD_TOTAL_LABELS[period]}</p>
                <MetricInfoTooltip description={totalTooltip} />
              </div>
            </div>
            {period !== 'tomorrow' && (
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-center mb-1">
                  <Calendar className="w-4 h-4 text-chart-2" />
                </div>
                <AnimatedBlurredAmount 
                  value={avgValue}
                  prefix="$"
                  className="text-lg font-display tabular-nums"
                />
                <div className="flex items-center gap-1 justify-center">
                  <p className="text-xs text-muted-foreground">{PERIOD_AVG_LABELS[period]}</p>
                  <MetricInfoTooltip description={avgTooltip} />
                </div>
              </div>
            )}
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-center mb-1">
                <Users className="w-4 h-4 text-chart-3" />
              </div>
              <span className="text-lg font-display tabular-nums">{totalAppointments}</span>
              <div className="flex items-center gap-1 justify-center">
                <p className="text-xs text-muted-foreground">Appointments</p>
                <MetricInfoTooltip description={apptTooltip} />
              </div>
            </div>
          </div>

          {/* Bar Chart - only show if not tomorrow */}
          {showChart && chartData.length > 0 && (
            <div className={cn("h-[180px]", showWeeklyChart && "h-[200px]")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 25, right: 5, bottom: showWeeklyChart ? 40 : 35, left: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={showWeeklyChart 
                      ? <WeeklyXAxisTick weeks={weeks} peakWeekStart={peakWeek?.weekStart} />
                      : <DailyXAxisTick days={days} peakDate={peakDay?.date} onDayClick={handleDayClick} isEomPeriod={isEomPeriod} is7DaysPeriod={is7DaysPeriod} />
                    }
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={showWeeklyChart ? 45 : 40}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'confirmedRevenue') return [`$${value.toLocaleString()}`, 'Confirmed'];
                      if (name === 'unconfirmedRevenue') return [`$${value.toLocaleString()}`, 'Unconfirmed'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      if (showWeeklyChart) {
                        const week = weeks.find(w => w.weekLabel === label);
                        return week ? `${week.weekLabel} (${week.appointmentCount} appts)` : label;
                      }
                      const day = days.find(d => d.dayName === label);
                      return day ? format(parseISO(day.date), 'EEEE, MMM d') : label;
                    }}
                  />
                  {/* Unconfirmed revenue - bottom of stack */}
                  <Bar 
                    dataKey="unconfirmedRevenue" 
                    stackId="revenue"
                    radius={[0, 0, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const isToday = 'isToday' in entry && entry.isToday;
                      return (
                        <Cell 
                          key={`unconfirmed-${index}`}
                          fill={entry.isPeak ? 'hsl(var(--chart-2))' : (isToday ? 'hsl(var(--chart-3))' : 'hsl(var(--primary))')}
                          fillOpacity={entry.isPeak ? 0.6 : (isToday ? 0.7 : 0.5)}
                        />
                      );
                    })}
                  </Bar>
                  {/* Confirmed revenue - top of stack, solid */}
                  <Bar 
                    dataKey="confirmedRevenue" 
                    stackId="revenue"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="totalRevenue"
                      content={AboveBarLabel}
                    />
                    {chartData.map((entry, index) => {
                      const isToday = 'isToday' in entry && entry.isToday;
                      return (
                        <Cell 
                          key={`confirmed-${index}`}
                          fill={entry.isPeak ? 'hsl(var(--chart-2))' : (isToday ? 'hsl(var(--chart-3))' : 'hsl(var(--primary))')}
                          fillOpacity={entry.isPeak ? 1 : (isToday ? 1 : 0.9)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tomorrow single stat view */}
          {period === 'tomorrow' && days.length > 0 && days[0] && (
            <div 
              className="p-4 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => handleDayClick(days[0])}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(days[0].date), 'EEEE, MMMM d')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view {days[0].appointmentCount} appointment{days[0].appointmentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {days[0].confirmedRevenue > 0 && (
                        <span className="text-primary">${days[0].confirmedRevenue.toLocaleString()} confirmed</span>
                      )}
                    </Badge>
                    {days[0].unconfirmedRevenue > 0 && (
                      <Badge variant="outline" className="text-xs opacity-60">
                        ${days[0].unconfirmedRevenue.toLocaleString()} unconfirmed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Yearly Goal Progress - Only show for EOM period */}
          {isEomPeriod && (
            <YearlyGoalProgressSection locationId={selectedLocation} />
          )}

          {/* Peak Day/Week Callout */}
          {showWeeklyChart && peakWeek && peakWeek.revenue > 0 && (
            <div className="flex items-center justify-between p-2 bg-chart-2/10 rounded-lg text-sm">
              <span className="text-muted-foreground">
                Busiest week: <span className="font-medium text-foreground">{peakWeek.weekLabel}</span>
              </span>
              <span className="font-display text-chart-2">
                <BlurredAmount>${peakWeek.revenue.toLocaleString()}</BlurredAmount>
              </span>
            </div>
          )}
          {!showWeeklyChart && period !== 'tomorrow' && !isEomPeriod && peakDay && peakDay.revenue > 0 && (
            <div className="flex items-center justify-between p-2 bg-chart-2/10 rounded-lg text-sm">
              <span className="text-muted-foreground">
                Busiest day: <span className="font-medium text-foreground">{format(parseISO(peakDay.date), 'EEEE')}</span>
              </span>
              <span className="font-display text-chart-2">
                <BlurredAmount>${peakDay.revenue.toLocaleString()}</BlurredAmount>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <DayAppointmentsSheet 
        day={selectedDay}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
