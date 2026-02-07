import { supabase } from '@/integrations/supabase/client';

interface AchievementContext {
  trainingCompleted?: number;
  totalTrainings?: number;
  bellsRung?: number;
  streakDays?: number;
  highFivesGiven?: number;
  highFivesReceived?: number;
  swapsHelped?: number;
  challengesWon?: number;
}

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface GrantedAchievement {
  achievement: Achievement;
  isNew: boolean;
}

// Cache for achievement definitions
let achievementsCache: Achievement[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAchievementDefinitions(): Promise<Achievement[]> {
  const now = Date.now();
  if (achievementsCache && now - cacheTimestamp < CACHE_TTL) {
    return achievementsCache;
  }

  const { data, error } = await supabase
    .from('leaderboard_achievements')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching achievements:', error);
    return achievementsCache || [];
  }

  achievementsCache = data || [];
  cacheTimestamp = now;
  return achievementsCache;
}

async function getUserEarnedAchievements(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user achievements:', error);
    return new Set();
  }

  return new Set(data?.map(a => a.achievement_id) || []);
}

async function grantAchievement(
  userId: string,
  achievement: Achievement
): Promise<boolean> {
  const { error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievement.id,
      metadata: { earned_via: 'automatic' },
    });

  if (error && error.code !== '23505') { // Ignore duplicate key errors
    console.error('Error granting achievement:', error);
    return false;
  }

  return true;
}

function checkAchievementEligibility(
  achievement: Achievement,
  context: AchievementContext
): boolean {
  const { requirement_type, requirement_value } = achievement;

  switch (requirement_type) {
    case 'training_completed':
      return (context.trainingCompleted || 0) >= requirement_value;

    case 'all_training_completed':
      return (
        context.totalTrainings !== undefined &&
        context.totalTrainings > 0 &&
        context.trainingCompleted === context.totalTrainings
      );

    case 'bells_rung':
      return (context.bellsRung || 0) >= requirement_value;

    case 'streak_days':
      return (context.streakDays || 0) >= requirement_value;

    case 'high_fives_given':
      return (context.highFivesGiven || 0) >= requirement_value;

    case 'high_fives_received':
      return (context.highFivesReceived || 0) >= requirement_value;

    case 'swaps_helped':
      return (context.swapsHelped || 0) >= requirement_value;

    case 'challenges_won':
      return (context.challengesWon || 0) >= requirement_value;

    default:
      return false;
  }
}

/**
 * Check and grant achievements based on the provided context.
 * Returns newly granted achievements for celebration display.
 */
export async function checkAndGrantAchievements(
  userId: string,
  context: AchievementContext
): Promise<GrantedAchievement[]> {
  const achievements = await getAchievementDefinitions();
  const earnedIds = await getUserEarnedAchievements(userId);
  const newlyGranted: GrantedAchievement[] = [];

  for (const achievement of achievements) {
    // Skip already earned achievements
    if (earnedIds.has(achievement.id)) continue;

    // Check if eligible
    if (checkAchievementEligibility(achievement, context)) {
      const success = await grantAchievement(userId, achievement);
      if (success) {
        newlyGranted.push({ achievement, isNew: true });
      }
    }
  }

  return newlyGranted;
}

/**
 * Fetch context data for a user to check achievements.
 */
export async function fetchAchievementContext(
  userId: string
): Promise<AchievementContext> {
  const context: AchievementContext = {};

  // Fetch training progress
  const [trainingResult, videosResult] = await Promise.all([
    supabase
      .from('training_progress')
      .select('video_id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null),
    supabase
      .from('training_videos')
      .select('id')
      .eq('is_active', true),
  ]);

  context.trainingCompleted = trainingResult.data?.length || 0;
  context.totalTrainings = videosResult.data?.length || 0;

  // Fetch bells rung
  const bellsResult = await supabase
    .from('ring_the_bell_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  context.bellsRung = bellsResult.count || 0;

  // Fetch high fives given
  const highFivesGivenResult = await supabase
    .from('bell_entry_high_fives')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  context.highFivesGiven = highFivesGivenResult.count || 0;

  // Fetch high fives received (on user's bell entries)
  const { data: userEntries } = await supabase
    .from('ring_the_bell_entries')
    .select('id')
    .eq('user_id', userId);

  if (userEntries && userEntries.length > 0) {
    const entryIds = userEntries.map(e => e.id);
    const highFivesReceivedResult = await supabase
      .from('bell_entry_high_fives')
      .select('id', { count: 'exact', head: true })
      .in('entry_id', entryIds);

    context.highFivesReceived = highFivesReceivedResult.count || 0;
  }

  return context;
}

/**
 * Check achievements after a specific action.
 * Use this for targeted checks (e.g., after ringing bell, completing training).
 */
export async function checkAchievementsForAction(
  userId: string,
  actionType: 'training' | 'bell' | 'high_five' | 'swap' | 'challenge'
): Promise<GrantedAchievement[]> {
  const context = await fetchAchievementContext(userId);
  const achievements = await getAchievementDefinitions();
  const earnedIds = await getUserEarnedAchievements(userId);
  const newlyGranted: GrantedAchievement[] = [];

  // Filter to relevant achievement types
  const relevantCategories: Record<string, string[]> = {
    training: ['training'],
    bell: ['bell'],
    high_five: ['social'],
    swap: ['social'],
    challenge: ['challenge'],
  };

  const categoriesToCheck = relevantCategories[actionType] || [];

  for (const achievement of achievements) {
    if (!categoriesToCheck.includes(achievement.category)) continue;
    if (earnedIds.has(achievement.id)) continue;

    if (checkAchievementEligibility(achievement, context)) {
      const success = await grantAchievement(userId, achievement);
      if (success) {
        newlyGranted.push({ achievement, isNew: true });
      }
    }
  }

  return newlyGranted;
}

/**
 * Clear the achievements cache (useful after admin updates).
 */
export function clearAchievementsCache(): void {
  achievementsCache = null;
  cacheTimestamp = 0;
}
