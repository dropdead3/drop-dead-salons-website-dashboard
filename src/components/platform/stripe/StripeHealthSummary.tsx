import { Building2, MapPin, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StripePaymentsHealth } from '@/hooks/useStripePaymentsHealth';

interface StripeHealthSummaryProps {
  data: StripePaymentsHealth | undefined;
  isLoading: boolean;
}

export function StripeHealthSummary({ data, isLoading }: StripeHealthSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-xl border border-slate-700/50 bg-slate-800/40 animate-pulse" />
        <div className="h-40 rounded-xl border border-slate-700/50 bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  const subs = data?.subscriptions || { active: 0, pastDue: 0, trialing: 0, cancelled: 0, total: 0 };
  const locs = data?.locations || { active: 0, pending: 0, issues: 0, suspended: 0, notConnected: 0, total: 0 };

  const hasSubIssues = subs.pastDue > 0 || subs.cancelled > 0;
  const hasLocIssues = locs.issues > 0 || locs.suspended > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Platform Subscriptions Card */}
      <div className={cn(
        "rounded-xl border p-5",
        hasSubIssues 
          ? "border-amber-500/30 bg-amber-500/5" 
          : "border-slate-700/50 bg-slate-800/40"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-2 rounded-lg",
            hasSubIssues ? "bg-amber-500/20" : "bg-violet-500/20"
          )}>
            <Building2 className={cn(
              "h-5 w-5",
              hasSubIssues ? "text-amber-400" : "text-violet-400"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Platform Subscriptions</h3>
            <p className="text-xs text-slate-400">{subs.total} total organizations</p>
          </div>
        </div>

        <div className="space-y-2">
          <StatusRow 
            icon={CheckCircle} 
            label="Active" 
            count={subs.active} 
            variant="success" 
          />
          <StatusRow 
            icon={AlertTriangle} 
            label="Past due" 
            count={subs.pastDue} 
            variant={subs.pastDue > 0 ? "warning" : "muted"} 
          />
          <StatusRow 
            icon={Clock} 
            label="Trialing" 
            count={subs.trialing} 
            variant="info" 
          />
          <StatusRow 
            icon={XCircle} 
            label="Cancelled" 
            count={subs.cancelled} 
            variant={subs.cancelled > 0 ? "danger" : "muted"} 
          />
        </div>
      </div>

      {/* Location Payments Card */}
      <div className={cn(
        "rounded-xl border p-5",
        hasLocIssues 
          ? "border-amber-500/30 bg-amber-500/5" 
          : "border-slate-700/50 bg-slate-800/40"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-2 rounded-lg",
            hasLocIssues ? "bg-amber-500/20" : "bg-violet-500/20"
          )}>
            <MapPin className={cn(
              "h-5 w-5",
              hasLocIssues ? "text-amber-400" : "text-violet-400"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Location Payments</h3>
            <p className="text-xs text-slate-400">{locs.total} total locations</p>
          </div>
        </div>

        <div className="space-y-2">
          <StatusRow 
            icon={CheckCircle} 
            label="Active" 
            count={locs.active} 
            variant="success" 
          />
          <StatusRow 
            icon={AlertTriangle} 
            label="Issues" 
            count={locs.issues} 
            variant={locs.issues > 0 ? "warning" : "muted"} 
          />
          <StatusRow 
            icon={Clock} 
            label="Pending" 
            count={locs.pending} 
            variant="info" 
          />
          <StatusRow 
            icon={XCircle} 
            label="Suspended" 
            count={locs.suspended} 
            variant={locs.suspended > 0 ? "danger" : "muted"} 
          />
          <StatusRow 
            icon={Clock} 
            label="Not connected" 
            count={locs.notConnected} 
            variant="muted" 
          />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ 
  icon: Icon, 
  label, 
  count, 
  variant 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}) {
  const colors = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    info: 'text-blue-400',
    muted: 'text-slate-500',
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", colors[variant])} />
        <span className="text-slate-300">{label}</span>
      </div>
      <span className={cn("font-medium", colors[variant])}>{count}</span>
    </div>
  );
}
