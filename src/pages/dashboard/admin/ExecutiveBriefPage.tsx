import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformPageHeader } from '@/components/platform/ui/PlatformPageHeader';
import { WeeklyLeverBrief } from '@/components/executive-brief/WeeklyLeverBrief';
import { SilenceState } from '@/components/executive-brief/SilenceState';
import { useActiveRecommendation } from '@/hooks/useLeverRecommendations';
import { Loader2 } from 'lucide-react';
import { EnforcementGateBanner } from '@/components/enforcement/EnforcementGateBanner';

export default function ExecutiveBriefPage() {
  const { data: recommendation, isLoading } = useActiveRecommendation();

  return (
    <PlatformPageContainer maxWidth="narrow">
      <PlatformPageHeader
        title="Executive Brief"
        description="Your primary lever this period."
        backTo="/dashboard"
      />

      <EnforcementGateBanner gateKey="gate_kpi_architecture">
        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--platform-foreground-muted))]" />
            </div>
          ) : recommendation ? (
            <WeeklyLeverBrief recommendation={recommendation} />
          ) : (
            <SilenceState />
          )}
        </div>
      </EnforcementGateBanner>
    </PlatformPageContainer>
  );
}
