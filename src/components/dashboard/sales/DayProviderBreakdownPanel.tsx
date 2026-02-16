import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DRILLDOWN_DIALOG_CONTENT_CLASS, DRILLDOWN_OVERLAY_CLASS } from '@/components/dashboard/drilldownDialogStyles';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { parseISO, format } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';
import type { DayForecast, AppointmentSummary } from '@/hooks/useWeekAheadRevenue';

interface DayProviderBreakdownPanelProps {
  day: DayForecast | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StylistGroup {
  name: string;
  revenue: number;
  count: number;
  appointments: AppointmentSummary[];
}

export function DayProviderBreakdownPanel({ day, open, onOpenChange }: DayProviderBreakdownPanelProps) {
  const { formatCurrencyWhole } = useFormatCurrency();
  const { formatDate } = useFormatDate();
  const [expandedStylist, setExpandedStylist] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const groups = useMemo(() => {
    if (!day?.appointments?.length) return [];
    const map: Record<string, StylistGroup> = {};
    day.appointments.forEach(apt => {
      const name = apt.stylist_name || 'Unassigned';
      if (!map[name]) map[name] = { name, revenue: 0, count: 0, appointments: [] };
      map[name].revenue += Number(apt.total_price) || 0;
      map[name].count += 1;
      map[name].appointments.push(apt);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [day]);

  const maxRevenue = groups[0]?.revenue || 1;
  const visibleGroups = showAll ? groups : groups.slice(0, 5);
  const needsShowAll = groups.length > 5;
  const needsScroll = showAll && groups.length > 8;

  return (
    <Dialog open={open && !!day && groups.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className={DRILLDOWN_DIALOG_CONTENT_CLASS} overlayClassName={DRILLDOWN_OVERLAY_CLASS}>
        {day && (
          <>
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="text-base font-display">
                {formatDate(parseISO(day.date), 'EEEE, MMM d')}
              </DialogTitle>
              <DialogDescription className={tokens.body.muted}>
                {day.appointmentCount} appointment{day.appointmentCount !== 1 ? 's' : ''} · By Provider
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-5 pb-5 space-y-1">
                {visibleGroups.map(group => (
                  <div key={group.name}>
                    <button
                      className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedStylist(prev => prev === group.name ? null : group.name)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={cn(
                              'w-3.5 h-3.5 text-muted-foreground transition-transform',
                              expandedStylist === group.name && 'rotate-90'
                            )}
                          />
                          <span className="text-sm font-medium">{group.name}</span>
                          <span className={tokens.body.muted}>
                            {group.count} appointment{group.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-display tabular-nums">
                          {formatCurrencyWhole(group.revenue)}
                        </span>
                      </div>
                      {/* Revenue bar */}
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary/60"
                          initial={{ width: 0 }}
                          animate={{ width: `${(group.revenue / maxRevenue) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </button>

                    {/* Expanded appointments */}
                    <AnimatePresence>
                      {expandedStylist === group.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-6 border-l-2 border-primary/20 ml-4 mt-1 mb-2 space-y-1.5">
                            {group.appointments
                              .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                              .map(apt => (
                                <div key={apt.id} className="flex items-center justify-between py-1 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">
                                      {apt.start_time ? format(parseISO(apt.start_time), 'h:mm a') : '—'}
                                    </span>
                                    <span className="font-medium truncate">{apt.service_name || 'Service'}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {apt.client_name || 'Walk-in'}
                                    </span>
                                    <span className="font-display tabular-nums">
                                      {formatCurrencyWhole(Number(apt.total_price) || 0)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Show all toggle */}
                {needsShowAll && (
                  <button
                    onClick={() => setShowAll(prev => !prev)}
                    className="text-xs text-primary hover:underline"
                  >
                    {showAll ? 'Show less' : `Show all ${groups.length} providers`}
                  </button>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
