import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  Users, 
  Play, 
  Trophy, 
  Pause,
  DollarSign,
  Flame,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type ProgramStatus = Database['public']['Enums']['program_status'];

interface ClientEngineStats {
  enrolled: number;
  active: number;
  completed: number;
  paused: number;
  totalRevenue: number;
  totalRings: number;
  avgProgress: number;
  topStreak: number;
}

export function ClientEngineOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClientEngineStats>({
    enrolled: 0,
    active: 0,
    completed: 0,
    paused: 0,
    totalRevenue: 0,
    totalRings: 0,
    avgProgress: 0,
    topStreak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [enrollmentsResult, ringEntriesResult] = await Promise.all([
        supabase
          .from('stylist_program_enrollment')
          .select('current_day, streak_count, status'),
        supabase
          .from('ring_the_bell_entries')
          .select('ticket_value'),
      ]);

      const enrollments = enrollmentsResult.data || [];
      const ringEntries = ringEntriesResult.data || [];

      const enrolled = enrollments.length;
      const active = enrollments.filter(e => e.status === 'active').length;
      const completed = enrollments.filter(e => e.status === 'completed').length;
      const paused = enrollments.filter(e => e.status === 'paused').length;
      
      const totalRevenue = ringEntries.reduce((sum, e) => sum + Number(e.ticket_value || 0), 0);
      const totalRings = ringEntries.length;
      
      const avgProgress = enrolled > 0 
        ? Math.round(enrollments.reduce((sum, e) => sum + ((e.current_day / 75) * 100), 0) / enrolled)
        : 0;
      
      const topStreak = enrollments.reduce((max, e) => Math.max(max, e.streak_count), 0);

      setStats({
        enrolled,
        active,
        completed,
        paused,
        totalRevenue,
        totalRings,
        avgProgress,
        topStreak,
      });
    } catch (error) {
      console.error('Error fetching client engine stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-medium text-sm">Client Engine Overview</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs gap-1"
          onClick={() => navigate('/dashboard/admin/client-engine-tracker')}
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Average Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg Team Progress</span>
          <span className="font-medium">{stats.avgProgress}%</span>
        </div>
        <Progress value={stats.avgProgress} className="h-2" />
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2.5 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">{stats.enrolled}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Enrolled</p>
        </div>
        <div className="text-center p-2.5 bg-green-500/10 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Play className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-600">{stats.active}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</p>
        </div>
        <div className="text-center p-2.5 bg-blue-500/10 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-blue-600">{stats.completed}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</p>
        </div>
        <div className="text-center p-2.5 bg-yellow-500/10 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Pause className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-lg font-semibold text-yellow-600">{stats.paused}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Paused</p>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-sm font-medium">${stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
          <Bell className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Bells Rung</p>
            <p className="text-sm font-medium">{stats.totalRings}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
          <Flame className="w-4 h-4 text-orange-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Top Streak</p>
            <p className="text-sm font-medium">{stats.topStreak} days</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
