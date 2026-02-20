import { memo } from 'react';
import { tokens } from '@/lib/design-tokens';
import { motion } from 'framer-motion';
import { Clock, User, Sparkles, Check, X, TrendingUp, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SchedulingSuggestion } from '@/hooks/useSchedulingSuggestions';

interface SlotSuggestionCardProps {
  suggestion: SchedulingSuggestion;
  onAccept?: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
  className?: string;
}

const suggestionTypeConfig = {
  optimal_slot: {
    icon: Target,
    label: 'Optimal',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  fill_gap: {
    icon: Zap,
    label: 'Fill Gap',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  avoid_conflict: {
    icon: TrendingUp,
    label: 'No Conflicts',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  peak_time: {
    icon: TrendingUp,
    label: 'Peak Hour',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
};

function SlotSuggestionCardComponent({
  suggestion,
  onAccept,
  onDismiss,
  isLoading,
  className,
}: SlotSuggestionCardProps) {
  const config = suggestionTypeConfig[suggestion.suggestionType] || suggestionTypeConfig.optimal_slot;
  const TypeIcon = config.icon;
  const confidencePercent = Math.round(suggestion.score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'border-l-4 border-l-primary/60 hover:border-l-primary transition-colors',
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Time and staff */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {confidencePercent}% match
                </span>
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-lg">
                    {suggestion.time}
                  </span>
                  <span className="text-muted-foreground">
                    – {suggestion.endTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <User className="w-3.5 h-3.5" />
                <span>{suggestion.staffName}</span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {suggestion.reason}
              </p>
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-col gap-2">
              <Button
                size={tokens.button.card}
                onClick={onAccept}
                disabled={isLoading}
                className="gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Book
              </Button>
              <Button
                size={tokens.button.card}
                variant="ghost"
                onClick={onDismiss}
                disabled={isLoading}
                className="gap-1.5 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Skip
              </Button>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Confidence</span>
              <span>{confidencePercent}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercent}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const SlotSuggestionCard = memo(SlotSuggestionCardComponent);
