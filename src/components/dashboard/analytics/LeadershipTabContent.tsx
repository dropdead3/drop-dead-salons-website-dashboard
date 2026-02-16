import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { ExecutiveSummaryCard } from '@/components/dashboard/analytics/ExecutiveSummaryCard';
import { ExecutiveTrendChart } from '@/components/dashboard/analytics/ExecutiveTrendChart';
import { Infotainer } from '@/components/ui/Infotainer';

export function LeadershipTabContent() {
  return (
    <div className="space-y-6">
      <Infotainer
        id="executive-intelligence"
        title="EXECUTIVE INTELLIGENCE"
        description={
          <span>
            Your strategic cockpit — KPI snapshot and trend analysis in one view.
            Review performance and explore deeper business intelligence below.
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
    </div>
  );
}
