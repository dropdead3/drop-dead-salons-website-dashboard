import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VisibilityGate } from '@/components/visibility';
import { useAIInsights, type InsightItem, type ActionItem } from '@/hooks/useAIInsights';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  ChevronDown,
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

/** Self-contained expandable card widget for AI Business Insights */
export function AIInsightsDrawer() {
  const [expanded, setExpanded] = useState(false);
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
      <AnimatePresence mode="wait">
          {!expanded ? (
            /* ── Collapsed: Inline button ── */
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm font-display tracking-wide hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Brain className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              </div>
              <span>AI Insights</span>
              {sentiment && SentimentIcon && (
                <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', sentiment.bg)}>
                  <SentimentIcon className={cn('w-2.5 h-2.5', sentiment.color)} />
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </motion.button>
          ) : (
            /* ── Expanded: Full card ── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full rounded-2xl shadow-lg border border-border/40 bg-card overflow-hidden"
            >
              {/* Top gradient accent */}
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

              {/* Header */}
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-oat" />
                    <span className="font-display text-xs tracking-[0.15em]">AI BUSINESS INSIGHTS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => refresh(true)}
                      disabled={isRefreshing || cooldown > 0}
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sentiment summary */}
                {data && (
                  <div className="flex items-start gap-2">
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
                          {cooldown > 0 && ` · ${cooldown}s cooldown`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.25 }}
              >
                <ScrollArea className="max-h-[500px]">
                  <div className="px-4 pb-3">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="space-y-1.5">
                            <Skeleton className="w-20 h-3 rounded" />
                            <Skeleton className="w-full h-4 rounded" />
                            <Skeleton className="w-3/4 h-3 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : !data ? (
                      <div className="text-center py-14">
                        <Sparkles className="w-7 h-7 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-display text-muted-foreground">No insights generated yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refresh(true)}
                          disabled={isRefreshing}
                          className="gap-1.5 mt-3"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          Generate Insights
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Insights column */}
                        {data.insights.length > 0 && (
                          <div className="space-y-2">
                            {data.insights.map((insight, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.05, duration: 0.25 }}
                              >
                                <InsightCard insight={insight} />
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Action items column */}
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
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.25 + i * 0.05, duration: 0.25 }}
                                >
                                  <ActionItemCard item={item} index={i} />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-4 pb-4 pt-1">
                  <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border/50">
                    <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/50">
                      Powered by AI · Based on your data
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </VisibilityGate>
  );
}
