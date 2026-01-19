import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  User,
} from 'lucide-react';
import {
  StaffStrikeWithDetails,
  STRIKE_TYPE_LABELS,
  STRIKE_TYPE_COLORS,
  StrikeType,
} from '@/hooks/useStaffStrikes';
import { cn } from '@/lib/utils';
import { subMonths, isAfter, format, startOfMonth } from 'date-fns';

interface StrikeStatisticsCardProps {
  strikes: StaffStrikeWithDetails[];
}

interface EmployeeStats {
  userId: string;
  name: string;
  photo: string | null | undefined;
  totalStrikes: number;
  activeStrikes: number;
  resolvedStrikes: number;
  criticalCount: number;
  recentStrikes: number; // Last 30 days
  typeBreakdown: Record<string, number>;
  monthlyTrend: number[]; // Last 6 months
}

export function StrikeStatisticsCard({ strikes }: StrikeStatisticsCardProps) {
  const employeeStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subMonths(now, 1);
    const sixMonthsAgo = subMonths(now, 6);

    // Group by employee
    const statsMap = new Map<string, EmployeeStats>();

    strikes.forEach((strike) => {
      if (!statsMap.has(strike.user_id)) {
        statsMap.set(strike.user_id, {
          userId: strike.user_id,
          name: strike.employee_name || 'Unknown',
          photo: strike.employee_photo,
          totalStrikes: 0,
          activeStrikes: 0,
          resolvedStrikes: 0,
          criticalCount: 0,
          recentStrikes: 0,
          typeBreakdown: {},
          monthlyTrend: [0, 0, 0, 0, 0, 0],
        });
      }

      const stat = statsMap.get(strike.user_id)!;
      stat.totalStrikes++;

      if (strike.is_resolved) {
        stat.resolvedStrikes++;
      } else {
        stat.activeStrikes++;
      }

      if (strike.severity === 'critical') {
        stat.criticalCount++;
      }

      const strikeDate = new Date(strike.incident_date);
      if (isAfter(strikeDate, thirtyDaysAgo)) {
        stat.recentStrikes++;
      }

      // Type breakdown
      const type = strike.strike_type;
      stat.typeBreakdown[type] = (stat.typeBreakdown[type] || 0) + 1;

      // Monthly trend (last 6 months)
      if (isAfter(strikeDate, sixMonthsAgo)) {
        for (let i = 0; i < 6; i++) {
          const monthStart = startOfMonth(subMonths(now, 5 - i));
          const monthEnd = startOfMonth(subMonths(now, 4 - i));
          if (isAfter(strikeDate, monthStart) && (i === 5 || !isAfter(strikeDate, monthEnd))) {
            stat.monthlyTrend[i]++;
            break;
          }
        }
      }
    });

    // Sort by active strikes (descending), then total
    return Array.from(statsMap.values()).sort(
      (a, b) => b.activeStrikes - a.activeStrikes || b.totalStrikes - a.totalStrikes
    );
  }, [strikes]);

  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    strikes.forEach((strike) => {
      distribution[strike.strike_type] = (distribution[strike.strike_type] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [strikes]);

  const monthLabels = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) =>
      format(subMonths(now, 5 - i), 'MMM')
    );
  }, []);

  if (employeeStats.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...employeeStats.map((s) => s.totalStrikes), 1);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Strike Patterns by Employee
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Employee breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Employee Overview</h4>
            {employeeStats.slice(0, 5).map((stat) => {
              const trend = stat.monthlyTrend[5] - stat.monthlyTrend[4];
              return (
                <div key={stat.userId} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={stat.photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {stat.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{stat.name}</span>
                        <div className="flex items-center gap-2">
                          {stat.criticalCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {stat.criticalCount}
                            </Badge>
                          )}
                          <span className="text-sm font-medium">
                            {stat.activeStrikes} active
                          </span>
                          {trend !== 0 && (
                            <span
                              className={cn(
                                'flex items-center text-xs',
                                trend > 0 ? 'text-destructive' : 'text-green-600'
                              )}
                            >
                              {trend > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-0.5" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                              )}
                              {Math.abs(trend)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={(stat.totalStrikes / maxTotal) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {stat.totalStrikes} total
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Type breakdown pills */}
                  <div className="flex flex-wrap gap-1 ml-11">
                    {Object.entries(stat.typeBreakdown).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={cn('text-xs', STRIKE_TYPE_COLORS[type as StrikeType])}
                      >
                        {STRIKE_TYPE_LABELS[type as StrikeType]}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
            {employeeStats.length > 5 && (
              <p className="text-xs text-muted-foreground ml-11">
                +{employeeStats.length - 5} more employees with strikes
              </p>
            )}
          </div>

          {/* Right column: Type distribution + Monthly trend */}
          <div className="space-y-6">
            {/* Type distribution */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Strike Types Distribution
              </h4>
              <div className="space-y-2">
                {typeDistribution.map(({ type, count }) => {
                  const percentage = Math.round((count / strikes.length) * 100);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn('text-xs w-28 justify-center', STRIKE_TYPE_COLORS[type as StrikeType])}
                      >
                        {STRIKE_TYPE_LABELS[type as StrikeType]}
                      </Badge>
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly trend chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                6-Month Trend (All Employees)
              </h4>
              <div className="flex items-end gap-2 h-24">
                {monthLabels.map((month, i) => {
                  const monthTotal = employeeStats.reduce(
                    (sum, stat) => sum + stat.monthlyTrend[i],
                    0
                  );
                  const maxMonthly = Math.max(
                    ...monthLabels.map((_, j) =>
                      employeeStats.reduce((sum, stat) => sum + stat.monthlyTrend[j], 0)
                    ),
                    1
                  );
                  const height = (monthTotal / maxMonthly) * 100;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">{monthTotal}</span>
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
