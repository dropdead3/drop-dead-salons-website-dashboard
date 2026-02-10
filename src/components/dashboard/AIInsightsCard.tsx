import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VisibilityGate } from '@/components/visibility';
import { PinnableCard } from './PinnableCard';
import { useAIInsights, type InsightItem, type ActionItem, type FeatureSuggestion } from '@/hooks/useAIInsights';
import { useDismissedSuggestions } from '@/hooks/useDismissedSuggestions';
import { useTasks } from '@/hooks/useTasks';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { GuidancePanel } from './GuidancePanel';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  ChevronRight,
  Lightbulb,
  Zap,
  X,
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

interface GuidanceRequest {
  type: 'insight' | 'action';
  title: string;
  description: string;
  category?: string;
  priority?: string;
}

const slideVariants = {
  enterFromRight: { x: '100%', opacity: 0 },
  enterFromLeft: { x: '-100%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitToLeft: { x: '-100%', opacity: 0 },
  exitToRight: { x: '100%', opacity: 0 },
};

function blurDollarAmounts(text: string) {
  const parts = text.split(/(\$[\d,]+\.?\d*)/g);
  return parts.map((part, i) => {
    if (/^\$[\d,]+\.?\d*$/.test(part)) {
      return <BlurredAmount key={i}>{part}</BlurredAmount>;
    }
    return part;
  });
}

function blurFinancialValues(text: string) {
  const parts = text.split(/(\$[\d,]+\.?\d*k?)/g);
  return parts.map((part, i) => {
    if (/^\$[\d,]+\.?\d*k?$/.test(part)) {
      return <BlurredAmount key={i}>{part}</BlurredAmount>;
    }
    return part;
  });
}

function GuidanceTrigger({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 h-6 px-2 mt-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors duration-200"
    >
      <Lightbulb className="w-3 h-3" />
      {label}
      <ChevronRight className="w-3 h-3 relative top-px opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
    </button>
  );
}

function InsightCard({ insight, onRequestGuidance }: { insight: InsightItem; onRequestGuidance: (req: GuidanceRequest) => void }) {
  const config = categoryConfig[insight.category];
  const Icon = config?.icon || Activity;

  return (
    <div className={cn('border-l-2 rounded-lg p-3 transition-colors', severityStyles[insight.severity])}>
      <div className="flex items-center gap-2.5">
        <div className={cn('flex-shrink-0', severityIconColor[insight.severity])}>
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
        <div className="flex-shrink-0">
          <GuidanceTrigger
            label="How to improve"
            onClick={() => onRequestGuidance({ type: 'insight', title: insight.title, description: insight.description, category: insight.category })}
          />
        </div>
      </div>
    </div>
  );
}

function ActionItemCard({ item, index, onRequestGuidance }: { item: ActionItem; index: number; onRequestGuidance: (req: GuidanceRequest) => void }) {
  return (
    <div className="py-1.5">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/5 flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-display">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">{blurFinancialValues(item.action)}</p>
          <GuidanceTrigger
            label="What you should do"
            onClick={() => onRequestGuidance({ type: 'action', title: item.action, description: item.action, priority: item.priority })}
          />
        </div>
        <span className={cn(
          'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-display flex-shrink-0',
          priorityBadge[item.priority],
        )}>
          {item.priority}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="rounded-2xl shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="w-40 h-5 rounded" />
          </div>
          <Skeleton className="w-20 h-8 rounded" />
        </div>
        <Skeleton className="w-full h-4 mt-2 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="w-20 h-3 rounded" />
            <Skeleton className="w-full h-4 rounded" />
            <Skeleton className="w-3/4 h-3 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AIInsightsCard() {
  const { data, generatedAt, isLoading, isRefreshing, isStale, refresh, cooldownRemaining } = useAIInsights();
  const { dismissedKeys, dismiss } = useDismissedSuggestions();
  const { createTask } = useTasks();
  const [cooldown, setCooldown] = useState(0);
  const [activeGuidance, setActiveGuidance] = useState<GuidanceRequest | null>(null);
  const [guidanceText, setGuidanceText] = useState<string | null>(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);

  useEffect(() => {
    if (cooldownRemaining <= 0) { setCooldown(0); return; }
    setCooldown(Math.ceil(cooldownRemaining / 1000));
    const interval = setInterval(() => {
      setCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleRequestGuidance = useCallback(async (req: GuidanceRequest) => {
    setActiveGuidance(req);
    setGuidanceText(null);
    setIsLoadingGuidance(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insight-guidance', {
        body: { type: req.type, title: req.title, description: req.description, category: req.category, priority: req.priority },
      });
      if (error) throw error;
      setGuidanceText(data.guidance);
    } catch (err) {
      console.error('Failed to fetch guidance:', err);
      toast.error('Failed to get guidance. Please try again.');
      setActiveGuidance(null);
    } finally {
      setIsLoadingGuidance(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveGuidance(null);
    setGuidanceText(null);
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  const sentiment = data?.overallSentiment ? sentimentConfig[data.overallSentiment] : null;
  const SentimentIcon = sentiment?.icon || Activity;

  return (
    <VisibilityGate
      elementKey="ai_business_insights"
      elementName="AI Business Insights"
      elementCategory="Dashboard Home"
    >
      <PinnableCard
        elementKey="ai_business_insights"
        elementName="AI Business Insights"
        category="Dashboard Home"
      >
        <Card className="rounded-2xl shadow-2xl max-h-[600px] flex flex-col overflow-hidden">
          {!activeGuidance && (
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <CardTitle className="text-base font-display tracking-wide">ZURA BUSINESS INSIGHTS</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refresh(true)} disabled={isRefreshing || cooldown > 0} className="gap-1.5 text-xs h-8">
                  <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                  {cooldown > 0 ? `${cooldown}s` : isRefreshing ? 'Analyzing...' : 'Refresh'}
                </Button>
              </div>
              {data && (
                <div className="flex items-start gap-2 mt-2">
                  <div className={cn('flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center', sentiment?.bg)}>
                    <SentimentIcon className={cn('w-3 h-3', sentiment?.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-snug">{blurFinancialValues(data.summaryLine)}</p>
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
            </CardHeader>
          )}

          <CardContent className={cn("pt-0 flex-1 min-h-0", activeGuidance && "p-0")}>
            <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
              <AnimatePresence mode="wait">
                {!activeGuidance ? (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0 }}
                    animate={slideVariants.center}
                    exit={slideVariants.exitToLeft}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {!data ? (
                      <div className="text-center py-8">
                        <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground mb-3">No insights generated yet</p>
                        <Button variant="outline" size="sm" onClick={() => refresh(true)} disabled={isRefreshing} className="gap-1.5">
                          <Brain className="w-3.5 h-3.5" />
                          Generate Insights
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {data.insights.length > 0 && (
                          <div className="space-y-2">
                            {data.insights.map((insight, i) => (
                              <InsightCard key={i} insight={insight} onRequestGuidance={handleRequestGuidance} />
                            ))}
                          </div>
                        )}
                        {data.actionItems.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">ACTION ITEMS</span>
                            </div>
                            <div className="space-y-0.5">
                              {data.actionItems.map((item, i) => (
                                <ActionItemCard key={i} item={item} index={i} onRequestGuidance={handleRequestGuidance} />
                              ))}
                            </div>
                          </div>
                        )}
                        {(() => {
                          const visibleSuggestions = (data.featureSuggestions || []).filter(
                            (s) => !dismissedKeys.has(s.suggestionKey)
                          );
                          if (visibleSuggestions.length === 0) return null;
                          return (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">SUGGESTED FOR YOU</span>
                              </div>
                              <div className="space-y-2">
                                <AnimatePresence>
                                  {visibleSuggestions.map((suggestion) => (
                                    <motion.div
                                      key={suggestion.suggestionKey}
                                      initial={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="relative border border-dashed border-amber-500/30 rounded-lg p-3 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
                                    >
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => dismiss(suggestion.suggestionKey)}
                                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">Dismiss for 30 days</TooltipContent>
                                      </Tooltip>
                                      <div className="flex items-start gap-2.5 pr-5">
                                        <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-medium">{suggestion.featureName}</span>
                                            <span className={cn(
                                              'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-display',
                                              priorityBadge[suggestion.priority],
                                            )}>
                                              {suggestion.priority}
                                            </span>
                                          </div>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.whyItHelps}</p>
                                          <p className="text-xs text-muted-foreground/70 mt-1 italic">{suggestion.howToStart}</p>
                                          <GuidanceTrigger
                                            label="Learn more"
                                            onClick={() => handleRequestGuidance({
                                              type: 'action',
                                              title: `Enable ${suggestion.featureName}`,
                                              description: `${suggestion.whyItHelps} ${suggestion.howToStart}`,
                                            })}
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border/50">
                          <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                          <span className="text-[10px] text-muted-foreground/50">Powered by Zura AI · Based on your data</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="guidance"
                    initial={slideVariants.enterFromRight}
                    animate={slideVariants.center}
                    exit={slideVariants.exitToRight}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="h-[500px] flex flex-col"
                  >
                    <GuidancePanel
                      title={activeGuidance.title}
                      type={activeGuidance.type}
                      guidance={guidanceText}
                      isLoading={isLoadingGuidance}
                      onBack={handleBack}
                      suggestedTasks={data?.suggestedTasks}
                      onAddTask={(task) => createTask.mutate(task)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </PinnableCard>
    </VisibilityGate>
  );
}
