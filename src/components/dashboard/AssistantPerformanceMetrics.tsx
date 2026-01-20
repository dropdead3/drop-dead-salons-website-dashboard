import { useMemo } from 'react';
import { TrendingUp, Clock, CheckCircle2, XCircle, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useActiveAssistants } from '@/hooks/useAssistantAvailability';
import type { AssistantRequest } from '@/hooks/useAssistantRequests';
import { cn } from '@/lib/utils';

interface AssistantPerformanceMetricsProps {
  requests: AssistantRequest[];
}

interface AssistantMetrics {
  user_id: string;
  name: string;
  photo_url: string | null;
  totalAssigned: number;
  accepted: number;
  completed: number;
  declined: number;
  acceptanceRate: number;
  completionRate: number;
  avgResponseTimeSeconds: number | null;
  reliabilityScore: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(seconds / 86400)}d`;
}

export function AssistantPerformanceMetrics({ requests }: AssistantPerformanceMetricsProps) {
  const { data: assistants = [] } = useActiveAssistants();

  const metrics = useMemo<AssistantMetrics[]>(() => {
    return assistants.map(assistant => {
      // Requests assigned to this assistant
      const assignedRequests = requests.filter(r => r.assistant_id === assistant.user_id);
      const totalAssigned = assignedRequests.length;
      
      // Accepted (has accepted_at)
      const accepted = assignedRequests.filter(r => r.accepted_at).length;
      
      // Completed
      const completed = assignedRequests.filter(r => r.status === 'completed').length;
      
      // Declined by this assistant
      const declined = requests.filter(r => 
        r.declined_by?.includes(assistant.user_id)
      ).length;
      
      // Calculate rates
      const totalResponses = accepted + declined;
      const acceptanceRate = totalResponses > 0 ? Math.round((accepted / totalResponses) * 100) : 100;
      const completionRate = accepted > 0 ? Math.round((completed / accepted) * 100) : 0;
      
      // Average response time
      const responseTimes = assignedRequests
        .filter(r => r.response_time_seconds != null)
        .map(r => r.response_time_seconds as number);
      const avgResponseTimeSeconds = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;
      
      // Reliability score (weighted: 40% acceptance, 40% completion, 20% response time)
      const responseTimeScore = avgResponseTimeSeconds
        ? Math.max(0, 100 - (avgResponseTimeSeconds / 3600) * 10) // Lose 10 points per hour
        : 80;
      const reliabilityScore = Math.round(
        (acceptanceRate * 0.4) + 
        (completionRate * 0.4) + 
        (responseTimeScore * 0.2)
      );
      
      return {
        user_id: assistant.user_id,
        name: assistant.display_name || assistant.full_name,
        photo_url: assistant.photo_url,
        totalAssigned,
        accepted,
        completed,
        declined,
        acceptanceRate,
        completionRate,
        avgResponseTimeSeconds,
        reliabilityScore,
      };
    }).sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }, [assistants, requests]);

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>No assistants to show metrics for</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>Assistant reliability and response tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div 
              key={metric.user_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border",
                index === 0 && metric.totalAssigned > 0 && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={metric.photo_url || undefined} />
                  <AvatarFallback>{metric.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {index === 0 && metric.totalAssigned > 0 && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                    <Award className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium truncate">{metric.name}</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      metric.reliabilityScore >= 80 && "bg-green-100 text-green-800 border-green-200",
                      metric.reliabilityScore >= 50 && metric.reliabilityScore < 80 && "bg-amber-100 text-amber-800 border-amber-200",
                      metric.reliabilityScore < 50 && "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    {metric.reliabilityScore}% reliable
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Assigned:</span>
                    <span className="font-medium">{metric.totalAssigned}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-muted-foreground">Accept:</span>
                    <span className="font-medium">{metric.acceptanceRate}%</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-muted-foreground">Declined:</span>
                    <span className="font-medium">{metric.declined}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Avg Response:</span>
                    <span className="font-medium">{formatDuration(metric.avgResponseTimeSeconds)}</span>
                  </div>
                </div>
                
                {metric.totalAssigned > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Completion Rate</span>
                      <span>{metric.completionRate}%</span>
                    </div>
                    <Progress value={metric.completionRate} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
