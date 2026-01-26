import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  TrendingUp, 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyVolume, StatusBreakdown, RetentionMetrics } from '@/hooks/useOperationalAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import type { CapacityData } from '@/hooks/useHistoricalCapacityUtilization';

interface OverviewContentProps {
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    noShowCount: number;
    cancelledCount: number;
    noShowRate: number;
    cancellationRate: number;
  };
  retention?: RetentionMetrics;
  dailyVolume: DailyVolume[];
  statusBreakdown: StatusBreakdown[];
  isLoading: boolean;
  onNavigateToTab: (tab: string) => void;
  capacityData?: CapacityData | null;
  capacityLoading?: boolean;
}

export function OverviewContent({ 
  summary, 
  retention, 
  dailyVolume,
  statusBreakdown,
  isLoading,
  onNavigateToTab,
  capacityData,
  capacityLoading 
}: OverviewContentProps) {
  // Calculate quick insights
  const peakDay = dailyVolume.reduce((max, d) => d.count > max.count ? d : max, { date: '', count: 0 });
  const completionRate = summary.totalAppointments > 0 
    ? (summary.completedAppointments / summary.totalAppointments * 100).toFixed(1)
    : '0';

  return (
    <>
      {/* Key Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-2xl">{summary.totalAppointments}</p>
              <p className="text-xs text-muted-foreground">Total Appointments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-display text-2xl">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className={cn(
                "font-display text-2xl",
                summary.noShowRate > 5 && "text-red-600"
              )}>
                {summary.noShowRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">No-Show Rate</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-display text-2xl">
                {retention?.retentionRate.toFixed(0) || 0}%
              </p>
              <p className="text-xs text-muted-foreground">Retention Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Insights Section */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {isLoading || capacityLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Peak Activity Day</p>
                  <p className="font-display text-lg">
                    {peakDay.date ? new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'NA'}
                  </p>
                  <p className="text-sm text-muted-foreground">{peakDay.count} appointments</p>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </Card>
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client Base</p>
                  <p className="font-display text-lg">
                    {retention?.totalClients.toLocaleString() || 'NA'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {retention?.newClients || 0} new this period
                  </p>
                </div>
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">At-Risk Clients</p>
                  <p className={cn(
                    "font-display text-lg",
                    (retention?.atRiskClients || 0) > 10 && "text-amber-600"
                  )}>
                    {retention?.atRiskClients || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Need follow-up</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </Card>
            <Card 
              className="p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNavigateToTab('appointments')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Capacity Utilization</p>
                  <p className={cn(
                    "font-display text-lg",
                    capacityData && capacityData.overallUtilization < 50 && "text-amber-600",
                    capacityData && capacityData.overallUtilization >= 70 && "text-green-600"
                  )}>
                    {capacityData ? `${capacityData.overallUtilization.toFixed(0)}%` : 'NA'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {capacityData ? `${capacityData.gapHours.toFixed(0)}h unused` : 'View details'}
                  </p>
                </div>
                <Gauge className={cn(
                  "w-5 h-5",
                  capacityData && capacityData.overallUtilization < 50 && "text-amber-600",
                  capacityData && capacityData.overallUtilization >= 50 && capacityData.overallUtilization < 70 && "text-amber-500",
                  capacityData && capacityData.overallUtilization >= 70 && "text-green-600",
                  !capacityData && "text-muted-foreground"
                )} />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Navigation Cards to Detailed Tabs */}
      <h2 className="font-display text-xl mb-4">EXPLORE DETAILS</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="p-5 cursor-pointer hover:bg-muted/30 transition-colors group"
          onClick={() => onNavigateToTab('appointments')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-medium mb-1">Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Volume trends, status breakdown, peak hours
          </p>
        </Card>

        <Card 
          className="p-5 cursor-pointer hover:bg-muted/30 transition-colors group"
          onClick={() => onNavigateToTab('clients')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-medium mb-1">Clients</h3>
          <p className="text-sm text-muted-foreground">
            Retention metrics, at-risk clients
          </p>
        </Card>

        <Card 
          className="p-5 cursor-pointer hover:bg-muted/30 transition-colors group"
          onClick={() => onNavigateToTab('staffing')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-medium mb-1">Staffing</h3>
          <p className="text-sm text-muted-foreground">
            Hiring capacity, staffing trends
          </p>
        </Card>

        <Card 
          className="p-5 cursor-pointer hover:bg-muted/30 transition-colors group"
          onClick={() => onNavigateToTab('staff-utilization')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-medium mb-1">Staff Utilization</h3>
          <p className="text-sm text-muted-foreground">
            Workload distribution, qualifications
          </p>
        </Card>
      </div>
    </>
  );
}
