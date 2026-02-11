import { useState } from 'react';
import { ZuraAvatar } from '@/components/ui/ZuraAvatar';
import { Dialog, DialogTrigger, DialogContent, DialogOverlay } from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="p-0.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer h-7 w-7 flex items-center justify-center"
          title="Zura AI Analysis"
          aria-label={`Get Zura AI analysis for ${cardName}`}
        >
          <ZuraAvatar size="sm" />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden gap-0"
      >
        {/* Premium Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <ZuraAvatar size="md" />
            <div>
              <p className="font-display text-base font-medium tracking-wide">Zura AI</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cardName}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
          ) : insight ? (
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="font-display font-medium text-lg tracking-wide mt-6 mb-3 first:mt-0 text-foreground" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="font-display font-medium text-base tracking-wide mt-6 mb-2 first:mt-0 text-foreground" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="font-display font-medium text-sm tracking-wide uppercase mt-6 mb-2 first:mt-0 text-foreground/90" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-4 last:mb-0 leading-relaxed text-muted-foreground" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="mb-4 last:mb-0 space-y-1.5 list-disc list-inside text-muted-foreground" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="mb-4 last:mb-0 space-y-1.5 list-decimal list-inside text-muted-foreground" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="leading-relaxed" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-medium text-foreground" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-4 border-border/50" {...props} />
                  ),
                }}
              >
                {insight}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click to analyze this card.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/50 bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center tracking-wide">Powered by Zura AI</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
