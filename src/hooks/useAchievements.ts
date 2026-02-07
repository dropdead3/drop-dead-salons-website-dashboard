import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  checkAchievementsForAction, 
  fetchAchievementContext 
} from '@/services/achievementService';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
}

interface GrantedAchievement {
  achievement: Achievement;
  isNew: boolean;
}

export function useAchievements() {
  const { user } = useAuth();
  const [pendingAchievements, setPendingAchievements] = useState<GrantedAchievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

  const checkAchievements = useCallback(
    async (actionType: 'training' | 'bell' | 'high_five' | 'swap' | 'challenge') => {
      if (!user) return;

      try {
        const newAchievements = await checkAchievementsForAction(user.id, actionType);
        
        if (newAchievements.length > 0) {
          // Queue all achievements
          setPendingAchievements(prev => [...prev, ...newAchievements]);
          
          // Show the first one if not already showing
          if (!isToastVisible && newAchievements.length > 0) {
            setCurrentAchievement(newAchievements[0].achievement);
            setIsToastVisible(true);
          }
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    },
    [user, isToastVisible]
  );

  const dismissCurrentAchievement = useCallback(() => {
    setIsToastVisible(false);
    
    // Show next achievement after a brief delay
    setTimeout(() => {
      setPendingAchievements(prev => {
        const remaining = prev.slice(1);
        if (remaining.length > 0) {
          setCurrentAchievement(remaining[0].achievement);
          setIsToastVisible(true);
        } else {
          setCurrentAchievement(null);
        }
        return remaining;
      });
    }, 300);
  }, []);

  const getContext = useCallback(async () => {
    if (!user) return null;
    return fetchAchievementContext(user.id);
  }, [user]);

  return {
    checkAchievements,
    currentAchievement,
    isToastVisible,
    dismissCurrentAchievement,
    getContext,
    pendingCount: pendingAchievements.length,
  };
}
