import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisibilityGate } from '@/components/visibility';
import { useAIInsights, type InsightItem, type ActionItem } from '@/hooks/useAIInsights';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { cn } from '@/lib/utils';
import {
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Activity,
  HeartPulse,
  CheckCircle2,
  Sparkles,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const categoryConfig: Record<InsightItem['category'], { icon: typeof TrendingUp; label: string }> = {
  revenue_pulse: { icon: DollarSign, label: 'Revenue Pulse' },
  cash_flow: { icon: TrendingDown, label: 'Cash Flow' },
  capacity: { icon: Activity, label: 'Capacity' },
  staffing: { icon: Users, label: 'Staffing' },
  client_health: { icon: HeartPulse, label: 'Client Health' },
  anomaly: { icon: AlertTriangle, label: 'Anomaly' },
};

const severityStyles: Record<InsightItem['severity'], string> = {
  info: 'border-l-blue-500/60 bg-blue-500/5',
  warning: 'border-l-amber-500/60 bg-amber-500/5',
  critical: 'border-l-red-500/60 bg-red-500/5',
};

const severityIconColor: Record<InsightItem['severity'], string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  critical: 'text-red-500',
};

const priorityBadge: Record<ActionItem['priority'], string> = {
  high: 'bg-red-500/10 text-red-600 dark:text-red-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  neutral: { icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  concerning: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
};

function blurFinancialValues(text: string) {
  const parts = text.split(/(\$[\d,]+\.?\d*k?)/g);
  return parts.map((part, i) => {
    if (/^\$[\d,]+\.?\d*k?$/.test(part)) {
      return <BlurredAmount key={i}>{part}</BlurredAmount>;
    }
    return part;
  });
}

function InsightCard({ insight }: { insight: InsightItem }) {
  const config = categoryConfig[insight.category];
  const Icon = config?.icon || Activity;

  return (
    <div className={cn('border-l-2 rounded-lg p-3 transition-colors', severityStyles[insight.severity])}>
      <div className="flex items-start gap-2.5">
        <div className={cn('mt-0.5 flex-shrink-0', severityIconColor[insight.severity])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">
              {config?.label || insight.category}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug">{insight.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {blurFinancialValues(insight.description)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionItemCard({ item, index }: { item: ActionItem; index: number }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/5 flex items-center justify-center mt-0.5">
        <span className="text-[10px] font-display">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{blurFinancialValues(item.action)}</p>
      </div>
      <span className={cn(
        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-display flex-shrink-0',
        priorityBadge[item.priority],
      )}>
        {item.priority}
      </span>
    </div>
  );
}

/** Trigger button to open the AI Insights drawer */
export function AIInsightsTrigger({ onClick }: { onClick: () => void }) {
  const { data } = useAIInsights();
  const sentiment = data?.overallSentiment ? sentimentConfig[data.overallSentiment] : null;
  const SentimentIcon = sentiment?.icon;

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="gap-2 h-9"
    >
      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
        <Brain className="w-3 h-3 text-violet-600 dark:text-violet-400" />
      </div>
      <span className="text-sm font-display tracking-wide">AI Insights</span>
      {SentimentIcon && (
        <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', sentiment?.bg)}>
          <SentimentIcon className={cn('w-2.5 h-2.5', sentiment?.color)} />
        </div>
      )}
    </Button>
  );
}

/** Self-contained drawer with trigger — wraps Sheet + content + trigger */
export function AIInsightsDrawer() {
  const [open, setOpen] = useState(false);
  const { data, generatedAt, isLoading, isRefreshing, isStale, refresh, cooldownRemaining } = useAIInsights();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldownRemaining <= 0) { setCooldown(0); return; }
    setCooldown(Math.ceil(cooldownRemaining / 1000));
    const interval = setInterval(() => {
      setCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const sentiment = data?.overallSentiment ? sentimentConfig[data.overallSentiment] : null;
  const SentimentIcon = sentiment?.icon || Activity;

  return (
    <VisibilityGate
      elementKey="ai_business_insights"
      elementName="AI Business Insights"
      elementCategory="Dashboard Home"
    >
      <AIInsightsTrigger onClick={() => setOpen(true)} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <SheetTitle className="text-base font-display tracking-wide">
                  AI BUSINESS INSIGHTS
                </SheetTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refresh(true)}
                disabled={isRefreshing || cooldown > 0}
                className="gap-1.5 text-xs h-8"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                {cooldown > 0 ? `${cooldown}s` : isRefreshing ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
            <SheetDescription className="sr-only">AI-generated business insights and action items</SheetDescription>

            {data && (
              <div className="flex items-start gap-2 mt-2">
                <div className={cn('flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center', sentiment?.bg)}>
                  <SentimentIcon className={cn('w-3 h-3', sentiment?.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground leading-snug">
                    {blurFinancialValues(data.summaryLine)}
                  </p>
                  {generatedAt && (
                    <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Updated {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
                      {isStale && ' · Stale'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="w-20 h-3 rounded" />
                  <Skeleton className="w-full h-4 rounded" />
                  <Skeleton className="w-3/4 h-3 rounded" />
                </div>
              ))}
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-3">No insights generated yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh(true)}
                disabled={isRefreshing}
                className="gap-1.5"
              >
                <Brain className="w-3.5 h-3.5" />
                Generate Insights
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {data.insights.length > 0 && (
                <div className="space-y-2">
                  {data.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>
              )}

              {data.actionItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">
                      ACTION ITEMS
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {data.actionItems.map((item, i) => (
                      <ActionItemCard key={i} item={item} index={i} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border/50">
                <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/50">
                  Powered by AI · Based on your data
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </VisibilityGate>
  );
}
