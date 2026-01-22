import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Flame, Star, Zap } from 'lucide-react';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { cn } from '@/lib/utils';

interface TierProgressAlertProps {
  currentRevenue: number;
  className?: string;
}

export function TierProgressAlert({ currentRevenue, className }: TierProgressAlertProps) {
  const { tiers } = useCommissionTiers();

  const tierProgress = useMemo(() => {
    if (!tiers.length) return null;

    // Get service tiers (or all tiers if that's what's configured)
    const serviceTiers = tiers
      .filter(t => t.applies_to === 'services' || t.applies_to === 'all')
      .sort((a, b) => a.min_revenue - b.min_revenue);

    if (!serviceTiers.length) return null;

    // Find current tier
    let currentTier = null;
    let nextTier = null;
    
    for (let i = 0; i < serviceTiers.length; i++) {
      const tier = serviceTiers[i];
      const max = tier.max_revenue ?? Infinity;
      
      if (currentRevenue >= tier.min_revenue && currentRevenue <= max) {
        currentTier = tier;
        nextTier = serviceTiers[i + 1] || null;
        break;
      }
    }

    // If no current tier found, they're below minimum
    if (!currentTier && serviceTiers.length) {
      nextTier = serviceTiers[0];
    }

    // Calculate progress to next tier
    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        progress: 100,
        remaining: 0,
        percentToNext: 100,
        isCloseToNext: false,
        reachedTop: true,
      };
    }

    const start = currentTier?.min_revenue || 0;
    const target = nextTier.min_revenue;
    const progressInRange = currentRevenue - start;
    const rangeSize = target - start;
    const progress = Math.min((progressInRange / rangeSize) * 100, 100);
    const remaining = target - currentRevenue;
    const isCloseToNext = progress >= 75;

    return {
      currentTier,
      nextTier,
      progress,
      remaining,
      percentToNext: progress,
      isCloseToNext,
      reachedTop: false,
    };
  }, [tiers, currentRevenue]);

  if (!tierProgress) return null;

  const { currentTier, nextTier, progress, remaining, isCloseToNext, reachedTop } = tierProgress;

  // Determine alert level and styling
  const getAlertStyle = () => {
    if (reachedTop) {
      return {
        bg: 'bg-chart-4/10 border-chart-4/30',
        icon: Star,
        iconColor: 'text-chart-4',
        message: '🎉 You\'ve reached the top tier!',
      };
    }
    if (progress >= 90) {
      return {
        bg: 'bg-chart-2/10 border-chart-2/30',
        icon: Flame,
        iconColor: 'text-chart-2',
        message: `🔥 Almost there! Just $${remaining.toLocaleString()} to ${nextTier?.tier_name}!`,
      };
    }
    if (progress >= 75) {
      return {
        bg: 'bg-primary/10 border-primary/30',
        icon: Zap,
        iconColor: 'text-primary',
        message: `⚡ $${remaining.toLocaleString()} to unlock ${nextTier?.tier_name} tier`,
      };
    }
    return {
      bg: 'bg-muted/50 border-muted',
      icon: Target,
      iconColor: 'text-muted-foreground',
      message: `$${remaining.toLocaleString()} to next tier`,
    };
  };

  const alertStyle = getAlertStyle();
  const AlertIcon = alertStyle.icon;

  return (
    <Card className={cn(alertStyle.bg, 'border', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', alertStyle.bg)}>
            <AlertIcon className={cn('w-5 h-5', alertStyle.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {currentTier && (
                  <Badge variant="secondary" className="text-xs">
                    {currentTier.tier_name} ({(currentTier.commission_rate * 100).toFixed(0)}%)
                  </Badge>
                )}
                {nextTier && !reachedTop && (
                  <>
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {nextTier.tier_name} ({(nextTier.commission_rate * 100).toFixed(0)}%)
                    </Badge>
                  </>
                )}
              </div>
              <span className="text-xs font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress 
              value={progress} 
              className={cn(
                'h-2',
                isCloseToNext && '[&>div]:bg-chart-2',
                reachedTop && '[&>div]:bg-chart-4'
              )} 
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {alertStyle.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
