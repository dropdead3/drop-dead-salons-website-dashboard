import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { ExecutiveSummaryCard } from '@/components/dashboard/analytics/ExecutiveSummaryCard';
import { ExecutiveTrendChart } from '@/components/dashboard/analytics/ExecutiveTrendChart';
import { WeeklyLeverSection } from './WeeklyLeverSection';
import { AIInsightsSection } from './AIInsightsSection';
import { Infotainer } from '@/components/ui/Infotainer';

export function LeadershipTabContent() {
  return (
    <div className="space-y-6">
      <Infotainer
        id="executive-intelligence"
        title="EXECUTIVE INTELLIGENCE"
        description={
          <span>
            Your strategic cockpit — KPI snapshot, weekly lever recommendation, and AI-powered insights in one view.
            Review performance, act on Zura's highest-confidence lever, and explore deeper business intelligence below.
          </span>
        }
      />

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

      <PinnableCard
        elementKey="weekly_lever"
        elementName="Weekly Lever"
        category="Analytics Hub - Leadership"
      >
        <WeeklyLeverSection />
      </PinnableCard>

      <PinnableCard
        elementKey="zura_insights"
        elementName="Zura Insights"
        category="Analytics Hub - Leadership"
      >
        <AIInsightsSection />
      </PinnableCard>
    </div>
  );
}
