import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target, RefreshCw } from 'lucide-react';
import { WeeklyLeverBrief } from '@/components/executive-brief/WeeklyLeverBrief';
import { SilenceState } from '@/components/executive-brief/SilenceState';
import { EnforcementGateBanner } from '@/components/enforcement/EnforcementGateBanner';
import { useActiveRecommendation, useGenerateRecommendation } from '@/hooks/useLeverRecommendations';
import { cn } from '@/lib/utils';

export function WeeklyLeverSection() {
  const { data: recommendation, isLoading } = useActiveRecommendation();
  const generateMutation = useGenerateRecommendation();

  return (
    <Card className="rounded-2xl shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="font-display text-base font-medium tracking-wide uppercase">
              WEEKLY LEVER
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', generateMutation.isPending && 'animate-spin')} />
            {generateMutation.isPending ? 'Generating...' : 'Generate New'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <EnforcementGateBanner gateKey="gate_kpi_architecture">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recommendation ? (
            <WeeklyLeverBrief recommendation={recommendation} />
          ) : (
            <SilenceState />
          )}
        </EnforcementGateBanner>
      </CardContent>
    </Card>
  );
}
