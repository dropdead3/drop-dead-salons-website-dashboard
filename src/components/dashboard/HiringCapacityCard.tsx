import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Scissors, AlertTriangle } from 'lucide-react';
import { useHiringCapacity, LocationCapacity } from '@/hooks/useHiringCapacity';
import { cn } from '@/lib/utils';

interface HiringCapacityCardProps {
  className?: string;
}

function getCapacityColor(current: number, target: number): string {
  if (target === 0) return 'bg-muted';
  const percentage = (current / target) * 100;
  if (percentage >= 100) return 'bg-primary';
  if (percentage >= 75) return 'bg-chart-4'; // amber equivalent
  return 'bg-destructive';
}

function getCapacityTextColor(current: number, target: number): string {
  if (target === 0) return 'text-muted-foreground';
  const percentage = (current / target) * 100;
  if (percentage >= 100) return 'text-primary';
  if (percentage >= 75) return 'text-chart-4';
  return 'text-destructive';
}

function LocationRow({ location }: { location: LocationCapacity }) {
  const hasCapacityConfig = location.stylistCapacity !== null;
  
  if (!hasCapacityConfig) {
    return (
      <div className="py-3 border-b border-border/50 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{location.name}</span>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Not Configured
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Set capacity targets in Location Settings
        </p>
      </div>
    );
  }

  const stylistPercentage = location.stylistCapacity 
    ? Math.min(100, (location.currentStylists / location.stylistCapacity) * 100) 
    : 0;
  const assistantPercentage = location.targetAssistants > 0
    ? Math.min(100, (location.currentAssistants / location.targetAssistants) * 100)
    : 100;

  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm">{location.name}</span>
        {location.totalNeeded > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {location.totalNeeded} needed
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
            Fully Staffed
          </Badge>
        )}
      </div>

      {/* Stylists Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Scissors className="h-3 w-3" />
            Stylists
          </span>
          <span className={cn("font-medium", getCapacityTextColor(location.currentStylists, location.stylistCapacity || 0))}>
            {location.currentStylists} / {location.stylistCapacity}
            {location.stylistsNeeded > 0 && (
              <span className="text-destructive ml-1">({location.stylistsNeeded} needed)</span>
            )}
          </span>
        </div>
        <Progress 
          value={stylistPercentage} 
          className="h-2"
          indicatorClassName={getCapacityColor(location.currentStylists, location.stylistCapacity || 0)}
        />
      </div>

      {/* Assistants Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            Assistants
          </span>
          <span className={cn("font-medium", getCapacityTextColor(location.currentAssistants, location.targetAssistants))}>
            {location.currentAssistants} / {location.targetAssistants}
            {location.assistantsNeeded > 0 && (
              <span className="text-destructive ml-1">({location.assistantsNeeded} needed)</span>
            )}
          </span>
        </div>
        <Progress 
          value={assistantPercentage} 
          className="h-2"
          indicatorClassName={getCapacityColor(location.currentAssistants, location.targetAssistants)}
        />
      </div>
    </div>
  );
}

export function HiringCapacityCard({ className }: HiringCapacityCardProps) {
  const {
    locations,
    totalStylistsNeeded,
    totalAssistantsNeeded,
    totalHiresNeeded,
    totalCurrentStylists,
    totalStylistCapacity,
    totalCurrentAssistants,
    totalTargetAssistants,
    isLoading,
  } = useHiringCapacity();

  if (isLoading) {
    return (
      <Card className={cn("premium-card", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyCapacity = locations.some(loc => loc.stylistCapacity !== null);

  return (
    <Card className={cn("premium-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Hiring Capacity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {hasAnyCapacity ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-destructive">
                  {totalStylistsNeeded}
                </div>
                <div className="text-xs text-muted-foreground">Stylists Needed</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalCurrentStylists} / {totalStylistCapacity}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-destructive">
                  {totalAssistantsNeeded}
                </div>
                <div className="text-xs text-muted-foreground">Assistants Needed</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalCurrentAssistants} / {totalTargetAssistants}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <div className={cn(
                  "text-2xl font-bold",
                  totalHiresNeeded > 0 ? "text-destructive" : "text-primary"
                )}>
                  {totalHiresNeeded}
                </div>
                <div className="text-xs text-muted-foreground">Total Hires</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalHiresNeeded === 0 ? "Fully staffed!" : "To reach capacity"}
                </div>
              </div>
            </div>

            {/* Location Breakdown */}
            <div className="space-y-0">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">By Location</h4>
              {locations.map(location => (
                <LocationRow key={location.id} location={location} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-chart-4 mb-3" />
            <h4 className="font-medium mb-1">No Capacity Configured</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Set stylist capacity and assistant ratios in Location Settings to track hiring needs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
