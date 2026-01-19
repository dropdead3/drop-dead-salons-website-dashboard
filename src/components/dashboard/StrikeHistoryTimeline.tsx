import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStaffStrikes, STRIKE_TYPE_LABELS, SEVERITY_COLORS, STRIKE_TYPE_COLORS } from '@/hooks/useStaffStrikes';

interface StrikeHistoryTimelineProps {
  userId: string;
}

export function StrikeHistoryTimeline({ userId }: StrikeHistoryTimelineProps) {
  const { data: strikes = [], isLoading } = useStaffStrikes(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Strike History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="w-4 h-4 animate-spin mr-2" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const unresolvedCount = strikes.filter(s => !s.is_resolved).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Strike History
            </CardTitle>
            <CardDescription>
              {strikes.length === 0 
                ? 'No strikes on record'
                : `${strikes.length} total strike${strikes.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unresolvedCount} Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {strikes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500/50" />
            <p className="text-sm">Clean record — no strikes found.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
            
            <div className="space-y-4">
              {strikes.map((strike, index) => {
                const isLast = index === strikes.length - 1;
                const severityColor = SEVERITY_COLORS[strike.severity as keyof typeof SEVERITY_COLORS] || 'bg-muted';
                const typeColor = STRIKE_TYPE_COLORS[strike.strike_type as keyof typeof STRIKE_TYPE_COLORS] || 'text-muted-foreground';
                
                return (
                  <div key={strike.id} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      strike.is_resolved
                        ? "bg-muted border-muted-foreground/30"
                        : "bg-destructive/10 border-destructive"
                    )}>
                      {strike.is_resolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "rounded-lg border p-3 transition-all",
                      strike.is_resolved ? "bg-muted/30" : "bg-destructive/5 border-destructive/30"
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium text-sm",
                            strike.is_resolved && "text-muted-foreground"
                          )}>
                            {strike.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="outline" className={cn("text-xs", typeColor)}>
                              {STRIKE_TYPE_LABELS[strike.strike_type as keyof typeof STRIKE_TYPE_LABELS] || strike.strike_type}
                            </Badge>
                            <Badge className={cn("text-xs", severityColor)}>
                              {strike.severity}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(strike.incident_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {strike.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {strike.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>Added by {strike.created_by_name}</span>
                      </div>
                      
                      {strike.is_resolved && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              Resolved on {format(new Date(strike.resolved_at!), 'MMM d, yyyy')}
                              {strike.resolved_by_name && ` by ${strike.resolved_by_name}`}
                            </span>
                          </div>
                          {strike.resolution_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{strike.resolution_notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
