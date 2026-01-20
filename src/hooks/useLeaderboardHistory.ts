import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format } from 'date-fns';

export interface LeaderboardHistoryEntry {
  id: string;
  user_id: string;
  week_start: string;
  overall_rank: number;
  overall_score: number;
  new_clients_rank: number | null;
  new_clients_value: number | null;
  retention_rank: number | null;
  retention_value: number | null;
  retail_rank: number | null;
  retail_value: number | null;
  extensions_rank: number | null;
  extensions_value: number | null;
}

export interface TrendData {
  rankChange: number; // positive = improved (moved up), negative = dropped
  scoreChange: number;
  previousRank: number | null;
  weeklyHistory: { week: string; rank: number; score: number }[];
}

export function useLeaderboardHistory(userId?: string) {
  const [history, setHistory] = useState<LeaderboardHistoryEntry[]>([]);
  const [allHistory, setAllHistory] = useState<LeaderboardHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    
    // Fetch last 8 weeks of history
    const eightWeeksAgo = format(subWeeks(new Date(), 8), 'yyyy-MM-dd');
    
    let query = supabase
      .from('leaderboard_history')
      .select('*')
      .gte('week_start', eightWeeksAgo)
      .order('week_start', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard history:', error);
      setLoading(false);
      return;
    }

    if (userId) {
      setHistory(data || []);
    }
    setAllHistory(data || []);
    setLoading(false);
  };

  const getTrendForUser = (userId: string): TrendData => {
    const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const lastWeek = format(subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');

    const userHistory = allHistory
      .filter(h => h.user_id === userId)
      .sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime());

    const currentEntry = userHistory.find(h => h.week_start === currentWeek);
    const previousEntry = userHistory.find(h => h.week_start === lastWeek);

    const rankChange = previousEntry && currentEntry 
      ? previousEntry.overall_rank - currentEntry.overall_rank // Positive if rank improved (lower number)
      : 0;

    const scoreChange = previousEntry && currentEntry
      ? Number(currentEntry.overall_score) - Number(previousEntry.overall_score)
      : 0;

    const weeklyHistory = userHistory
      .slice(0, 8)
      .reverse()
      .map(h => ({
        week: format(new Date(h.week_start), 'MMM d'),
        rank: h.overall_rank,
        score: Number(h.overall_score),
      }));

    return {
      rankChange,
      scoreChange,
      previousRank: previousEntry?.overall_rank ?? null,
      weeklyHistory,
    };
  };

  const saveWeeklySnapshot = async (rankings: {
    userId: string;
    rank: number;
    score: number;
    newClients: { rank: number; value: number };
    retention: { rank: number; value: number };
    retail: { rank: number; value: number };
    extensions: { rank: number; value: number };
  }[]) => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const entries = rankings.map(r => ({
      user_id: r.userId,
      week_start: weekStart,
      overall_rank: r.rank,
      overall_score: r.score,
      new_clients_rank: r.newClients.rank,
      new_clients_value: r.newClients.value,
      retention_rank: r.retention.rank,
      retention_value: r.retention.value,
      retail_rank: r.retail.rank,
      retail_value: r.retail.value,
      extensions_rank: r.extensions.rank,
      extensions_value: r.extensions.value,
    }));

    const { error } = await supabase
      .from('leaderboard_history')
      .upsert(entries, { onConflict: 'user_id,week_start' });

    if (error) {
      console.error('Error saving leaderboard snapshot:', error);
      throw error;
    }

    await fetchHistory();
  };

  return {
    history,
    allHistory,
    loading,
    getTrendForUser,
    saveWeeklySnapshot,
    refetch: fetchHistory,
  };
}
