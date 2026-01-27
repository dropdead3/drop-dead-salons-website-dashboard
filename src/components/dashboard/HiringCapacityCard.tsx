import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Scissors, AlertTriangle, Settings, TrendingUp, Calendar } from 'lucide-react';
import { useHiringCapacity, LocationCapacity } from '@/hooks/useHiringCapacity';
import { useHiringForecast } from '@/hooks/useHiringForecast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

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

function getPriorityBadgeClass(level: 'critical' | 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-chart-4 text-black';
    case 'low':
      return 'bg-primary/10 text-primary';
  }
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
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{location.name}</span>
          {location.priorityScore > 0 && (
            <Badge className={cn("text-xs", getPriorityBadgeClass(location.priorityLevel))}>
              {location.priorityScore} Priority
            </Badge>
          )}
        </div>
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
  const navigate = useNavigate();
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

  const { data: forecast, isLoading: isForecastLoading } = useHiringForecast();

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

  const handleConfigure = () => {
    navigate('/dashboard/admin/settings', { 
      state: { navTimestamp: Date.now(), category: 'locations' } 
    });
  };

  return (
    <Card className={cn("premium-card", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Hiring Capacity
            <CommandCenterVisibilityToggle 
              elementKey="hiring_capacity" 
              elementName="Hiring Capacity" 
            />
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleConfigure}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
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
              <h4 className="text-sm font-medium text-muted-foreground mb-2">By Location (Sorted by Priority)</h4>
              {locations.map(location => (
                <LocationRow key={location.id} location={location} />
              ))}
            </div>

            {/* 90-Day Forecast Section */}
            {!isForecastLoading && forecast && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  90-Day Hiring Forecast
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded bg-amber-500/10">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3 text-amber-600" />
                      <span className="text-lg font-bold text-amber-600">{forecast.totalPlannedDepartures}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Planned Departures</div>
                  </div>
                  <div className="text-center p-2 rounded bg-blue-500/10">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">{forecast.totalGrowthBasedNeed}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Growth-Based Need</div>
                  </div>
                  <div className="text-center p-2 rounded bg-primary/10">
                    <span className="text-lg font-bold text-primary">{forecast.totalForecastedHires}</span>
                    <div className="text-xs text-muted-foreground">Total Forecast</div>
                  </div>
                </div>

                {forecast.averageGrowthRate !== 0 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Avg. appointment growth: {forecast.averageGrowthRate > 0 ? '+' : ''}{forecast.averageGrowthRate}%
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-chart-4 mb-3" />
            <h4 className="font-medium mb-1">No Capacity Configured</h4>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Set stylist capacity and assistant ratios in Location Settings to track hiring needs.
            </p>
            <Button variant="outline" onClick={handleConfigure}>
              Configure Capacity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
