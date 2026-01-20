import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Target, Loader2, Crown, Medal, Award, Users, Repeat, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  display_name: string | null;
  current_day: number;
  streak_count: number;
  total_revenue: number;
  ring_count: number;
}

interface PhorestPerformer {
  id: string;
  name: string;
  photoUrl?: string;
  newClients: number;
  retentionRate: number;
  retailSales: number;
  extensionClients: number;
  // Hidden revenue used only for ranking
  _revenue: number;
}

type MetricType = 'day' | 'streak' | 'revenue' | 'bells';
type PhorestCategory = 'overall' | 'newClients' | 'retention' | 'retail' | 'extensions';

// Weight configuration for overall score algorithm
const SCORE_WEIGHTS = {
  newClients: 0.30,    // 30% - New client acquisition is key growth
  retention: 0.25,     // 25% - Client loyalty is critical
  retail: 0.20,        // 20% - Product sales add revenue
  extensions: 0.25,    // 25% - Specialty service focus
};

// Calculate normalized score (0-100) for each metric
const calculateOverallScore = (performer: PhorestPerformer, allPerformers: PhorestPerformer[]): number => {
  // Get max values for normalization
  const maxNewClients = Math.max(...allPerformers.map(p => p.newClients), 1);
  const maxRetention = 100; // Retention is already a percentage
  const maxRetail = Math.max(...allPerformers.map(p => p.retailSales), 1);
  const maxExtensions = Math.max(...allPerformers.map(p => p.extensionClients), 1);

  // Normalize each metric to 0-100 scale
  const normalizedNewClients = (performer.newClients / maxNewClients) * 100;
  const normalizedRetention = performer.retentionRate; // Already 0-100
  const normalizedRetail = (performer.retailSales / maxRetail) * 100;
  const normalizedExtensions = (performer.extensionClients / maxExtensions) * 100;

  // Calculate weighted score
  const weightedScore = 
    (normalizedNewClients * SCORE_WEIGHTS.newClients) +
    (normalizedRetention * SCORE_WEIGHTS.retention) +
    (normalizedRetail * SCORE_WEIGHTS.retail) +
    (normalizedExtensions * SCORE_WEIGHTS.extensions);

  return Math.round(weightedScore * 10) / 10; // Round to 1 decimal
};

// Mock data - will be replaced with Phorest API data
const mockPhorestData: PhorestPerformer[] = [
  { id: '1', name: 'Jessica Martinez', newClients: 12, retentionRate: 94, retailSales: 580, extensionClients: 8, _revenue: 4850 },
  { id: '2', name: 'Amanda Chen', newClients: 8, retentionRate: 91, retailSales: 420, extensionClients: 11, _revenue: 4320 },
  { id: '3', name: 'Sarah Johnson', newClients: 15, retentionRate: 88, retailSales: 350, extensionClients: 5, _revenue: 3980 },
  { id: '4', name: 'Taylor Williams', newClients: 6, retentionRate: 96, retailSales: 680, extensionClients: 9, _revenue: 3650 },
  { id: '5', name: 'Morgan Davis', newClients: 10, retentionRate: 85, retailSales: 290, extensionClients: 12, _revenue: 3200 },
  { id: '6', name: 'Ashley Brown', newClients: 7, retentionRate: 92, retailSales: 510, extensionClients: 6, _revenue: 2890 },
];

const categoryConfig: Record<PhorestCategory, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  getValue: (p: PhorestPerformer, allPerformers?: PhorestPerformer[]) => number;
  formatValue: (v: number) => string;
  description: string;
}> = {
  overall: {
    label: 'Overall Score',
    icon: Star,
    getValue: (p, allPerformers) => allPerformers ? calculateOverallScore(p, allPerformers) : 0,
    formatValue: (v) => `${v} pts`,
    description: 'Weighted composite score across all performance metrics',
  },
  newClients: {
    label: 'New Clients',
    icon: Users,
    getValue: (p) => p.newClients,
    formatValue: (v) => `${v} new`,
    description: 'Most new clients booked this week',
  },
  retention: {
    label: 'Retention',
    icon: Repeat,
    getValue: (p) => p.retentionRate,
    formatValue: (v) => `${v}%`,
    description: 'Highest client return rate',
  },
  retail: {
    label: 'Retail Sales',
    icon: ShoppingBag,
    getValue: (p) => p.retailSales,
    formatValue: (v) => `$${v}`,
    description: 'Top retail product sales',
  },
  extensions: {
    label: 'Extensions',
    icon: Sparkles,
    getValue: (p) => p.extensionClients,
    formatValue: (v) => `${v} clients`,
    description: 'Most extension clients served',
  },
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricType>('day');
  const [phorestData] = useState<PhorestPerformer[]>(mockPhorestData);
  const [phorestCategory, setPhorestCategory] = useState<PhorestCategory>('overall');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data: enrollments, error } = await supabase
      .from('stylist_program_enrollment')
      .select(`user_id, current_day, streak_count`)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
      return;
    }

    const userIds = enrollments?.map(e => e.user_id) || [];
    
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('employee_profiles')
      .select('user_id, full_name, display_name')
      .in('user_id', userIds);

    const { data: bellTotals } = await supabase
      .from('ring_the_bell_entries')
      .select('user_id, ticket_value')
      .in('user_id', userIds);

    const leaderboard: LeaderboardEntry[] = (enrollments || []).map(enrollment => {
      const profile = profiles?.find(p => p.user_id === enrollment.user_id);
      const userBells = bellTotals?.filter(b => b.user_id === enrollment.user_id) || [];
      const totalRevenue = userBells.reduce((sum, b) => sum + (b.ticket_value || 0), 0);

      return {
        user_id: enrollment.user_id,
        full_name: profile?.full_name || 'Unknown',
        display_name: profile?.display_name,
        current_day: enrollment.current_day,
        streak_count: enrollment.streak_count,
        total_revenue: totalRevenue,
        ring_count: userBells.length,
      };
    });

    setEntries(leaderboard);
    setLoading(false);
  };

  const sortedEntries = [...entries].sort((a, b) => {
    switch (metric) {
      case 'day': return b.current_day - a.current_day;
      case 'streak': return b.streak_count - a.streak_count;
      case 'revenue': return b.total_revenue - a.total_revenue;
      case 'bells': return b.ring_count - a.ring_count;
      default: return 0;
    }
  });

  const metrics: { key: MetricType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'day', label: 'Progress', icon: Target },
    { key: 'streak', label: 'Streak', icon: Flame },
    { key: 'bells', label: 'Bells', icon: Trophy },
  ];

  const getValue = (entry: LeaderboardEntry): string => {
    switch (metric) {
      case 'day': return `Day ${entry.current_day}`;
      case 'streak': return `${entry.streak_count} days`;
      case 'revenue': return `$${entry.total_revenue.toLocaleString()}`;
      case 'bells': return `${entry.ring_count} bells`;
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const currentConfig = categoryConfig[phorestCategory];
  const sortedPhorestData = [...phorestData].sort(
    (a, b) => currentConfig.getValue(b, phorestData) - currentConfig.getValue(a, phorestData)
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            LEADERBOARD
          </h1>
          <p className="text-muted-foreground font-sans">
            See who's crushing it this week.
          </p>
        </div>

        <Tabs defaultValue="phorest" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="phorest" className="font-display text-xs tracking-wide">
              <Trophy className="w-4 h-4 mr-2" />
              Weekly Rankings
            </TabsTrigger>
            <TabsTrigger value="program" className="font-display text-xs tracking-wide">
              <Target className="w-4 h-4 mr-2" />
              Program Progress
            </TabsTrigger>
          </TabsList>

          {/* Phorest Weekly Rankings Tab */}
          <TabsContent value="phorest" className="space-y-6">
            {/* Week Info Banner */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mb-1">
                    This Week
                  </p>
                  <p className="font-sans font-medium">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mb-1">
                    Category
                  </p>
                  <p className="font-display text-lg">{currentConfig.label}</p>
                </div>
              </div>
            </Card>

            {/* Category Selector */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryConfig) as PhorestCategory[]).map((key) => {
                const config = categoryConfig[key];
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    variant={phorestCategory === key ? 'default' : 'outline'}
                    onClick={() => setPhorestCategory(key)}
                    className="font-display text-xs tracking-wide"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Category Description */}
            <p className="text-sm text-muted-foreground font-sans">
              {currentConfig.description}
            </p>

            {/* Mock Data Notice */}
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
              <p className="text-xs text-muted-foreground font-sans text-center">
                📊 Showing sample data • Connect Phorest to see live rankings
              </p>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {sortedPhorestData.slice(0, 3).map((performer, index) => {
                const order = index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3';
                const height = index === 0 ? 'pt-0' : index === 1 ? 'pt-6' : 'pt-8';
                
                return (
                  <div key={performer.id} className={`${order} ${height}`}>
                    <Card className={`p-4 text-center ${index === 0 ? 'border-2 border-primary bg-primary/5' : ''}`}>
                      <div className="flex justify-center mb-2">
                        {getRankIcon(index)}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center font-display text-lg">
                        {performer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <p className="font-sans text-sm font-medium truncate mb-1">
                        {performer.name.split(' ')[0]}
                      </p>
                      <p className="font-display text-lg">
                        {currentConfig.formatValue(currentConfig.getValue(performer, phorestData))}
                      </p>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Full Leaderboard */}
            <div className="space-y-3">
              {sortedPhorestData.map((performer, index) => (
                <Card 
                  key={performer.id}
                  className={`p-4 ${index < 3 ? 'border-primary/30' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`
                      w-10 h-10 flex items-center justify-center font-display text-lg rounded
                      ${index === 0 ? 'bg-primary text-primary-foreground' : 
                        index === 1 ? 'bg-muted' : 
                        index === 2 ? 'bg-muted' : 'bg-muted/50'}
                    `}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-display text-sm">
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium truncate">{performer.name}</p>
                      {index === 0 && (
                        <p className="text-xs text-primary font-display tracking-wide">
                          THIS WEEK'S LEADER
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-display text-lg">
                        {currentConfig.formatValue(currentConfig.getValue(performer, phorestData))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Program Progress Tab */}
          <TabsContent value="program" className="space-y-6">
            {/* Metric Selector */}
            <div className="flex flex-wrap gap-2">
              {metrics.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={metric === key ? 'default' : 'outline'}
                  onClick={() => setMetric(key)}
                  className="font-display text-xs tracking-wide"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Leaderboard */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedEntries.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-sans">
                  No active participants yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map((entry, index) => (
                  <Card 
                    key={entry.user_id}
                    className={`p-4 lg:p-6 flex items-center gap-4 ${
                      index === 0 ? 'border-2 border-foreground' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className={`
                      w-10 h-10 flex items-center justify-center font-display text-lg
                      ${index === 0 ? 'bg-foreground text-background' : 'bg-muted'}
                    `}>
                      {index + 1}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium truncate">
                        {entry.display_name || entry.full_name}
                      </p>
                      {index === 0 && (
                        <p className="text-xs text-muted-foreground font-display tracking-wide">
                          LEADER
                        </p>
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <p className="font-display text-lg">{getValue(entry)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
