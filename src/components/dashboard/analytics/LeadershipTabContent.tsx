import { useState } from 'react';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { ExecutiveSummaryCard } from '@/components/dashboard/analytics/ExecutiveSummaryCard';
import { ExecutiveTrendChart } from '@/components/dashboard/analytics/ExecutiveTrendChart';
import { WeeklyLeverSection } from '@/components/dashboard/analytics/WeeklyLeverSection';
import { Target, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function LeadershipTabContent() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Executive Brief toggle button */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm font-sans hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium">Executive Brief</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 w-full rounded-2xl shadow-lg border border-border/40 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-display text-xs font-medium tracking-[0.15em] uppercase text-foreground">
                      Executive Brief
                    </span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-5">
                  <WeeklyLeverSection />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PinnableCard
        elementKey="executive_summary"
        elementName="Executive Summary"
        category="Analytics Hub - Leadership"
      >
        <ExecutiveSummaryCard />
      </PinnableCard>

      <PinnableCard
        elementKey="executive_trend"
        elementName="Trend Analysis"
        category="Analytics Hub - Executive Summary"
      >
        <ExecutiveTrendChart />
      </PinnableCard>
    </div>
  );
}
