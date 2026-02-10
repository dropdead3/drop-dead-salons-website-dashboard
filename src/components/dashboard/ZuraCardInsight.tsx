import { useState } from 'react';
import { ZuraAvatar } from '@/components/ui/ZuraAvatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardInsight } from '@/hooks/useCardInsight';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ZuraCardInsightProps {
  cardName: string;
  metricData?: Record<string, string | number>;
  dateRange?: string;
  locationName?: string;
}

export function ZuraCardInsight({ cardName, metricData, dateRange, locationName }: ZuraCardInsightProps) {
  const [open, setOpen] = useState(false);
  const { insight, isLoading, fetchInsight, clearInsight } = useCardInsight({
    cardName,
    metricData,
    dateRange,
    locationName,
  });

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !insight) {
      fetchInsight();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-0.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer h-7 w-7 flex items-center justify-center"
          title="Zura AI Analysis"
          aria-label={`Get Zura AI analysis for ${cardName}`}
        >
          <ZuraAvatar size="sm" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        className={cn("w-80 max-h-96 overflow-y-auto p-0")}
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ZuraAvatar size="sm" />
            <div>
              <p className="font-display text-sm font-semibold">Zura AI</p>
              <p className="text-xs text-muted-foreground">{cardName}</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ) : insight ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click to analyze this card.</p>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">Powered by Zura AI</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
