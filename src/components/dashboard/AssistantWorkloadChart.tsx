import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveAssistants } from '@/hooks/useAssistantAvailability';
import type { AssistantRequest } from '@/hooks/useAssistantRequests';
import { cn } from '@/lib/utils';

interface AssistantWorkloadChartProps {
  requests: AssistantRequest[];
}

export function AssistantWorkloadChart({ requests }: AssistantWorkloadChartProps) {
  const { data: assistants = [] } = useActiveAssistants();

  const workloadData = useMemo(() => {
    const data = assistants.map(assistant => {
      const assignedCount = requests.filter(r => r.assistant_id === assistant.user_id).length;
      return {
        user_id: assistant.user_id,
        name: assistant.display_name || assistant.full_name,
        photo_url: assistant.photo_url,
        assigned: assignedCount,
      };
    }).sort((a, b) => b.assigned - a.assigned);

    const maxAssigned = Math.max(...data.map(d => d.assigned), 1);
    
    return data.map(d => ({
      ...d,
      percentage: (d.assigned / maxAssigned) * 100,
    }));
  }, [assistants, requests]);

  const totalAssignments = workloadData.reduce((sum, d) => sum + d.assigned, 0);
  const avgPerAssistant = workloadData.length > 0 
    ? Math.round(totalAssignments / workloadData.length) 
    : 0;

  if (workloadData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Workload Distribution
            </CardTitle>
            <CardDescription>Assignment distribution across assistants</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <div className="text-xs text-muted-foreground">total • avg {avgPerAssistant}/person</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workloadData.map((item, index) => {
            const isOverloaded = item.assigned > avgPerAssistant * 1.5;
            const isUnderloaded = item.assigned < avgPerAssistant * 0.5 && avgPerAssistant > 0;
            
            return (
              <div key={item.user_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                  <span className={cn(
                    "font-mono",
                    isOverloaded && "text-amber-600",
                    isUnderloaded && "text-blue-600"
                  )}>
                    {item.assigned}
                  </span>
                </div>
                <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                      index === 0 && "bg-primary",
                      index === 1 && "bg-primary/80",
                      index === 2 && "bg-primary/60",
                      index > 2 && "bg-primary/40",
                      isOverloaded && "bg-amber-500",
                      isUnderloaded && "bg-blue-400"
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                  {isOverloaded && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-amber-700 dark:text-amber-300">
                      High workload
                    </span>
                  )}
                  {isUnderloaded && item.assigned === 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      No assignments
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>High workload (&gt;150% avg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span>Low workload (&lt;50% avg)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
