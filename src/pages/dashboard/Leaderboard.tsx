import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Target, DollarSign, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  display_name: string | null;
  current_day: number;
  streak_count: number;
  total_revenue: number;
  ring_count: number;
}

type MetricType = 'day' | 'streak' | 'revenue' | 'bells';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricType>('day');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Get enrollments with profiles
    const { data: enrollments, error } = await supabase
      .from('stylist_program_enrollment')
      .select(`
        user_id,
        current_day,
        streak_count
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
      return;
    }

    // Get profiles for enrolled users
    const userIds = enrollments?.map(e => e.user_id) || [];
    
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('employee_profiles')
      .select('user_id, full_name, display_name')
      .in('user_id', userIds);

    // Get ring the bell totals
    const { data: bellTotals } = await supabase
      .from('ring_the_bell_entries')
      .select('user_id, ticket_value')
      .in('user_id', userIds);

    // Combine data
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
      case 'day':
        return b.current_day - a.current_day;
      case 'streak':
        return b.streak_count - a.streak_count;
      case 'revenue':
        return b.total_revenue - a.total_revenue;
      case 'bells':
        return b.ring_count - a.ring_count;
      default:
        return 0;
    }
  });

  const metrics: { key: MetricType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'day', label: 'Progress', icon: Target },
    { key: 'streak', label: 'Streak', icon: Flame },
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
    { key: 'bells', label: 'Bells', icon: Trophy },
  ];

  const getValue = (entry: LeaderboardEntry): string => {
    switch (metric) {
      case 'day':
        return `Day ${entry.current_day}`;
      case 'streak':
        return `${entry.streak_count} days`;
      case 'revenue':
        return `$${entry.total_revenue.toLocaleString()}`;
      case 'bells':
        return `${entry.ring_count} bells`;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            LEADERBOARD
          </h1>
          <p className="text-muted-foreground font-sans">
            See who's crushing the program.
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
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
      </div>
    </DashboardLayout>
  );
}
