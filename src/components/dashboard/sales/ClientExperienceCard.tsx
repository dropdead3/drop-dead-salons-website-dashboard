import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, TrendingUp, TrendingDown, Minus, ChevronDown, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Tabs, FilterTabsList, FilterTabsTrigger } from '@/components/ui/tabs';
import { tokens } from '@/lib/design-tokens';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useClientExperience, type ClientExperienceData } from '@/hooks/useClientExperience';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type ExperienceMetric = 'avgTip' | 'tipRate' | 'feedbackRate' | 'rebookRate';

interface ClientExperienceCardProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

const METRIC_CONFIG: Record<ExperienceMetric, {
  label: string;
  tabLabel: string;
  tooltip: string;
  isPercentage: boolean;
  isCurrency: boolean;
  dataKey: keyof Pick<ClientExperienceData['staffBreakdown'][number], 'avgTip' | 'tipRate' | 'feedbackRate' | 'rebookRate'>;
  sortKey: keyof Pick<ClientExperienceData['staffBreakdown'][number], 'avgTip' | 'tipRate' | 'feedbackRate' | 'rebookRate'>;
}> = {
  avgTip: {
    label: 'Avg Tip',
    tabLabel: 'Avg Tip',
    tooltip: 'Average tip amount per completed appointment across all staff.',
    isPercentage: false,
    isCurrency: true,
    dataKey: 'avgTip',
    sortKey: 'avgTip',
  },
  tipRate: {
    label: 'Tip Rate',
    tabLabel: 'Tip Rate',
    tooltip: 'Percentage of completed appointments that received any tip. Measures frequency of tipping.',
    isPercentage: true,
    isCurrency: false,
    dataKey: 'tipRate',
    sortKey: 'tipRate',
  },
  feedbackRate: {
    label: 'Feedback Rate',
    tabLabel: 'Feedback',
    tooltip: 'Percentage of appointments where a client feedback response was collected. Higher rates indicate better follow-up culture.',
    isPercentage: true,
    isCurrency: false,
    dataKey: 'feedbackRate',
    sortKey: 'feedbackRate',
  },
  rebookRate: {
    label: 'Rebook Rate',
    tabLabel: 'Rebook',
    tooltip: 'Percentage of completed appointments where the client rebooked at checkout.',
    isPercentage: true,
    isCurrency: false,
    dataKey: 'rebookRate',
    sortKey: 'rebookRate',
  },
};

function isHashedId(name: string): boolean {
  if (!name) return true;
  if (name.includes(' ')) return false;
  if (name.includes('_') || name.includes('-')) return true;
  if (name.length > 12) return true;
  return false;
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <div className={cn(
      'flex items-center gap-0.5 mt-0.5',
      tokens.kpi.change,
      value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-muted-foreground',
    )}>
      {value > 0 ? <TrendingUp className="w-3 h-3" /> : value < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
}

export function ClientExperienceCard({ dateFrom, dateTo, locationId, filterContext }: ClientExperienceCardProps) {
  const { data, isLoading } = useClientExperience(dateFrom, dateTo, locationId);
  const { formatCurrency } = useFormatCurrency();
  const [activeMetric, setActiveMetric] = useState<ExperienceMetric>('avgTip');
  const [showAll, setShowAll] = useState(false);
  const DEFAULT_BAR_COUNT = 5;

  const config = METRIC_CONFIG[activeMetric];

  // Loading
  if (isLoading) {
    return (
      <Card className={tokens.card.wrapper}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={tokens.card.iconBox}><Heart className={tokens.card.icon} /></div>
            <div>
              <CardTitle className={tokens.card.title}>CLIENT EXPERIENCE</CardTitle>
              <CardDescription>Tip, feedback & rebooking quality</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={tokens.kpi.tile}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20 mt-1" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.staffBreakdown.length === 0) {
    return (
      <Card className={tokens.card.wrapper}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={tokens.card.iconBox}><Heart className={tokens.card.icon} /></div>
              <div className="flex items-center gap-2">
                <CardTitle className={tokens.card.title}>CLIENT EXPERIENCE</CardTitle>
                <MetricInfoTooltip description="Measures client experience quality through tip behavior, feedback collection, and rebooking rates per stylist." />
              </div>
            </div>
            {filterContext && <AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />}
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Heart} title="No data available" description="No completed appointments found for the selected period." />
        </CardContent>
      </Card>
    );
  }

  // Format KPI values
  const formatValue = (metric: ExperienceMetric, val: number) => {
    const c = METRIC_CONFIG[metric];
    if (c.isCurrency) return formatCurrency(val);
    if (c.isPercentage) return `${Math.round(val)}%`;
    return val.toLocaleString();
  };

  // Chart data
  const allChartData = data.staffBreakdown
    .map((s, i) => ({
      name: isHashedId(s.staffName)
        ? `Stylist ${i + 1}`
        : s.staffName.length > 14 ? s.staffName.slice(0, 13) + '…' : s.staffName,
      value: s[config.dataKey],
      staffId: s.staffId,
    }))
    .sort((a, b) => b.value - a.value);

  const chartData = showAll ? allChartData : allChartData.slice(0, DEFAULT_BAR_COUNT);
  const hasMoreBars = allChartData.length > DEFAULT_BAR_COUNT;
  const chartHeight = Math.max(200, chartData.length * 36 + 20);

  const kpis: { metric: ExperienceMetric; label: string; value: string; change: number | null }[] = [
    { metric: 'avgTip', label: 'Avg Tip', value: formatValue('avgTip', data.avgTip.current), change: data.avgTip.percentChange },
    { metric: 'tipRate', label: 'Tip Rate', value: formatValue('tipRate', data.tipRate.current), change: data.tipRate.percentChange },
    { metric: 'feedbackRate', label: 'Feedback Rate', value: formatValue('feedbackRate', data.feedbackRate.current), change: data.feedbackRate.percentChange },
    { metric: 'rebookRate', label: 'Rebook Rate', value: formatValue('rebookRate', data.rebookRate.current), change: data.rebookRate.percentChange },
  ];

  return (
    <Card className={tokens.card.wrapper}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={tokens.card.iconBox}><Heart className={tokens.card.icon} /></div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={tokens.card.title}>CLIENT EXPERIENCE</CardTitle>
                <MetricInfoTooltip description="Measures client experience quality through tip behavior, feedback collection, and rebooking rates per stylist." />
              </div>
              <CardDescription>Tip, feedback & rebooking quality</CardDescription>
            </div>
          </div>
          {filterContext && <AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />}
        </div>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map(kpi => (
            <button
              key={kpi.metric}
              onClick={() => setActiveMetric(kpi.metric)}
              className={cn(
                tokens.kpi.tile,
                'text-left transition-colors cursor-pointer',
                activeMetric === kpi.metric
                  ? 'ring-1 ring-primary/40 bg-primary/5'
                  : 'hover:bg-muted/30',
              )}
            >
              <span className={tokens.kpi.label}>{kpi.label}</span>
              <span className={tokens.kpi.value}>{kpi.value}</span>
              <ChangeBadge value={kpi.change} />
            </button>
          ))}
        </div>

        {/* Metric selector (mobile-friendly tabs) */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className={tokens.heading.subsection}>{config.label} by Stylist</h3>
        </div>

        {/* Unmapped staff banner */}
        {!data.hasNames && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Staff names unavailable —{' '}
              <Link to="/dashboard/admin/settings/staff-mapping" className="text-primary hover:underline">
                connect staff profiles in Settings
              </Link>
            </p>
          </div>
        )}

        {/* Bar chart */}
        <svg width="0" height="0">
          <defs>
            <linearGradient id="experienceBarGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            </linearGradient>
          </defs>
        </svg>

        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 50, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              hide
              domain={config.isPercentage ? [0, 100] : undefined}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              fill="url(#experienceBarGradient)"
              stroke="hsl(var(--primary) / 0.3)"
              strokeWidth={1}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: number) => {
                  if (config.isCurrency) return formatCurrency(v);
                  if (config.isPercentage) return `${Math.round(v)}%`;
                  return v.toLocaleString();
                }}
                style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Show all toggle */}
        {hasMoreBars && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline mx-auto"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAll && 'rotate-180')} />
            {showAll ? 'Show less' : `Show all ${allChartData.length} stylists`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
