import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaffWorkload } from '@/hooks/useStaffUtilization';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StylistWorkloadCardProps {
  workload: StaffWorkload[];
  isLoading: boolean;
}

// Calculate workload balance (100 = perfectly even, 0 = very imbalanced)
const calculateWorkloadBalance = (workloadData: StaffWorkload[]): number => {
  const activeStaff = workloadData.filter(w => w.appointmentCount > 0);
  if (activeStaff.length < 2) return 100;

  const counts = activeStaff.map(w => w.appointmentCount);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

  if (avg === 0) return 100;

  // Calculate coefficient of variation (lower = more balanced)
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avg;

  // Convert to 0-100 score (lower CV = higher score)
  return Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));
};

const getBalanceColor = (score: number): string => {
  if (score >= 70) return 'text-chart-2';
  if (score >= 40) return 'text-chart-4';
  return 'text-destructive';
};

const getBalanceBorderColor = (score: number): string => {
  if (score >= 70) return 'border-chart-2';
  if (score >= 40) return 'border-chart-4';
  return 'border-destructive';
};

const getBalanceLabel = (score: number): string => {
  if (score >= 70) return 'Well distributed';
  if (score >= 40) return 'Slightly imbalanced';
  return 'Needs attention';
};

const getBalanceIcon = (score: number) => {
  if (score >= 70) return <TrendingUp className="h-4 w-4 text-chart-2" />;
  if (score >= 40) return <Minus className="h-4 w-4 text-chart-4" />;
  return <TrendingDown className="h-4 w-4 text-destructive" />;
};

export function StylistWorkloadCard({ workload, isLoading }: StylistWorkloadCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Stylist Workload Distribution
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32 md:col-span-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeWorkload = workload.filter(w => w.appointmentCount > 0);
  
  if (activeWorkload.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Stylist Workload Distribution
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/admin/staff-utilization')}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              View Full Report
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No appointment data available for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balanceScore = calculateWorkloadBalance(workload);
  const topStylists = activeWorkload.slice(0, 5);
  const totalAppointments = activeWorkload.reduce((sum, w) => sum + w.appointmentCount, 0);
  const avgPerStylist = activeWorkload.length > 0 ? Math.round(totalAppointments / activeWorkload.length) : 0;
  const highestWorkload = activeWorkload[0] || { displayName: 'N/A', name: 'N/A', appointmentCount: 0 };
  const lowestWorkload = activeWorkload[activeWorkload.length - 1] || { displayName: 'N/A', name: 'N/A', appointmentCount: 0 };
  const maxCount = highestWorkload.appointmentCount;

  // Prepare chart data
  const chartData = topStylists.map(s => ({
    name: s.displayName || s.name.split(' ')[0],
    fullName: s.displayName || s.name,
    appointments: s.appointmentCount,
    percentage: maxCount > 0 ? (s.appointmentCount / maxCount) * 100 : 0,
  }));

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Stylist Workload Distribution
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/admin/staff-utilization')}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            View Full Report
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Workload Balance Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative inline-flex items-center justify-center">
              <div
                className={cn(
                  'w-24 h-24 rounded-full border-8 flex items-center justify-center bg-background',
                  getBalanceBorderColor(balanceScore)
                )}
              >
                <span className={cn('font-display text-2xl', getBalanceColor(balanceScore))}>
                  {balanceScore}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {getBalanceIcon(balanceScore)}
              <p className="text-sm font-medium">{getBalanceLabel(balanceScore)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Workload Balance</p>
          </div>

          {/* Mini Bar Chart - Top 5 */}
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground mb-2">Top 5 by Appointments</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} appointments`, 'Count']}
                  labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="appointments" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.6)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="font-display text-lg text-chart-2 truncate">
              {highestWorkload.displayName || highestWorkload.name.split(' ')[0]}
            </p>
            <p className="text-xs text-muted-foreground">
              Highest: {highestWorkload.appointmentCount} appts
            </p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg">{avgPerStylist}</p>
            <p className="text-xs text-muted-foreground">Team Average</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-chart-4 truncate">
              {lowestWorkload.displayName || lowestWorkload.name.split(' ')[0]}
            </p>
            <p className="text-xs text-muted-foreground">
              Lowest: {lowestWorkload.appointmentCount} appts
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
