import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Users, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Eye,
  CheckCircle2,
  CalendarCheck,
  DollarSign,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStylistExperienceScore, type StylistExperienceScore } from '@/hooks/useStylistExperienceScore';

interface StylistExperienceCardProps {
  locationId?: string;
  dateRange?: 'tomorrow' | '7days' | '30days' | '90days';
}

const STATUS_CONFIG = {
  'needs-attention': {
    label: 'Needs Attention',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: AlertTriangle,
  },
  'watch': {
    label: 'Watch',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: Eye,
  },
  'strong': {
    label: 'Strong',
    color: 'text-success-foreground',
    bgColor: 'bg-success',
    icon: CheckCircle2,
  },
};

const METRIC_INFO = {
  rebookRate: {
    label: 'Rebook',
    description: 'Percentage of completed appointments where the client booked their next visit at checkout',
    icon: CalendarCheck,
    threshold: 60,
    unit: '%',
  },
  tipRate: {
    label: 'Tips',
    description: 'Average tip percentage relative to service total. Industry benchmark is 15-20%',
    icon: DollarSign,
    threshold: 15,
    unit: '%',
  },
  retentionRate: {
    label: 'Retain',
    description: 'Percentage of clients who return within 90 days',
    icon: UserCheck,
    threshold: 50,
    unit: '%',
  },
  retailAttachment: {
    label: 'Retail',
    description: 'Retail product sales as percentage of total revenue',
    icon: ShoppingBag,
    threshold: 20,
    unit: '%',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function MetricCell({ 
  value, 
  threshold, 
  unit 
}: { 
  value: number; 
  threshold: number; 
  unit: string;
}) {
  const isBelowThreshold = value < threshold;
  return (
    <span className={cn(
      "font-medium tabular-nums",
      isBelowThreshold && "text-destructive"
    )}>
      {value}{unit}
    </span>
  );
}

function StylistRow({ score }: { score: StylistExperienceScore }) {
  const statusConfig = STATUS_CONFIG[score.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Status indicator */}
      <div className={cn(
        "p-1.5 rounded-full",
        statusConfig.bgColor
      )}>
        <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.color)} />
      </div>

      {/* Avatar and name */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={score.photoUrl || undefined} />
        <AvatarFallback className="text-xs bg-muted">
          {getInitials(score.staffName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{score.staffName}</p>
        <p className="text-xs text-muted-foreground">
          {score.appointmentCount} appointments
        </p>
      </div>

      {/* Score */}
      <div className="text-center w-12">
        <p className={cn(
          "text-lg font-bold tabular-nums",
          score.compositeScore < 50 && "text-destructive",
          score.compositeScore >= 50 && score.compositeScore < 70 && "text-warning",
          score.compositeScore >= 70 && "text-success-foreground"
        )}>
          {score.compositeScore}
        </p>
      </div>

      {/* Metrics */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4 text-sm text-right w-48">
        <MetricCell 
          value={score.metrics.rebookRate} 
          threshold={METRIC_INFO.rebookRate.threshold} 
          unit="%" 
        />
        <MetricCell 
          value={score.metrics.tipRate} 
          threshold={METRIC_INFO.tipRate.threshold} 
          unit="%" 
        />
        <MetricCell 
          value={score.metrics.retentionRate} 
          threshold={METRIC_INFO.retentionRate.threshold} 
          unit="%" 
        />
        <MetricCell 
          value={score.metrics.retailAttachment} 
          threshold={METRIC_INFO.retailAttachment.threshold} 
          unit="%" 
        />
      </div>
    </div>
  );
}

export function StylistExperienceCard({ locationId, dateRange = '30days' }: StylistExperienceCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: scores = [], isLoading } = useStylistExperienceScore(locationId, dateRange);

  // Count by status
  const statusCounts = scores.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Client Experience Scorecard</CardTitle>
              <CardDescription>
                Identifies stylists who may need coaching on customer connection
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-medium mb-1">How scores are calculated:</p>
                <ul className="text-xs space-y-1">
                  <li>• <strong>Rebook Rate (35%)</strong> - Client books next visit at checkout</li>
                  <li>• <strong>Tip Rate (30%)</strong> - Average tip as % of service total</li>
                  <li>• <strong>Retention (20%)</strong> - Client returns within 90 days</li>
                  <li>• <strong>Retail (15%)</strong> - Product sales % of total</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum 5 appointments required for scoring
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Status summary badges */}
        {!isLoading && scores.length > 0 && (
          <div className="flex gap-2 mt-3">
            {statusCounts['needs-attention'] > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {statusCounts['needs-attention']} Need Attention
              </Badge>
            )}
            {statusCounts['watch'] > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                <Eye className="h-3 w-3 mr-1" />
                {statusCounts['watch']} Watch
              </Badge>
            )}
            {statusCounts['strong'] > 0 && (
              <Badge variant="outline" className="bg-success text-success-foreground border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {statusCounts['strong']} Strong
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No stylists with enough data for scoring</p>
            <p className="text-xs mt-1">Minimum 5 completed appointments required</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center gap-3 py-2 px-2 border-b text-xs text-muted-foreground">
              <div className="w-7" /> {/* Status icon */}
              <div className="w-8" /> {/* Avatar */}
              <div className="flex-1">Stylist</div>
              <div className="w-12 text-center">Score</div>
              <div className="hidden sm:grid sm:grid-cols-4 gap-4 w-48 text-right">
                {Object.entries(METRIC_INFO).map(([key, info]) => (
                  <TooltipProvider key={key}>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        {info.label}
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="text-xs">{info.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Threshold: {info.threshold}%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Stylist rows */}
            <div className={cn(
              "divide-y transition-all",
              !expanded && "max-h-[200px] overflow-hidden"
            )}>
              {scores.map(score => (
                <StylistRow key={score.staffId} score={score} />
              ))}
            </div>

            {/* Expand/collapse */}
            {scores.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show All ({scores.length})
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
