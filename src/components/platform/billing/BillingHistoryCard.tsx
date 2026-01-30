import { History, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
} from '@/components/platform/ui/PlatformCard';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useBillingHistory, getChangeTypeLabel, getChangeTypeIcon } from '@/hooks/useBillingHistory';
import { formatCurrency } from '@/hooks/useBillingCalculations';
import { cn } from '@/lib/utils';

interface BillingHistoryCardProps {
  organizationId: string;
}

export function BillingHistoryCard({ organizationId }: BillingHistoryCardProps) {
  const { data: history, isLoading } = useBillingHistory(organizationId);

  if (isLoading) {
    return (
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-violet-400" />
            Billing History
          </PlatformCardTitle>
        </PlatformCardHeader>
        <PlatformCardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-slate-500">Loading history...</div>
          </div>
        </PlatformCardContent>
      </PlatformCard>
    );
  }

  if (!history || history.length === 0) {
    return (
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-violet-400" />
            Billing History
          </PlatformCardTitle>
        </PlatformCardHeader>
        <PlatformCardContent>
          <p className="text-sm text-slate-500 text-center py-6">
            No billing changes recorded yet
          </p>
        </PlatformCardContent>
      </PlatformCard>
    );
  }

  return (
    <PlatformCard variant="glass">
      <PlatformCardHeader>
        <PlatformCardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-violet-400" />
          Billing History
        </PlatformCardTitle>
      </PlatformCardHeader>
      <PlatformCardContent>
        <div className="space-y-3">
          {history.slice(0, 10).map((change) => (
            <Collapsible key={change.id}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getChangeTypeIcon(change.change_type)}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        {getChangeTypeLabel(change.change_type)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(change.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {change.proration_amount !== 0 && (
                      <span className={cn(
                        "text-sm font-medium",
                        change.proration_amount > 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {change.proration_amount > 0 ? '+' : ''}
                        {formatCurrency(change.proration_amount)}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform ui-open:rotate-180" />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-sm space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Effective Date:</span>
                    <span className="text-slate-300">
                      {format(new Date(change.effective_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {change.notes && (
                    <div>
                      <span className="text-slate-500 text-xs">Notes:</span>
                      <p className="text-slate-300 mt-1">{change.notes}</p>
                    </div>
                  )}
                  {change.previous_value && (
                    <div>
                      <span className="text-slate-500 text-xs">Previous:</span>
                      <pre className="text-slate-400 text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(change.previous_value, null, 2)}
                      </pre>
                    </div>
                  )}
                  {change.new_value && (
                    <div>
                      <span className="text-slate-500 text-xs">New:</span>
                      <pre className="text-slate-400 text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(change.new_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </PlatformCardContent>
    </PlatformCard>
  );
}
