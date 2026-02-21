import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Flame, Star, Zap } from 'lucide-react';
import { useStylistLevels } from '@/hooks/useStylistLevels';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface TierProgressAlertProps {
  currentRevenue: number;
  className?: string;
}

export function TierProgressAlert({ currentRevenue, className }: TierProgressAlertProps) {
  const { data: levels } = useStylistLevels();
  const { formatCurrencyWhole } = useFormatCurrency();

  // With levels-only system, this component shows the current level info
  // Since levels aren't revenue-band based, we show a simpler view
  const levelInfo = useMemo(() => {
    if (!levels?.length) return null;

    // Show the levels sorted by commission rate
    const sorted = [...levels].sort((a, b) => 
      (a.service_commission_rate ?? 0) - (b.service_commission_rate ?? 0)
    );

    // Just show the level range info
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    return {
      lowestRate: lowest?.service_commission_rate ?? 0,
      highestRate: highest?.service_commission_rate ?? 0,
      lowestLabel: lowest?.label ?? '',
      highestLabel: highest?.label ?? '',
      levelCount: sorted.length,
    };
  }, [levels]);

  if (!levelInfo) return null;

  return (
    <Card className={cn('bg-muted/50 border', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted/50">
            <Star className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {levelInfo.lowestLabel} ({(levelInfo.lowestRate * 100).toFixed(0)}%)
                </Badge>
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {levelInfo.highestLabel} ({(levelInfo.highestRate * 100).toFixed(0)}%)
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {levelInfo.levelCount} experience levels configured
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
