import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { WeeklyLeverBrief } from '@/components/executive-brief/WeeklyLeverBrief';
import { SilenceState } from '@/components/executive-brief/SilenceState';
import { useActiveRecommendation } from '@/hooks/useLeverRecommendations';
import { Loader2 } from 'lucide-react';
import { EnforcementGateBanner } from '@/components/enforcement/EnforcementGateBanner';
import { Infotainer } from '@/components/ui/Infotainer';

export default function ExecutiveBriefPage() {
  const { data: recommendation, isLoading } = useActiveRecommendation();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <DashboardPageHeader
        title="Executive Brief"
        description="Your primary lever this period."
        backTo="/dashboard"
        backLabel="Back to Command Center"
      />

      <Infotainer
        id="executive-brief"
        title="WEEKLY EXECUTIVE BRIEF"
        description={
          <span>
            Your weekly strategic lever — one high-confidence action to move the needle. 
            Zura monitors your KPIs continuously and surfaces only the highest-impact opportunity. 
            Review the recommendation, expand the reasoning, then Approve, Modify, Decline, or Snooze.
          </span>
        }
      />

      <EnforcementGateBanner gateKey="gate_kpi_architecture">
        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recommendation ? (
            <WeeklyLeverBrief recommendation={recommendation} />
          ) : (
            <SilenceState />
          )}
        </div>
      </EnforcementGateBanner>
    </div>
  );
}
