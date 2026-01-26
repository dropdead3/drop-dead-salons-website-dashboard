import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { Gauge, Clock, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DayCapacity {
  date: string;
  dayName: string;
  availableHours: number;
  bookedHours: number;
  utilizationPercent: number;
  appointmentCount: number;
  revenue: number;
}

interface ServiceMix {
  category: string;
  hours: number;
  revenue: number;
  count: number;
}

interface CapacityData {
  totalAvailableHours: number;
  totalBookedHours: number;
  overallUtilization: number;
  gapHours: number;
  gapRevenue: number;
  avgHourlyRevenue: number;
  dailyCapacity: DayCapacity[];
  serviceMix: ServiceMix[];
  totalAppointments: number;
}

interface CapacityUtilizationSectionProps {
  capacityData: CapacityData | null;
  isLoading: boolean;
  dateRange: 'week' | 'month' | '3months';
}

const SERVICE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--accent))',
];

function getUtilizationColor(percent: number): string {
  if (percent >= 70) return 'hsl(142 76% 36%)'; // green
  if (percent >= 50) return 'hsl(38 92% 50%)'; // amber
  return 'hsl(var(--destructive))'; // red
}

function getUtilizationBgClass(percent: number): string {
  if (percent >= 70) return 'bg-green-100 dark:bg-green-900/30';
  if (percent >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

function getUtilizationTextClass(percent: number): string {
  if (percent >= 70) return 'text-green-600';
  if (percent >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function CapacityUtilizationSection({ 
  capacityData, 
  isLoading,
  dateRange 
}: CapacityUtilizationSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-[200px]" />
          </div>
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
    overallUtilization, 
    gapHours, 
    gapRevenue, 
    totalBookedHours,
    dailyCapacity, 
    serviceMix,
    totalAppointments 
  } = capacityData;

  // Limit daily chart data for readability
  const chartData = dateRange === '3months' 
    ? dailyCapacity.filter((_, i) => i % 7 === 0) // Weekly for 3 months
    : dailyCapacity;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Capacity Utilization
          </CardTitle>
          <MetricInfoTooltip 
            description="Compares booked chair-hours against available capacity (Operating Hours × Stylist Count)"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Utilization Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Utilization</span>
            <span className={cn("font-semibold", getUtilizationTextClass(overallUtilization))}>
              {overallUtilization.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(overallUtilization, 100)} 
            className="h-3"
            indicatorClassName={cn(
              overallUtilization >= 70 && "bg-green-600",
              overallUtilization >= 50 && overallUtilization < 70 && "bg-amber-500",
              overallUtilization < 50 && "bg-red-500"
            )}
          />
          {overallUtilization < 50 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Below 50% utilization - opportunity to book more appointments</span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={cn("rounded-lg p-4", getUtilizationBgClass(overallUtilization))}>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className={cn("w-4 h-4", getUtilizationTextClass(overallUtilization))} />
              <span className="text-xs text-muted-foreground">Utilization</span>
            </div>
            <p className={cn("font-display text-xl", getUtilizationTextClass(overallUtilization))}>
              {overallUtilization.toFixed(0)}%
            </p>
          </div>
          
          <div className="rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Booked Hours</span>
            </div>
            <p className="font-display text-xl">{totalBookedHours.toFixed(0)}h</p>
          </div>
          
          <div className="rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Unused Hours</span>
            </div>
            <p className="font-display text-xl text-amber-600">{gapHours.toFixed(0)}h</p>
          </div>
          
          <div className="rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Gap Revenue</span>
            </div>
            <p className="font-display text-xl text-amber-600">
              <BlurredAmount>${gapRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</BlurredAmount>
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Utilization Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Utilization
            </h4>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      try {
                        return format(parseISO(date), dateRange === '3months' ? 'MMM d' : 'EEE');
                      } catch {
                        return date;
                      }
                    }}
                    tick={{ fontSize: 10 }}
                    interval={dateRange === 'month' ? 2 : 0}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    labelFormatter={(date) => {
                      try {
                        return format(parseISO(date as string), 'EEE, MMM d');
                      } catch {
                        return date;
                      }
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                  />
                  <Bar 
                    dataKey="utilizationPercent" 
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getUtilizationColor(entry.utilizationPercent)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No daily data available
              </div>
            )}
          </div>

          {/* Service Mix Pie Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Service Mix (by hours)</h4>
            {serviceMix.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={serviceMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="hours"
                    nameKey="category"
                  >
                    {serviceMix.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, _: string, props: any) => [
                      `${value.toFixed(1)}h (${props.payload.count} appts)`,
                      props.payload.category
                    ]}
                  />
                  <Legend 
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No service data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
