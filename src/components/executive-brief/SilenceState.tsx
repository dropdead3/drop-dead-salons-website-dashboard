import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface SilenceStateProps {
  compact?: boolean;
}

/**
 * SilenceState — Designed silence.
 * 
 * When no high-confidence lever exists, this is not an empty state.
 * It is a deliberate, calm confirmation that operations are within thresholds.
 */
export function SilenceState({ compact = false }: SilenceStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        <span className="text-sm text-[hsl(var(--platform-foreground))]">Operations within thresholds</span>
        <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    );
  }

  return (
    <Card className="rounded-2xl shadow-2xl">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h3 className="text-lg font-medium tracking-tight text-[hsl(var(--platform-foreground))]">
          Operations within thresholds
        </h3>
        <p className="mt-2 max-w-sm text-sm text-[hsl(var(--platform-foreground-muted))]">
          No high-confidence lever detected this period. All monitored KPIs are operating within their defined ranges.
        </p>
        <p className="mt-4 text-xs text-[hsl(var(--platform-foreground-muted))]">
          Last reviewed: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </CardContent>
    </Card>
  );
}
