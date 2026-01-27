import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Loader2,
  Users,
  Trophy,
  Flame,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { format, subDays, startOfWeek, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClientEngineOverview } from '@/components/dashboard/ClientEngineOverview';
import type { AnalyticsFilters } from '@/pages/dashboard/admin/AnalyticsHub';

interface EnrollmentData {
  id: string;
  user_id: string;
  current_day: number;
  streak_count: number;
  status: string;
  start_date: string;
  restart_count: number;
  completed_at: string | null;
}

interface CompletionData {
  enrollment_id: string;
  day_number: number;
  is_complete: boolean;
  completion_date: string;
}

const FUNNEL_STAGES = [
  { day: 1, label: 'Day 1' },
  { day: 7, label: 'Week 1' },
  { day: 14, label: 'Week 2' },
  { day: 21, label: 'Week 3' },
  { day: 30, label: 'Month 1' },
  { day: 45, label: 'Halfway' },
  { day: 60, label: 'Week 9' },
  { day: 75, label: 'Complete' },
];

interface ProgramTabContentProps {
  filters: AnalyticsFilters;
}

export function ProgramTabContent({ filters }: ProgramTabContentProps) {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('funnel');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollmentsRes, completionsRes] = await Promise.all([
        supabase.from('stylist_program_enrollment').select('*'),
        supabase.from('daily_completions').select('enrollment_id, day_number, is_complete, completion_date').eq('is_complete', true),
      ]);

      if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data as EnrollmentData[]);
      if (completionsRes.data) setCompletions(completionsRes.data as CompletionData[]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  // Map date range to days
  const getDays = () => {
    switch (filters.dateRange) {
      case 'today': return 1;
      case 'yesterday': return 1;
      case '7d':
      case 'thisWeek': return 7;
      case '30d':
      case 'thisMonth':
      case 'lastMonth': return 30;
      case '90d': return 90;
      default: return 365;
    }
  };

  // Calculate funnel data
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map(stage => {
      const reached = enrollments.filter(e => e.current_day >= stage.day || e.status === 'completed').length;
      const percentage = enrollments.length > 0 ? Math.round((reached / enrollments.length) * 100) : 0;
      return {
        ...stage,
        reached,
        percentage,
        total: enrollments.length,
      };
    });
  }, [enrollments]);

  // Calculate drop-off points
  const dropOffData = useMemo(() => {
    const dayGroups: Record<number, number> = {};
    
    enrollments.forEach(e => {
      if (e.status !== 'completed' && e.status !== 'active') {
        const day = e.current_day;
        dayGroups[day] = (dayGroups[day] || 0) + 1;
      }
    });

    return Object.entries(dayGroups)
      .map(([day, count]) => ({ day: parseInt(day), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [enrollments]);

  // Cohort analysis by start week
  const cohortData = useMemo(() => {
    const cohorts: Record<string, EnrollmentData[]> = {};
    
    enrollments.forEach(e => {
      const weekStart = format(startOfWeek(new Date(e.start_date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (!cohorts[weekStart]) cohorts[weekStart] = [];
      cohorts[weekStart].push(e);
    });

    return Object.entries(cohorts)
      .map(([weekStart, members]) => ({
        weekStart,
        weekLabel: format(new Date(weekStart), 'MMM d'),
        count: members.length,
        active: members.filter(m => m.status === 'active').length,
        completed: members.filter(m => m.status === 'completed').length,
        avgProgress: Math.round(members.reduce((sum, m) => sum + (m.current_day / 75) * 100, 0) / members.length),
      }))
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
      .slice(-12);
  }, [enrollments]);

  // Daily completion trend
  const completionTrend = useMemo(() => {
    const days = getDays();
    const trendData: { date: string; completions: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const count = completions.filter(c => c.completion_date?.split('T')[0] === date).length;
      trendData.push({ date: format(new Date(date), 'MMM d'), completions: count });
    }

    return trendData;
  }, [completions, filters.dateRange]);

  // Summary stats
  const stats = useMemo(() => {
    const total = enrollments.length;
    const active = enrollments.filter(e => e.status === 'active').length;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const avgStreak = total > 0 ? Math.round(enrollments.reduce((sum, e) => sum + e.streak_count, 0) / total) : 0;
    const avgProgress = total > 0 ? Math.round(enrollments.reduce((sum, e) => sum + (e.current_day / 75) * 100, 0) / total) : 0;
    const totalRestarts = enrollments.reduce((sum, e) => sum + e.restart_count, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // At-risk count (no activity in 2+ days)
    const atRisk = enrollments.filter(e => {
      if (e.status !== 'active') return false;
      const lastActivity = e.start_date;
      const daysSince = differenceInDays(new Date(), new Date(lastActivity));
      return daysSince > 2;
    }).length;

    return { total, active, completed, avgStreak, avgProgress, totalRestarts, completionRate, atRisk };
  }, [enrollments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Client Engine Overview Card */}
      <ClientEngineOverview />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.avgStreak}</p>
                <p className="text-xs text-muted-foreground">Avg Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                stats.atRisk > 0 ? "bg-destructive/10" : "bg-muted"
              )}>
                <AlertTriangle className={cn("w-5 h-5", stats.atRisk > 0 ? "text-destructive" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.atRisk}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="funnel">Completion Funnel</TabsTrigger>
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="dropoff">Drop-off Points</TabsTrigger>
        </TabsList>

        {/* Completion Funnel */}
        <TabsContent value="funnel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Progress Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, index) => (
                  <div key={stage.day} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-muted-foreground">
                        {stage.reached} / {stage.total} ({stage.percentage}%)
                      </span>
                    </div>
                    <Progress value={stage.percentage} className="h-3" />
                    {index < funnelData.length - 1 && (
                      <div className="flex justify-end">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            funnelData[index + 1].percentage < stage.percentage * 0.7
                              ? "text-destructive border-destructive/30"
                              : "text-muted-foreground"
                          )}
                        >
                          {stage.percentage > 0 
                            ? `-${stage.percentage - funnelData[index + 1].percentage}%`
                            : '0%'
                          }
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Trends */}
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Daily Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohorts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Cohort Performance by Start Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }} 
                    />
                    <Bar dataKey="active" name="Active" fill="hsl(var(--chart-2))" stackId="a" />
                    <Bar dataKey="completed" name="Completed" fill="hsl(var(--chart-1))" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cohort Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-display">Week</th>
                      <th className="text-right py-2">Enrolled</th>
                      <th className="text-right py-2">Active</th>
                      <th className="text-right py-2">Completed</th>
                      <th className="text-right py-2">Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map(cohort => (
                      <tr key={cohort.weekStart} className="border-b border-border/50">
                        <td className="py-2">{cohort.weekLabel}</td>
                        <td className="text-right py-2">{cohort.count}</td>
                        <td className="text-right py-2">{cohort.active}</td>
                        <td className="text-right py-2">{cohort.completed}</td>
                        <td className="text-right py-2">
                          <div className="flex items-center justify-end gap-2">
                            <span>{cohort.avgProgress}%</span>
                            <Progress value={cohort.avgProgress} className="w-16 h-2" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drop-off Points */}
        <TabsContent value="dropoff" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Common Drop-off Points</CardTitle>
            </CardHeader>
            <CardContent>
              {dropOffData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No drop-off data available</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dropOffData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `Day ${value}`}
                        width={60}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} participants`, 'Dropped off']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--destructive))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
