import { useState, useRef, useMemo, useCallback } from 'react';
import { DayProviderBreakdownPanel } from './DayProviderBreakdownPanel';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { BlurredAmount, useHideNumbers } from '@/contexts/HideNumbersContext';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { formatCurrencyWhole as formatCurrencyWholeUtil } from '@/lib/formatCurrency';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useForecastRevenue, ForecastPeriod, DayForecast, WeekForecast, CategoryBreakdown } from '@/hooks/useForecastRevenue';
import { CategoryBreakdownPanel, BreakdownMode, BreakdownType } from './CategoryBreakdownPanel';
import { useYearlyGoalProgress } from '@/hooks/useYearlyGoalProgress';
import { LocationSelect } from '@/components/ui/location-select';
import { DayAppointmentsSheet } from './DayAppointmentsSheet';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarRange, TrendingUp, TrendingDown, Calendar, Users, Info, Target, ChevronDown } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';
import { cn } from '@/lib/utils';
import { parseISO, differenceInDays, endOfMonth } from 'date-fns';
import { useRevenueForecast } from '@/hooks/useRevenueForecast';
import { motion, useInView } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList,
  Customized 
} from 'recharts';

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

const PERIOD_DESCRIPTIONS: Record<ForecastPeriod, string> = {
  'tomorrow': 'Projected revenue from scheduled appointments occurring tomorrow',
  'todayToEom': 'Projected revenue from scheduled appointments through end of month',
  '7days': 'Projected revenue from scheduled appointments over the next 7 days',
  '30days': 'Projected revenue from scheduled appointments over the next 30 days',
  '60days': 'Projected revenue from scheduled appointments over the next 60 days',
};

// Custom tooltip for forecast chart
function ForecastTooltip({ active, payload, label, days, weeks, showWeeklyChart }: any) {
  const { formatCurrency } = useFormatCurrency();
  const { formatDate } = useFormatDate();
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;

  // Get the display label (date or week)
  let displayLabel = label;
  if (showWeeklyChart) {
    const week = weeks?.find((w: WeekForecast) => w.weekLabel === label);
    displayLabel = week ? week.weekLabel : label;
  } else {
    const day = days?.find((d: DayForecast) => d.date === label);
    displayLabel = day ? formatDate(day.date, 'EEEE, MMM d') : label;
  }
  
  const confirmedRevenue = data.confirmedRevenue || 0;
  const unconfirmedRevenue = data.unconfirmedRevenue || 0;
  const totalRevenue = data.totalRevenue || 0;
  const appointments = data.appointments || 0;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg min-w-[180px]">
      <p className="font-medium text-sm mb-2">{displayLabel}</p>
      
      <div className="space-y-1.5">
        {/* Confirmed Revenue */}
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Confirmed</span>
          </div>
          <span className="font-medium tabular-nums">
            {formatCurrency(confirmedRevenue)}
          </span>
        </div>
        
        {/* Unconfirmed Revenue - only show if > 0 */}
        {unconfirmedRevenue > 0 && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-muted-foreground">Unconfirmed</span>
            </div>
            <span className="font-medium tabular-nums text-muted-foreground">
              {formatCurrency(unconfirmedRevenue)}
            </span>
          </div>
        )}
        
        {/* Divider */}
        <div className="border-t border-border/50 my-1.5" />
        
        {/* Total */}
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium tabular-nums text-primary">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
        
        {/* Appointments */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Appointments</span>
          <span className="font-medium tabular-nums">{appointments}</span>
        </div>
      </div>
    </div>
  );
}

// Label positioned above each bar for revenue
function AboveBarLabel({ x, y, width, value, ...rest }: any) {
  if (value === undefined || value === null || value === 0) return null;
  const isPeak = rest?.isPeak ?? rest?.payload?.isPeak;
  const isBlurred = rest?.isBlurred;
  const onReveal = rest?.onReveal;
  
  return (
    <g 
      style={{ pointerEvents: isBlurred ? 'auto' : 'none', cursor: isBlurred ? 'pointer' : 'default' }}
      onClick={isBlurred ? onReveal : undefined}
    >
      {isBlurred && <title>Click to reveal</title>}
      {isPeak && (
        <circle cx={x + width / 2} cy={y - 22} r={3} fill="hsl(var(--chart-2))" />
      )}
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        className={cn("text-xs tabular-nums", isPeak ? "fill-chart-2" : "fill-foreground")}
        style={{ fontWeight: isPeak ? 700 : 500, filter: isBlurred ? 'blur(8px)' : 'none' }}
      >
        {value >= 1000 ? formatCurrencyWholeUtil(Math.round(value / 1000)) + 'k' : formatCurrencyWholeUtil(value)}
      </text>
    </g>
  );
}

// Custom X-axis tick for daily view
function DailyXAxisTick({ x, y, payload, days, peakDate, onDayClick, isEomPeriod, is7DaysPeriod }: any) {
  const { formatDate } = useFormatDate();
  const [isHovered, setIsHovered] = useState(false);
  const day = days.find((d: DayForecast) => d.date === payload.value);
  if (!day) return null;
  
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrowStr = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  const isTodayHighlight = day.date === todayStr;
  const isTomorrowHighlight = day.date === tomorrowStr;
  
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
          x={0} y={0} dy={25} 
          textAnchor="middle" 
          className="text-[10px] fill-muted-foreground"
        >
          {formatDate(day.date, 'MMM d')}
        </text>
        <text 
          x={0} y={0} dy={38} 
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
          {day.appointmentCount} appointment{day.appointmentCount !== 1 ? 's' : ''}
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
          {week.appointmentCount} appointments
        </text>
      </motion.g>
    </g>
  );
}

// Yearly Goal Progress Section
function YearlyGoalProgressSection({ locationId }: { locationId?: string }) {
  const { data: goalData, isLoading } = useYearlyGoalProgress(locationId);
  const { formatCurrency } = useFormatCurrency();

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
          <BlurredAmount>{formatCurrency(ytdRevenue)}</BlurredAmount> earned
        </span>
        <span className="text-muted-foreground">
          <BlurredAmount>{formatCurrency(yearlyGoal)}</BlurredAmount> goal
        </span>
      </div>

      {/* Ahead/Behind indicator */}
      <div className={cn(
        'p-2 rounded-lg text-sm flex items-center justify-between',
        isOnTrack ? 'bg-chart-2/10' : 'bg-chart-4/10'
      )}>
        <span className={statusColor}>
          {isOnTrack ? (
            <>+<BlurredAmount>{formatCurrency(Math.abs(aheadBehindAmount))}</BlurredAmount> ahead of pace</>
          ) : (
            <>-<BlurredAmount>{formatCurrency(Math.abs(aheadBehindAmount))}</BlurredAmount> behind pace</>
          )}
        </span>
        {!isOnTrack && remainingMonths > 0 && (
          <span className="text-xs text-muted-foreground">
            Need <BlurredAmount>{formatCurrency(Math.round(requiredMonthlyPace))}</BlurredAmount>/mo
          </span>
        )}
      </div>
    </div>
  );
}

function getForecastDays(period: ForecastPeriod): number {
  if (period === 'tomorrow') return 1;
  if (period === '7days') return 7;
  if (period === '30days') return 30;
  if (period === '60days') return 60;
  const today = new Date();
  return differenceInDays(endOfMonth(today), today) + 1;
}

export function ForecastingCard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ForecastPeriod>('7days');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStatCard, setSelectedStatCard] = useState<BreakdownMode | null>(null);
  const [breakdownType, setBreakdownType] = useState<BreakdownType>('category');
  const [selectedBarDay, setSelectedBarDay] = useState<DayForecast | null>(null);
  const { data, isLoading, error } = useForecastRevenue(period, selectedLocation);
  const forecastDays = getForecastDays(period);
  const { data: predictedData } = useRevenueForecast({
    forecastDays,
    locationId: selectedLocation === 'all' ? undefined : selectedLocation,
  });
  const { hideNumbers, requestUnhide } = useHideNumbers();
  const { formatCurrency, currency } = useFormatCurrency();
  const { formatDate } = useFormatDate();
  
  const chartRef = useRef<HTMLDivElement>(null);
  const isChartInView = useInView(chartRef, { once: true, amount: 0.3 });

  const handleDayClick = (day: DayForecast) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

  const handleViewDetails = () => {
    navigate('/dashboard/admin/sales');
  };

  const handleStatCardClick = useCallback((mode: BreakdownMode) => {
    setSelectedStatCard(prev => prev === mode ? null : mode);
  }, []);

  const handleBarClick = useCallback((dayDate: string) => {
    if (!data?.days) return;
    const day = data.days.find(d => d.date === dayDate);
    if (!day) return;
    setSelectedBarDay(prev => prev?.date === day.date ? null : day);
  }, [data?.days]);

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

  const { days, weeks, totalRevenue, totalAppointments, averageDaily, averageWeekly, peakDay, peakWeek, byCategory = {}, byLocation = {}, byStylist = {} } = data;
  const dayCount = days.length;


  // Chart data for daily view
  const dailyChartData = days.map((day, index) => ({
    name: day.date,
    confirmedRevenue: day.confirmedRevenue,
    unconfirmedRevenue: day.unconfirmedRevenue,
    totalRevenue: day.revenue,
    appointments: day.appointmentCount,
    isPeak: peakDay?.date === day.date,
    isToday: day.date === toLocalDateStr(new Date()),
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <CalendarRange className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="font-display text-base tracking-wide">FORECASTING</CardTitle>
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
            </div>
            <div className="flex items-center gap-2">
                <LocationSelect
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                  includeAll={true}
                  allLabel="All Locations"
                  triggerClassName="h-8 w-[220px] text-xs"
                />
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {totalAppointments} bookings
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between gap-6">
              <CardDescription>{PERIOD_DESCRIPTIONS[period]}</CardDescription>
              <Tabs value={period} onValueChange={(v) => v && setPeriod(v as ForecastPeriod)}>
                <TabsList>
                  <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                  <TabsTrigger value="todayToEom">EOM</TabsTrigger>
                  <TabsTrigger value="7days">7 Days</TabsTrigger>
                  <TabsTrigger value="30days">30 Days</TabsTrigger>
                  <TabsTrigger value="60days">60 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className={cn("grid gap-3", period === 'tomorrow' ? 'grid-cols-2' : 'grid-cols-3')}>
            <div
              className={cn(
                "text-center p-3 bg-muted/30 rounded-lg border cursor-pointer transition-all hover:-translate-y-0.5",
                selectedStatCard === 'revenue' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/30'
              )}
              onClick={() => handleStatCardClick('revenue')}
            >
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <AnimatedBlurredAmount 
                value={totalRevenue}
                currency={currency}
                className="text-lg font-display tabular-nums"
              />
              <div className="flex items-center gap-1 justify-center">
                <p className="text-xs text-muted-foreground">{PERIOD_TOTAL_LABELS[period]}</p>
                <MetricInfoTooltip description={totalTooltip} />
              </div>
              <ChevronDown className={cn('w-3 h-3 mx-auto mt-1 text-muted-foreground transition-transform', selectedStatCard === 'revenue' && 'rotate-180 text-primary')} />
            </div>
            {period !== 'tomorrow' && (
              <div
                className={cn(
                  "text-center p-3 bg-muted/30 rounded-lg border cursor-pointer transition-all hover:-translate-y-0.5",
                  selectedStatCard === 'dailyAvg' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/30'
                )}
                onClick={() => handleStatCardClick('dailyAvg')}
              >
                <div className="flex justify-center mb-1">
                  <Calendar className="w-4 h-4 text-chart-2" />
                </div>
                <AnimatedBlurredAmount 
                  value={avgValue}
                  currency={currency}
                  className="text-lg font-display tabular-nums"
                />
                <div className="flex items-center gap-1 justify-center">
                  <p className="text-xs text-muted-foreground">{PERIOD_AVG_LABELS[period]}</p>
                  <MetricInfoTooltip description={avgTooltip} />
                </div>
                <ChevronDown className={cn('w-3 h-3 mx-auto mt-1 text-muted-foreground transition-transform', selectedStatCard === 'dailyAvg' && 'rotate-180 text-primary')} />
              </div>
            )}
            <div
              className={cn(
                "text-center p-3 bg-muted/30 rounded-lg border cursor-pointer transition-all hover:-translate-y-0.5",
                selectedStatCard === 'count' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/30'
              )}
              onClick={() => handleStatCardClick('count')}
            >
              <div className="flex justify-center mb-1">
                <Users className="w-4 h-4 text-chart-3" />
              </div>
              <span className="text-lg font-display tabular-nums">{totalAppointments}</span>
              <div className="flex items-center gap-1 justify-center">
                <p className="text-xs text-muted-foreground">Appointments</p>
                <MetricInfoTooltip description={apptTooltip} />
              </div>
              <ChevronDown className={cn('w-3 h-3 mx-auto mt-1 text-muted-foreground transition-transform', selectedStatCard === 'count' && 'rotate-180 text-primary')} />
            </div>
          </div>

          {/* Scheduled vs Predicted (trend + history) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 py-2.5 px-3 rounded-lg bg-muted/20 border border-border/50 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Scheduled</span>
              <BlurredAmount className="font-medium tabular-nums">{formatCurrency(totalRevenue)}</BlurredAmount>
            </span>
            {predictedData?.summary != null && (
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">Predicted</span>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium tabular-nums cursor-help">
                      <BlurredAmount>{formatCurrency(predictedData.summary.totalPredicted)}</BlurredAmount>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[240px]">
                    Based on last 90 days, day-of-week patterns, and current bookings.
                  </TooltipContent>
                </UITooltip>
              </span>
            )}
          </div>

          {/* Breakdown type selector - shown when a stat card is expanded */}
          {selectedStatCard !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Drill down by:</span>
              <Tabs value={breakdownType} onValueChange={(v) => v && setBreakdownType(v as BreakdownType)}>
                <TabsList>
                  <TabsTrigger value="category">Category</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="stylist">Service Provider</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Breakdown Panel - Category, Location, or Service Provider */}
          {selectedStatCard !== null && (() => {
            const breakdownData = breakdownType === 'location' ? (byLocation ?? {}) : breakdownType === 'stylist' ? (byStylist ?? {}) : (byCategory ?? {});
            return Object.keys(breakdownData).length > 0 ? (
              <CategoryBreakdownPanel
                data={breakdownData}
                mode={selectedStatCard}
                dayCount={dayCount}
                isOpen={true}
                breakdownType={breakdownType}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-3">No {breakdownType === 'location' ? 'location' : breakdownType === 'stylist' ? 'service provider' : 'category'} data for this period</p>
            );
          })()}

          {/* Bar Chart - only show if not tomorrow */}
          {showChart && chartData.length > 0 && (
            <div className={cn("h-[220px]", showWeeklyChart && "h-[240px]")} ref={chartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 25, right: 5, bottom: showWeeklyChart ? 40 : 48, left: 10 }}>
                  <defs>
                    <linearGradient id="glassPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                      <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="glassPeak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.7} />
                      <stop offset="40%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="glassToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.7} />
                      <stop offset="40%" stopColor="hsl(var(--chart-3))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="glassPrimaryLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="glassPeakLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="glassTodayLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name" 
                    tick={showWeeklyChart 
                      ? <WeeklyXAxisTick weeks={weeks} peakWeekStart={peakWeek?.weekStart} />
                      : <DailyXAxisTick days={days} peakDate={peakDay?.date} onDayClick={handleDayClick} isEomPeriod={isEomPeriod} is7DaysPeriod={is7DaysPeriod} />
                    }
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--foreground) / 0.15)', strokeWidth: 1 }}
                    interval={0}
                    height={showWeeklyChart ? 45 : 40}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  
                  <Tooltip
                    content={
                      <ForecastTooltip 
                        days={days} 
                        weeks={weeks} 
                        showWeeklyChart={showWeeklyChart} 
                      />
                    }
                    cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}
                  />
                  {/* Unconfirmed revenue - bottom of stack */}
                  <Bar 
                    dataKey="unconfirmedRevenue" 
                    stackId="revenue"
                    radius={[0, 0, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                    onClick={(data: any) => !showWeeklyChart && handleBarClick(data.name)}
                    cursor={showWeeklyChart ? undefined : "pointer"}
                  >
                    {chartData.map((entry, index) => {
                      const isToday = 'isToday' in entry && entry.isToday;
                      return (
                        <Cell 
                          key={`unconfirmed-${index}`}
                          fill={entry.isPeak ? 'url(#glassPeakLight)' : (isToday ? 'url(#glassTodayLight)' : 'url(#glassPrimaryLight)')}
                          fillOpacity={1}
                          stroke={entry.isPeak ? 'hsl(var(--chart-2))' : (isToday ? 'hsl(var(--chart-3))' : 'hsl(var(--primary))')}
                          strokeOpacity={0.4}
                          strokeWidth={1}
                        />
                      );
                    })}
                  </Bar>
                  {/* Confirmed revenue - top of stack, solid */}
                  <Bar 
                    dataKey="confirmedRevenue" 
                    stackId="revenue"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                    onClick={(data: any) => !showWeeklyChart && handleBarClick(data.name)}
                    cursor={showWeeklyChart ? undefined : "pointer"}
                  >
                    <LabelList 
                      dataKey="totalRevenue"
                      content={(props: any) => <AboveBarLabel {...props} isBlurred={hideNumbers} onReveal={requestUnhide} />}
                    />
                    {chartData.map((entry, index) => {
                      const isToday = 'isToday' in entry && entry.isToday;
                      return (
                        <Cell 
                          key={`confirmed-${index}`}
                          fill={entry.isPeak ? 'url(#glassPeak)' : (isToday ? 'url(#glassToday)' : 'url(#glassPrimary)')}
                          fillOpacity={1}
                          stroke={entry.isPeak ? 'hsl(var(--chart-2))' : (isToday ? 'hsl(var(--chart-3))' : 'hsl(var(--primary))')}
                          strokeOpacity={0.5}
                          strokeWidth={1}
                        />
                      );
                    })}
                  </Bar>
                  {/* Daily average reference line - only for daily views */}
                  {!showWeeklyChart && averageDaily > 0 && (
                    <Customized component={(props: any) => {
                      const { yAxisMap, xAxisMap } = props;
                      if (!yAxisMap?.[0]?.scale || !xAxisMap?.[0]) return null;
                      const yPos = yAxisMap[0].scale(averageDaily);
                      const chartLeft = xAxisMap[0].x;
                      const chartRight = chartLeft + xAxisMap[0].width;
                      if (typeof yPos !== 'number' || isNaN(yPos)) return null;
                      const avgText = `Daily Avg: ${formatCurrency(Math.round(averageDaily))}`;
                      const padX = 8;
                      const padY = 4;
                      const fontSize = 12;
                      const gap = 4;
                      return (
                        <g style={{ pointerEvents: hideNumbers ? 'auto' : 'none', cursor: hideNumbers ? 'pointer' : 'default' }} onClick={hideNumbers ? requestUnhide : undefined}>
                          {hideNumbers && <title>Click to reveal</title>}
                          <line x1={chartLeft} y1={yPos} x2={chartRight} y2={yPos} stroke="rgb(202 138 4)" strokeOpacity={0.5} strokeDasharray="4 4" strokeWidth={1} />
                          <foreignObject x={chartLeft} y={yPos - 12} width={200} height={24} style={{ overflow: 'visible' }}>
                            <div style={{
                              fontSize: 12, fontWeight: 500,
                              color: 'rgb(254 240 138)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)',
                              background: 'linear-gradient(to right, rgb(133 77 14 / 0.5), rgb(180 83 9 / 0.3), rgb(133 77 14 / 0.5))',
                              border: '1px solid rgb(202 138 4 / 0.6)',
                              borderRadius: 9999,
                              padding: '2px 8px',
                              whiteSpace: 'nowrap' as const,
                              width: 'fit-content',
                              filter: hideNumbers ? 'blur(8px)' : 'none',
                            }}>
                              {avgText}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    }} />
                  )}
                  {/* Weekly average reference line - only for weekly views */}
                  {showWeeklyChart && averageWeekly > 0 && (
                    <Customized component={(props: any) => {
                      const { yAxisMap, xAxisMap } = props;
                      if (!yAxisMap?.[0]?.scale || !xAxisMap?.[0]) return null;
                      const yPos = yAxisMap[0].scale(averageWeekly);
                      const chartLeft = xAxisMap[0].x;
                      const chartRight = chartLeft + xAxisMap[0].width;
                      if (typeof yPos !== 'number' || isNaN(yPos)) return null;
                      const avgText = `Weekly Avg: ${formatCurrency(Math.round(averageWeekly))}`;
                      const padX = 6;
                      const padY = 3;
                      const fontSize = 11;
                      const gap = 4;
                      return (
                        <g style={{ pointerEvents: hideNumbers ? 'auto' : 'none', cursor: hideNumbers ? 'pointer' : 'default' }} onClick={hideNumbers ? requestUnhide : undefined}>
                          {hideNumbers && <title>Click to reveal</title>}
                          <line x1={chartLeft} y1={yPos} x2={chartRight} y2={yPos} stroke="rgb(202 138 4)" strokeOpacity={0.5} strokeDasharray="4 4" strokeWidth={1} />
                          <foreignObject x={chartLeft} y={yPos - 11} width={200} height={22} style={{ overflow: 'visible' }}>
                            <div style={{
                              fontSize: 11, fontWeight: 500,
                              color: 'rgb(254 240 138)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)',
                              background: 'linear-gradient(to right, rgb(133 77 14 / 0.5), rgb(180 83 9 / 0.3), rgb(133 77 14 / 0.5))',
                              border: '1px solid rgb(202 138 4 / 0.6)',
                              borderRadius: 9999,
                              padding: '2px 8px',
                              whiteSpace: 'nowrap' as const,
                              width: 'fit-content',
                              filter: hideNumbers ? 'blur(8px)' : 'none',
                            }}>
                              {avgText}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    }} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Provider Breakdown Drill-Down (daily view only) */}
          {!showWeeklyChart && (
            <DayProviderBreakdownPanel
              day={selectedBarDay}
              open={selectedBarDay !== null}
              onOpenChange={(open) => { if (!open) setSelectedBarDay(null); }}
            />
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
                    {formatDate(days[0].date, 'EEEE, MMMM d')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view {days[0].appointmentCount} appointment{days[0].appointmentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {days[0].confirmedRevenue > 0 && (
                        <span className="text-primary">{formatCurrency(days[0].confirmedRevenue)} confirmed</span>
                      )}
                    </Badge>
                    {days[0].unconfirmedRevenue > 0 && (
                      <Badge variant="outline" className="text-xs opacity-60">
                        {formatCurrency(days[0].unconfirmedRevenue)} unconfirmed
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
                <BlurredAmount>{formatCurrency(peakWeek.revenue)}</BlurredAmount>
              </span>
            </div>
          )}
          {!showWeeklyChart && period !== 'tomorrow' && !isEomPeriod && peakDay && peakDay.revenue > 0 && (
            <div className="flex items-center justify-between p-2 bg-chart-2/10 rounded-lg text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-chart-2" />
                Busiest day: <span className="font-medium text-foreground">{formatDate(peakDay.date, 'EEEE')}</span>
              </span>
              <span className="font-display text-chart-2">
                <BlurredAmount>{formatCurrency(peakDay.revenue)}</BlurredAmount>
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
