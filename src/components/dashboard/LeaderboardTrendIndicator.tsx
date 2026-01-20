import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendData } from '@/hooks/useLeaderboardHistory';

interface LeaderboardTrendIndicatorProps {
  trend: TrendData;
  showTooltip?: boolean;
}

export function LeaderboardTrendIndicator({ trend, showTooltip = true }: LeaderboardTrendIndicatorProps) {
  const { rankChange, previousRank, weeklyHistory } = trend;

  const getTrendIcon = () => {
    if (rankChange > 0) {
      return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    } else if (rankChange < 0) {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendLabel = () => {
    if (rankChange > 0) {
      return `+${rankChange}`;
    } else if (rankChange < 0) {
      return `${rankChange}`;
    }
    return '—';
  };

  const getTrendColor = () => {
    if (rankChange > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (rankChange < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  if (!showTooltip || weeklyHistory.length === 0) {
    return (
      <div className={`flex items-center gap-1 text-xs font-sans ${getTrendColor()}`}>
        {getTrendIcon()}
        <span>{getTrendLabel()}</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button className={`flex items-center gap-1 text-xs font-sans hover:opacity-80 transition-opacity ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{getTrendLabel()}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-56 p-0">
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-display text-xs tracking-wide">RANK HISTORY</span>
              {previousRank && (
                <span className="text-xs text-muted-foreground">
                  Last week: #{previousRank}
                </span>
              )}
            </div>
            
            {/* Mini sparkline chart */}
            <div className="flex items-end gap-1 h-12">
              {weeklyHistory.map((week, idx) => {
                const maxRank = Math.max(...weeklyHistory.map(w => w.rank), 1);
                const height = ((maxRank - week.rank + 1) / maxRank) * 100;
                const isLatest = idx === weeklyHistory.length - 1;
                
                return (
                  <div
                    key={week.week}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        isLatest ? 'bg-primary' : 'bg-muted'
                      }`}
                      style={{ height: `${Math.max(height, 10)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Week labels */}
            <div className="flex gap-1 text-[10px] text-muted-foreground">
              {weeklyHistory.map((week, idx) => (
                <div key={week.week} className="flex-1 text-center truncate">
                  {idx === 0 || idx === weeklyHistory.length - 1 ? week.week : ''}
                </div>
              ))}
            </div>

            {/* Stats summary */}
            <div className="pt-2 border-t text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best rank</span>
                <span>#{Math.min(...weeklyHistory.map(w => w.rank))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg score</span>
                <span>{(weeklyHistory.reduce((sum, w) => sum + w.score, 0) / weeklyHistory.length).toFixed(1)} pts</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
