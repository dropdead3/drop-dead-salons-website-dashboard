import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  LayoutDashboard,
  Target,
  DollarSign,
  Scissors,
  ShoppingBag,
  CreditCard,
  Receipt,
  CalendarCheck,
  Trophy,
  PieChart as PieChartIcon,
  Loader2,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { useSalesMetrics, useSalesByStylist } from '@/hooks/useSalesData';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useLocations } from '@/hooks/useLocations';

export type DateRangeType = 'today' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';

interface SalesBentoCardProps {
  locationId?: string;
  dateRange?: DateRangeType;
  dateFrom?: string;
  dateTo?: string;
}

// KPI Cell component for consistent styling
function KPICell({ 
  icon: Icon, 
  value, 
  label, 
  prefix = '', 
  subtitle,
  tooltip,
  iconColor = 'text-primary'
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  prefix?: string;
  subtitle?: string;
  tooltip?: string;
  iconColor?: string;
}) {
  return (
    <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
      <div className="flex justify-center mb-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
      </div>
      <AnimatedBlurredAmount 
        value={value}
        prefix={prefix}
        className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
      />
      <div className="flex items-center gap-1 justify-center mt-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {tooltip && <MetricInfoTooltip description={tooltip} />}
      </div>
      {subtitle && (
        <span className="text-xs text-muted-foreground/70">{subtitle}</span>
      )}
    </div>
  );
}

// Helper to compute date range - exported for reuse
export function getDateRange(range: DateRangeType): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  
  switch (range) {
    case 'today':
      return { dateFrom: today, dateTo: today };
    case '7d':
      return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: today };
    case '30d':
      return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: today };
    case 'thisWeek':
      return { 
        dateFrom: format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'), 
        dateTo: format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd') 
      };
    case 'thisMonth':
      return { 
        dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'), 
        dateTo: format(endOfMonth(now), 'yyyy-MM-dd') 
      };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { 
        dateFrom: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), 
        dateTo: format(endOfMonth(lastMonth), 'yyyy-MM-dd') 
      };
    default:
      return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: today };
  }
}

export function SalesBentoCard({
  locationId = 'all',
  dateRange = 'thisMonth',
  dateFrom,
  dateTo,
}: SalesBentoCardProps) {
  // Compute date filters - use explicit dates if provided, otherwise calculate from dateRange
  const dateFilters = useMemo(() => {
    if (dateFrom && dateTo) {
      return { dateFrom, dateTo };
    }
    return getDateRange(dateRange);
  }, [dateFrom, dateTo, dateRange]);
  
  const locationFilter = locationId !== 'all' ? locationId : undefined;

  // Fetch data based on props
  const { data: locations } = useLocations();
  const { goals } = useSalesGoals();
  
  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics({
    dateFrom: dateFilters.dateFrom,
    dateTo: dateFilters.dateTo,
    locationId: locationFilter,
  });

  const { data: stylistData, isLoading: stylistLoading } = useSalesByStylist(
    dateFilters.dateFrom,
    dateFilters.dateTo
  );

  const isLoading = metricsLoading || stylistLoading;

  // Compute goal based on filters
  const currentGoal = useMemo(() => {
    const isMonthly = dateRange === 'thisMonth' || dateRange === '30d' || dateRange === 'lastMonth';
    if (locationId !== 'all' && goals?.locationTargets?.[locationId]) {
      return isMonthly 
        ? goals.locationTargets[locationId].monthly 
        : goals.locationTargets[locationId].weekly;
    }
    return isMonthly ? (goals?.monthlyTarget || 50000) : (goals?.weeklyTarget || 12500);
  }, [dateRange, locationId, goals]);

  const goalLabel = useMemo(() => {
    const isMonthly = dateRange === 'thisMonth' || dateRange === '30d' || dateRange === 'lastMonth';
    if (locationId !== 'all') {
      const loc = locations?.find(l => l.id === locationId);
      return `${loc?.name || 'Location'} Goal`;
    }
    return isMonthly ? 'Monthly Goal' : 'Weekly Goal';
  }, [dateRange, locationId, locations]);

  // Derived values
  const totalRevenue = metrics?.totalRevenue || 0;
  const serviceRevenue = metrics?.serviceRevenue || 0;
  const productRevenue = metrics?.productRevenue || 0;
  const totalTransactions = metrics?.totalTransactions || 0;
  const averageTicket = metrics?.averageTicket || 0;
  const performers = stylistData || [];

  const percentage = useMemo(() => {
    if (!currentGoal || currentGoal === 0) return 0;
    return Math.min(Math.round((totalRevenue / currentGoal) * 100), 100);
  }, [totalRevenue, currentGoal]);

  const remaining = useMemo(() => {
    return Math.max(currentGoal - totalRevenue, 0);
  }, [totalRevenue, currentGoal]);

  const totalMixRevenue = serviceRevenue + productRevenue;
  const retailPercentage = totalMixRevenue > 0 
    ? Math.round((productRevenue / totalMixRevenue) * 100) 
    : 0;

  const donutData = useMemo(() => [
    { name: 'Services', value: serviceRevenue, color: 'hsl(var(--primary))' },
    { name: 'Products', value: productRevenue, color: 'hsl(var(--chart-2))' },
  ], [serviceRevenue, productRevenue]);

  const topPerformers = performers.slice(0, 3);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Sales Dashboard</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goal Progress Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium">{goalLabel}</span>
            </div>
            <span className="text-xs font-medium tabular-nums">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <BlurredAmount>${totalRevenue.toLocaleString()} earned</BlurredAmount>
            <BlurredAmount>${remaining.toLocaleString()} to go</BlurredAmount>
          </div>
        </div>
        
        <Separator />
        
        {/* Bento Grid: KPIs + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left: 3x2 KPI Grid */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPICell 
              icon={DollarSign} 
              value={totalRevenue} 
              label="Total Revenue" 
              prefix="$"
              tooltip="Sum of all service and product sales for the selected date range."
            />
            <KPICell 
              icon={CalendarCheck} 
              value={totalRevenue} 
              label="Expected Rev" 
              prefix="$"
              iconColor="text-chart-5"
              subtitle={`${totalTransactions} appointments`}
              tooltip="Revenue calculated from booked appointments in the selected date range. This reflects scheduled services, not completed sales."
            />
            <KPICell 
              icon={Scissors} 
              value={serviceRevenue} 
              label="Services" 
              prefix="$"
              tooltip="Revenue from all service transactions (cuts, color, treatments, etc.)."
            />
            <KPICell 
              icon={ShoppingBag} 
              value={productRevenue} 
              label="Products" 
              prefix="$"
              iconColor="text-chart-2"
              tooltip="Revenue from retail product sales only."
            />
            <KPICell 
              icon={CreditCard} 
              value={totalTransactions} 
              label="Transactions"
              iconColor="text-chart-3"
              tooltip="Total number of completed sales transactions."
            />
            <KPICell 
              icon={Receipt} 
              value={Math.round(averageTicket)} 
              label="Avg Ticket" 
              prefix="$"
              iconColor="text-chart-4"
              tooltip="Total Revenue ÷ Transactions. Average spend per client visit."
            />
          </div>
          
          {/* Right: Sidebar (Top Performers + Revenue Mix) */}
          <div className="space-y-4 lg:border-l lg:pl-4 lg:border-border/50">
            {/* Top Performers */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Trophy className="w-4 h-4 text-chart-4" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Top Performers
                </h4>
              </div>
              <div className="space-y-2">
                {topPerformers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No data</p>
                ) : (
                  topPerformers.map((performer, index) => (
                    <div key={performer.staffId} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-4">
                        {index + 1}.
                      </span>
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={performer.photoUrl} alt={performer.name} />
                        <AvatarFallback className="text-[10px]">
                          {performer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate flex-1">{performer.name.split(' ')[0]}</span>
                      <BlurredAmount className="text-xs font-medium tabular-nums">
                        ${performer.totalRevenue.toLocaleString()}
                      </BlurredAmount>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Revenue Mix Donut */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <PieChartIcon className="w-4 h-4 text-chart-2" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Revenue Mix
                </h4>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={28}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Services</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {totalMixRevenue > 0 ? Math.round((serviceRevenue / totalMixRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-chart-2" />
                      <span className="text-muted-foreground">Products</span>
                    </div>
                    <span className="font-medium tabular-nums">{retailPercentage}%</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Retail %</span>
                    <span className="font-medium tabular-nums">{retailPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
