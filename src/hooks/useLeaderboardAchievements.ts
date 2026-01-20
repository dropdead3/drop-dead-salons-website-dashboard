import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  metadata: unknown;
  achievement?: Achievement;
}

export function useLeaderboardAchievements(userId?: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    setLoading(true);

    // Fetch all achievement definitions
    const { data: achievementDefs, error: defError } = await supabase
      .from('leaderboard_achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (defError) {
      console.error('Error fetching achievements:', defError);
      setLoading(false);
      return;
    }

    setAchievements(achievementDefs || []);

    // Fetch user achievements if userId provided
    if (userId) {
      const { data: userAch, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (!userError) {
        const enriched: UserAchievement[] = (userAch || []).map(ua => ({
          ...ua,
          metadata: ua.metadata as unknown,
          achievement: achievementDefs?.find(a => a.id === ua.achievement_id),
        }));
        setUserAchievements(enriched);
      }
    } else {
      // Fetch all user achievements for leaderboard display
      const { data: allUserAch, error: allError } = await supabase
        .from('user_achievements')
        .select('*');

      if (!allError) {
        const enriched: UserAchievement[] = (allUserAch || []).map(ua => ({
          ...ua,
          metadata: ua.metadata as unknown,
          achievement: achievementDefs?.find(a => a.id === ua.achievement_id),
        }));
        setUserAchievements(enriched);
      }
    }

    setLoading(false);
  };

  const grantAchievement = async (targetUserId: string, achievementKey: string, metadata?: Json) => {
    const achievement = achievements.find(a => a.key === achievementKey);
    if (!achievement) {
      console.error('Achievement not found:', achievementKey);
      return null;
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .insert([{
        user_id: targetUserId,
        achievement_id: achievement.id,
        metadata: metadata ?? {},
      }])
      .select()
      .single();

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error granting achievement:', error);
      return null;
    }

    await fetchAchievements();
    return data;
  };

  const getUserAchievements = (userId: string): UserAchievement[] => {
    return userAchievements.filter(ua => ua.user_id === userId);
  };

  const hasAchievement = (userId: string, achievementKey: string): boolean => {
    const achievement = achievements.find(a => a.key === achievementKey);
    if (!achievement) return false;
    return userAchievements.some(ua => ua.user_id === userId && ua.achievement_id === achievement.id);
  };

  const getAchievementsByCategory = (category: string): Achievement[] => {
    return achievements.filter(a => a.category === category);
  };

  return {
    achievements,
    userAchievements,
    loading,
    grantAchievement,
    getUserAchievements,
    hasAchievement,
    getAchievementsByCategory,
    refetch: fetchAchievements,
  };
}
