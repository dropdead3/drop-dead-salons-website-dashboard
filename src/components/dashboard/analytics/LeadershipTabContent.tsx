import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { ExecutiveSummaryCard } from '@/components/dashboard/analytics/ExecutiveSummaryCard';
import { ExecutiveTrendChart } from '@/components/dashboard/analytics/ExecutiveTrendChart';
import { WeeklyLeverSection } from '@/components/dashboard/analytics/WeeklyLeverSection';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Target, ChevronRight } from 'lucide-react';

export function LeadershipTabContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Target className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="font-display text-sm font-medium tracking-wide uppercase text-foreground">
            Executive Brief
          </span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              View Brief
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display text-base font-medium tracking-wide uppercase">
                Executive Brief
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <WeeklyLeverSection />
            </div>
          </SheetContent>
        </Sheet>
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
