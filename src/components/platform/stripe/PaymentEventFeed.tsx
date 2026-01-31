import { formatDistanceToNow } from 'date-fns';
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StripePaymentsHealth } from '@/hooks/useStripePaymentsHealth';

interface PaymentEventFeedProps {
  events: StripePaymentsHealth['recentEvents'];
  isLoading: boolean;
}

const EVENT_CONFIG: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  bg: string;
  label: string;
}> = {
  payment_failed: { 
    icon: XCircle, 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/20',
    label: 'Payment failed'
  },
  payment_recovered: { 
    icon: CheckCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20',
    label: 'Payment recovered'
  },
  payment_succeeded: { 
    icon: CheckCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20',
    label: 'Payment succeeded'
  },
  connect_issue: { 
    icon: AlertCircle, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/20',
    label: 'Connect issue'
  },
};

export function PaymentEventFeed({ events, isLoading }: PaymentEventFeedProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40">
        <div className="p-4 border-b border-slate-700/50">
          <div className="h-5 w-48 bg-slate-700/50 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-slate-700/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50 mb-3">
          <CreditCard className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-white mb-1">No recent events</h3>
        <p className="text-xs text-slate-400">Payment events will appear here</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-white">Recent Payment Events</h3>
        </div>
        <span className="text-xs text-slate-500">Last 24h</span>
      </div>

      <div className="divide-y divide-slate-700/30 max-h-80 overflow-y-auto">
        {events.map(event => {
          const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.payment_failed;
          const Icon = config.icon;

          return (
            <div key={event.id} className="px-4 py-3 flex items-start gap-3">
              <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", config.bg)}>
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-xs font-medium", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-white truncate">
                  {event.organization_name}
                  {event.location_name && (
                    <span className="text-slate-400"> → {event.location_name}</span>
                  )}
                </p>
                
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {event.message}
                  {event.amount && (
                    <span className="ml-2 text-slate-300">
                      ${(event.amount / 100).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
