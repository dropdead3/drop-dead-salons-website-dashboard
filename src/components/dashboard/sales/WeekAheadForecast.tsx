import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useWeekAheadRevenue, DayForecast } from '@/hooks/useWeekAheadRevenue';
import { LocationSelect } from '@/components/ui/location-select';
import { DayAppointmentsSheet } from './DayAppointmentsSheet';
import { CalendarRange, TrendingUp, Calendar, Users } from 'lucide-react';
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
      ${value.toLocaleString()}
    </text>
  );
}

// Custom X-axis tick to show day name and appointments under each bar
function CustomXAxisTick({ x, y, payload, days, peakDate, onDayClick }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const day = days.find((d: DayForecast) => d.dayName === payload.value);
  if (!day) return null;
  
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
          className="fill-foreground text-[11px]"
          style={{ fontWeight: 500 }}
        >
          {day.dayName}
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

export function WeekAheadForecast() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, error } = useWeekAheadRevenue(selectedLocation);

  const handleDayClick = (day: DayForecast) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

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
          Unable to load week ahead forecast
        </CardContent>
      </Card>
    );
  }

  const { days, totalRevenue, totalAppointments, averageDaily, peakDay } = data;

  // Chart data with confirmed/unconfirmed split
  const chartData = days.map(day => ({
    name: day.dayName,
    confirmedRevenue: day.confirmedRevenue,
    unconfirmedRevenue: day.unconfirmedRevenue,
    totalRevenue: day.revenue,
    appointments: day.appointmentCount,
    isPeak: peakDay?.date === day.date,
  }));

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-base">Week Ahead</CardTitle>
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
          <CardDescription>Projected revenue from scheduled appointments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <AnimatedBlurredAmount 
                value={totalRevenue}
                prefix="$"
                className="text-lg font-display tabular-nums"
              />
              <p className="text-xs text-muted-foreground">7-Day Total</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-center mb-1">
                <Calendar className="w-4 h-4 text-chart-2" />
              </div>
              <AnimatedBlurredAmount 
                value={Math.round(averageDaily)}
                prefix="$"
                className="text-lg font-display tabular-nums"
              />
              <p className="text-xs text-muted-foreground">Daily Avg</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-center mb-1">
                <Users className="w-4 h-4 text-chart-3" />
              </div>
              <span className="text-lg font-display tabular-nums">{totalAppointments}</span>
              <p className="text-xs text-muted-foreground">Appointments</p>
            </div>
          </div>

          {/* Bar Chart with stacked confirmed/unconfirmed and labels above */}
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 25, right: 5, bottom: 35, left: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={<CustomXAxisTick days={days} peakDate={peakDay?.date} onDayClick={handleDayClick} />}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={40}
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
                    const day = days.find(d => d.dayName === label);
                    return day ? format(parseISO(day.date), 'EEEE, MMM d') : label;
                  }}
                />
                {/* Unconfirmed revenue - bottom of stack, lighter opacity */}
                <Bar 
                  dataKey="unconfirmedRevenue" 
                  stackId="revenue"
                  radius={[0, 0, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`unconfirmed-${index}`}
                      fill={entry.isPeak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
                      fillOpacity={0.3}
                    />
                  ))}
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
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`confirmed-${index}`}
                      fill={entry.isPeak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
                      fillOpacity={entry.isPeak ? 1 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Day Callout */}
          {peakDay && peakDay.revenue > 0 && (
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
