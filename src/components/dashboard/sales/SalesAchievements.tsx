import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Trophy, Star, Flame, TrendingUp, Award, Crown, 
  Zap, Target, Medal, PartyPopper, Rocket, Diamond,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesAchievementsProps {
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  newClients?: number;
  daysActive?: number;
  weekStreak?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  threshold: number;
  metric: 'revenue' | 'services' | 'products' | 'transactions' | 'clients' | 'streak';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const ACHIEVEMENTS: Achievement[] = [
  // Revenue achievements
  { id: 'rev_1k', name: 'Rising Star', description: 'Earn $1,000 in revenue', icon: Star, color: 'amber', threshold: 1000, metric: 'revenue', tier: 'bronze' },
  { id: 'rev_5k', name: 'Hot Streak', description: 'Earn $5,000 in revenue', icon: Flame, color: 'orange', threshold: 5000, metric: 'revenue', tier: 'silver' },
  { id: 'rev_10k', name: 'Top Performer', description: 'Earn $10,000 in revenue', icon: Trophy, color: 'amber', threshold: 10000, metric: 'revenue', tier: 'gold' },
  { id: 'rev_25k', name: 'Elite Status', description: 'Earn $25,000 in revenue', icon: Crown, color: 'purple', threshold: 25000, metric: 'revenue', tier: 'platinum' },
  
  // Service achievements
  { id: 'svc_50', name: 'Service Pro', description: 'Complete 50 services', icon: Award, color: 'blue', threshold: 50, metric: 'services', tier: 'bronze' },
  { id: 'svc_100', name: 'Service Master', description: 'Complete 100 services', icon: Medal, color: 'blue', threshold: 100, metric: 'services', tier: 'silver' },
  { id: 'svc_250', name: 'Service Legend', description: 'Complete 250 services', icon: Diamond, color: 'blue', threshold: 250, metric: 'services', tier: 'gold' },
  
  // Product achievements
  { id: 'prod_1k', name: 'Retail Starter', description: 'Sell $1,000 in products', icon: Target, color: 'emerald', threshold: 1000, metric: 'products', tier: 'bronze' },
  { id: 'prod_5k', name: 'Retail Expert', description: 'Sell $5,000 in products', icon: Rocket, color: 'emerald', threshold: 5000, metric: 'products', tier: 'silver' },
  { id: 'prod_10k', name: 'Retail Champion', description: 'Sell $10,000 in products', icon: Zap, color: 'emerald', threshold: 10000, metric: 'products', tier: 'gold' },
  
  // Transaction achievements
  { id: 'txn_100', name: 'Busy Bee', description: 'Complete 100 transactions', icon: TrendingUp, color: 'teal', threshold: 100, metric: 'transactions', tier: 'bronze' },
  { id: 'txn_500', name: 'Powerhouse', description: 'Complete 500 transactions', icon: PartyPopper, color: 'teal', threshold: 500, metric: 'transactions', tier: 'gold' },
];

const tierColors = {
  bronze: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
  silver: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600',
  gold: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  platinum: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
};

const colorMap: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

export function SalesAchievements({
  totalRevenue,
  serviceRevenue,
  productRevenue,
  totalTransactions,
  newClients = 0,
  daysActive = 0,
  weekStreak = 0,
}: SalesAchievementsProps) {
  const achievementStatus = useMemo(() => {
    return ACHIEVEMENTS.map(achievement => {
      let current = 0;
      switch (achievement.metric) {
        case 'revenue':
          current = totalRevenue;
          break;
        case 'services':
          current = serviceRevenue > 0 ? Math.floor(totalRevenue / 100) : 0; // Estimate
          break;
        case 'products':
          current = productRevenue;
          break;
        case 'transactions':
          current = totalTransactions;
          break;
        case 'clients':
          current = newClients;
          break;
        case 'streak':
          current = weekStreak;
          break;
      }

      const progress = Math.min((current / achievement.threshold) * 100, 100);
      const isUnlocked = current >= achievement.threshold;

      return {
        ...achievement,
        current,
        progress,
        isUnlocked,
      };
    });
  }, [totalRevenue, serviceRevenue, productRevenue, totalTransactions, newClients, weekStreak]);

  const unlockedCount = achievementStatus.filter(a => a.isUnlocked).length;
  const nextToUnlock = achievementStatus.find(a => !a.isUnlocked && a.progress > 50);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-chart-4" />
            <CardTitle className="font-display">Achievements</CardTitle>
          </div>
          <Badge variant="secondary">
            {unlockedCount}/{ACHIEVEMENTS.length} unlocked
          </Badge>
        </div>
        <CardDescription>Earn badges for reaching sales milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next to unlock */}
        {nextToUnlock && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', colorMap[nextToUnlock.color])}>
                <nextToUnlock.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{nextToUnlock.name}</p>
                <Progress value={nextToUnlock.progress} className="h-1.5 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {nextToUnlock.progress.toFixed(0)}% - {nextToUnlock.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Achievement grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          <TooltipProvider>
            {achievementStatus.map(achievement => (
              <Tooltip key={achievement.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'aspect-square rounded-lg border flex items-center justify-center transition-all cursor-pointer',
                      achievement.isUnlocked
                        ? cn(colorMap[achievement.color], 'border-transparent')
                        : 'bg-muted/50 border-dashed opacity-50'
                    )}
                  >
                    {achievement.isUnlocked ? (
                      <achievement.icon className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-xs">{achievement.name}</p>
                      <Badge variant="outline" className={cn('text-[10px] capitalize', tierColors[achievement.tier])}>
                        {achievement.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {!achievement.isUnlocked && (
                      <Progress value={achievement.progress} className="h-1 mt-2" />
                    )}
                    {achievement.isUnlocked && (
                      <p className="text-[10px] text-chart-2">✓ Unlocked!</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Summary by tier */}
        <div className="flex justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          {(['bronze', 'silver', 'gold', 'platinum'] as const).map(tier => {
            const tierAchievements = achievementStatus.filter(a => a.tier === tier);
            const unlocked = tierAchievements.filter(a => a.isUnlocked).length;
            return (
              <div key={tier} className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', 
                  tier === 'bronze' && 'bg-orange-500',
                  tier === 'silver' && 'bg-slate-400',
                  tier === 'gold' && 'bg-amber-500',
                  tier === 'platinum' && 'bg-purple-500',
                )} />
                <span className="capitalize">{tier}</span>
                <span className="font-medium">{unlocked}/{tierAchievements.length}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
