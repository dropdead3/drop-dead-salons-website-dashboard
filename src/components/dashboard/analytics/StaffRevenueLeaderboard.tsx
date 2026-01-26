import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, TrendingUp, AlertTriangle, Trophy, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStaffRevenuePerformance, RevenueTimeRange, StaffRevenueData } from '@/hooks/useStaffRevenuePerformance';
import { usePerformanceThreshold } from '@/hooks/usePerformanceThreshold';
import { PerformanceThresholdSettings } from './PerformanceThresholdSettings';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { cn } from '@/lib/utils';

interface StaffRevenueLeaderboardProps {
  locationId?: string;
}

const TIME_RANGE_OPTIONS: { value: RevenueTimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '90days', label: '90 Days' },
  { value: '6months', label: '6 Months' },
  { value: '365days', label: '365 Days' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload as StaffRevenueData;
  
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
      <p className="font-medium mb-2">{data.name}</p>
      <div className="space-y-1 text-muted-foreground">
        <p>Total: <BlurredAmount className="text-foreground font-medium">{formatCurrency(data.totalRevenue)}</BlurredAmount></p>
        <p>Services: <BlurredAmount>{formatCurrency(data.serviceRevenue)}</BlurredAmount></p>
        <p>Products: <BlurredAmount>{formatCurrency(data.productRevenue)}</BlurredAmount></p>
        <p>Transactions: {data.transactionCount}</p>
        <p>Avg Ticket: <BlurredAmount>{formatCurrency(data.averageTicket)}</BlurredAmount></p>
      </div>
    </div>
  );
}

export function StaffRevenueLeaderboard({ locationId }: StaffRevenueLeaderboardProps) {
  const [timeRange, setTimeRange] = useState<RevenueTimeRange>('month');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { data, isLoading } = useStaffRevenuePerformance(timeRange, locationId);
  const { data: threshold } = usePerformanceThreshold();
  
  const chartData = data?.staff.slice(0, 15) || []; // Limit to top 15 for chart
  const chartHeight = Math.max(300, chartData.length * 45);
  
  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Staff Revenue Leaderboard</CardTitle>
              {data?.summary.belowThresholdCount && data.summary.belowThresholdCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {data.summary.belowThresholdCount} Below Target
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as RevenueTimeRange)}>
                <TabsList className="h-8">
                  {TIME_RANGE_OPTIONS.map(opt => (
                    <TabsTrigger key={opt.value} value={opt.value} className="text-xs px-2">
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Performance ranking by total revenue
            {threshold?.alertsEnabled && (
              <span className="ml-2">
                • Min target: <BlurredAmount>{formatCurrency(threshold.minimumRevenue)}</BlurredAmount> / {threshold.evaluationPeriodDays} days
              </span>
            )}
          </p>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          ) : data?.staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">No revenue data available</p>
              <p className="text-sm">Try selecting a different time range or location</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <BlurredAmount className="text-lg font-medium">
                    {formatCurrency(data?.summary.totalRevenue || 0)}
                  </BlurredAmount>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Avg per Staff</p>
                  <BlurredAmount className="text-lg font-medium">
                    {formatCurrency(data?.summary.avgPerStaff || 0)}
                  </BlurredAmount>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-chart-1" /> Top Performer
                  </p>
                  <p className="text-lg font-medium truncate">
                    {data?.summary.topPerformer?.name || 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Staff Count</p>
                  <p className="text-lg font-medium">{data?.summary.staffCount || 0}</p>
                </div>
              </div>
              
              {/* Horizontal Bar Chart */}
              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      tick={({ x, y, payload }) => {
                        const staff = chartData.find(s => s.name === payload.value);
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-8}
                              y={0}
                              dy={4}
                              textAnchor="end"
                              className={cn(
                                "text-xs fill-current",
                                staff?.isBelowThreshold && "fill-destructive"
                              )}
                            >
                              {payload.value.length > 15 ? `${payload.value.slice(0, 15)}...` : payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isBelowThreshold 
                            ? 'hsl(var(--destructive))' 
                            : index === 0 
                              ? 'hsl(var(--chart-1))' 
                              : 'hsl(var(--primary))'
                          }
                          fillOpacity={entry.isBelowThreshold ? 0.8 : 1 - (index * 0.03)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Staff List with Details */}
              {data?.staff.some(s => s.isBelowThreshold) && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    Staff Below Performance Target
                  </h4>
                  <div className="space-y-2">
                    {data.staff.filter(s => s.isBelowThreshold).map(staff => (
                      <div 
                        key={staff.phorestStaffId}
                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={staff.photoUrl || undefined} alt={staff.name} />
                            <AvatarFallback className="text-xs bg-destructive/20 text-destructive">
                              {getInitials(staff.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{staff.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {staff.daysWithData} days of data
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <BlurredAmount className="font-medium text-destructive">
                            {formatCurrency(staff.totalRevenue)}
                          </BlurredAmount>
                          <p className="text-xs text-muted-foreground">
                            Avg: <BlurredAmount>{formatCurrency(staff.averageTicket)}</BlurredAmount>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <PerformanceThresholdSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </>
  );
}
