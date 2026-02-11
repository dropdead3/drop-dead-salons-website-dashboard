import { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Scissors, ShoppingBag } from 'lucide-react';
import type { StaffServiceProduct } from '@/hooks/useServiceProductDrilldown';

interface ServiceProductDrilldownProps {
  mode: 'services' | 'products' | null;
  onClose: () => void;
  staffData: StaffServiceProduct[];
  totalServiceRevenue: number;
  totalProductRevenue: number;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getRatioColor(ratio: number) {
  if (ratio >= 15) return 'text-emerald-600';
  if (ratio >= 8) return 'text-amber-600';
  return 'text-red-500';
}

function getRatioBarColor(ratio: number) {
  if (ratio >= 15) return 'bg-emerald-500';
  if (ratio >= 8) return 'bg-amber-500';
  return 'bg-red-500';
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function ServiceProductDrilldown({
  mode,
  onClose,
  staffData,
  totalServiceRevenue,
  totalProductRevenue,
}: ServiceProductDrilldownProps) {
  const isServices = mode === 'services';

  const sorted = useMemo(() => {
    if (!staffData?.length) return [];
    const total = isServices ? totalServiceRevenue : totalProductRevenue;
    return staffData
      .map(s => ({
        ...s,
        primaryRevenue: isServices ? s.serviceRevenue : s.productRevenue,
        primaryCount: isServices ? s.serviceCount : s.productCount,
        sharePercent: total > 0
          ? Math.round(((isServices ? s.serviceRevenue : s.productRevenue) / total) * 100)
          : 0,
      }))
      .filter(s => s.primaryRevenue > 0 || s.primaryCount > 0)
      .sort((a, b) => b.primaryRevenue - a.primaryRevenue);
  }, [staffData, isServices, totalServiceRevenue, totalProductRevenue]);

  return (
    <Dialog open={!!mode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden gap-0"
        overlayClassName="backdrop-blur-sm bg-black/60"
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isServices ? 'bg-primary/10' : 'bg-primary/10'
            }`}>
              {isServices ? (
                <Scissors className="w-5 h-5 text-primary" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="font-display text-base font-medium tracking-wide">
                {isServices ? 'Services by Stylist' : 'Products by Stylist'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue &amp; retail-to-service ratio</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-muted-foreground">
                No {isServices ? 'service' : 'product'} data in this period
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((staff) => (
                <div
                  key={staff.phorestStaffId}
                  className="p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(staff.staffName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{staff.staffName}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(staff.primaryRevenue)} · {staff.primaryCount} {isServices ? 'service' : 'item'}{staff.primaryCount !== 1 ? 's' : ''} · {staff.sharePercent}%
                      </p>
                    </div>
                    <span className="font-display text-lg tabular-nums">{fmt(staff.primaryRevenue)}</span>
                  </div>

                  {/* Retail : Service ratio */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] tracking-wide text-muted-foreground uppercase">Retail : Service</span>
                    <span className={`text-xs font-medium tabular-nums ${getRatioColor(staff.retailToServiceRatio)}`}>
                      {staff.retailToServiceRatio}%
                    </span>
                  </div>

                  <Progress
                    value={staff.sharePercent}
                    className="h-1.5"
                    indicatorClassName={getRatioBarColor(staff.retailToServiceRatio)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/50 bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center tracking-wide">
            Stylist Performance Breakdown
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
