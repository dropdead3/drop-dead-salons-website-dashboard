import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useTipsDrilldown } from '@/hooks/useTipsDrilldown';
import { useActiveLocations } from '@/hooks/useLocations';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TipsDrilldownPanelProps {
  isOpen: boolean;
  parentLocationId?: string;
}

export function TipsDrilldownPanel({ isOpen, parentLocationId }: TipsDrilldownPanelProps) {
  const [period, setPeriod] = useState<30 | 90>(30);
  const [regionFilter, setRegionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState(parentLocationId || 'all');
  const [showAll, setShowAll] = useState(false);

  const { data: locations } = useActiveLocations();

  // Derive regions from locations
  const availableRegions = useMemo(() => {
    if (!locations) return [];
    const regions = new Set<string>();
    locations.forEach(loc => {
      const region = loc.state_province || loc.city?.split(',')[1]?.trim().split(' ')[0] || '';
      if (region) regions.add(region);
    });
    return Array.from(regions).sort();
  }, [locations]);

  // Build location→region map
  const locationRegionMap = useMemo(() => {
    const map: Record<string, string> = {};
    locations?.forEach(loc => {
      map[loc.id] = loc.state_province || loc.city?.split(',')[1]?.trim().split(' ')[0] || '';
    });
    return map;
  }, [locations]);

  // Filter locations by region
  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    if (regionFilter === 'all') return locations;
    return locations.filter(loc => locationRegionMap[loc.id] === regionFilter);
  }, [locations, regionFilter, locationRegionMap]);

  // Reset location when region changes
  const effectiveLocationId = useMemo(() => {
    if (locationFilter !== 'all' && regionFilter !== 'all') {
      const locRegion = locationRegionMap[locationFilter];
      if (locRegion !== regionFilter) return 'all';
    }
    return locationFilter;
  }, [locationFilter, regionFilter, locationRegionMap]);

  const { byStylist, byCategory, isLoading } = useTipsDrilldown({
    period,
    locationId: effectiveLocationId !== 'all' ? effectiveLocationId : undefined,
  });

  // Filter stylists by region if location not set
  const filteredStylists = useMemo(() => {
    if (regionFilter === 'all' || effectiveLocationId !== 'all') return byStylist;
    const regionLocationIds = new Set(
      filteredLocations.map(l => l.id)
    );
    return byStylist.filter(s => s.locationId && regionLocationIds.has(s.locationId));
  }, [byStylist, regionFilter, effectiveLocationId, filteredLocations]);

  const topEarners = showAll ? filteredStylists : filteredStylists.slice(0, 10);
  const coachingOpportunities = filteredStylists.slice(-5).reverse().filter(s => s.avgTip < (filteredStylists[0]?.avgTip ?? 0));

  // Category sorted by avg tip desc
  const sortedCategories = useMemo(() => {
    return Object.entries(byCategory)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.avgTip - a.avgTip);
  }, [byCategory]);

  const totalCategoryTips = sortedCategories.reduce((s, c) => s + c.totalTips, 0);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="pt-4 pb-2 space-y-4 border-t border-border/30 mt-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full bg-muted/50 p-0.5">
                <button
                  onClick={() => setPeriod(30)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    period === 30 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setPeriod(90)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    period === 90 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  90 Days
                </button>
              </div>

              {availableRegions.length > 1 && (
                <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); if (v !== regionFilter) setLocationFilter('all'); }}>
                  <SelectTrigger className="h-7 w-[130px] text-xs rounded-full">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {availableRegions.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filteredLocations.length > 1 && (
                <Select value={effectiveLocationId} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-7 w-[150px] text-xs rounded-full">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {filteredLocations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : filteredStylists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tip data recorded for this period</p>
                <p className="text-xs mt-1">Stylists need at least 10 appointments to appear</p>
              </div>
            ) : (
              <>
                {/* Top Tip Earners */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                      Top Tip Earners
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (avg per service)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {topEarners.map((stylist, index) => (
                      <StylistTipRow key={stylist.stylistUserId} stylist={stylist} index={index} />
                    ))}
                  </div>
                  {filteredStylists.length > 10 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground mt-1"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'Show top 10' : `Show all ${filteredStylists.length} stylists`}
                    </Button>
                  )}
                </div>

                {/* Coaching Opportunities */}
                {coachingOpportunities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                      <span className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                        Coaching Opportunities
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (lowest avg tips)
                      </span>
                    </div>
                    <div className="space-y-1">
                      {coachingOpportunities.map((stylist, index) => (
                        <StylistTipRow key={stylist.stylistUserId} stylist={stylist} index={index} isCoaching />
                      ))}
                    </div>
                  </div>
                )}

                {/* By Service Category */}
                {sortedCategories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                        Tips by Service Category
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {sortedCategories.map((cat, index) => {
                        const pct = totalCategoryTips > 0 ? (cat.totalTips / totalCategoryTips) * 100 : 0;
                        return (
                          <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
                          >
                            <span className="text-sm text-foreground font-medium min-w-[100px] truncate">
                              {cat.name}
                            </span>
                            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary/70 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, delay: index * 0.04, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums min-w-[60px] text-right">
                              <BlurredAmount>${cat.avgTip.toFixed(2)} avg</BlurredAmount>
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums min-w-[55px] text-right">
                              {cat.tipRate.toFixed(0)}% rate
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StylistTipRow({ stylist, index, isCoaching = false }: { stylist: import('@/hooks/useTipsDrilldown').StylistTipMetrics; index: number; isCoaching?: boolean }) {
  const initials = stylist.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
    >
      <Avatar className="w-7 h-7">
        <AvatarImage src={stylist.photoUrl ?? undefined} />
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm text-foreground font-medium min-w-[90px] truncate">
        {stylist.displayName}
      </span>
      <span className="text-sm font-display tabular-nums min-w-[55px] text-right">
        <BlurredAmount>${stylist.avgTip.toFixed(2)}</BlurredAmount>
      </span>
      <span className="text-xs text-muted-foreground tabular-nums min-w-[40px] text-right">
        {stylist.tipPercentage.toFixed(0)}%
      </span>
      <span className={cn(
        "text-xs tabular-nums min-w-[45px] text-right",
        stylist.noTipRate > 30 ? "text-destructive" : "text-muted-foreground"
      )}>
        {stylist.noTipRate.toFixed(0)}% NT
      </span>
      <span className="text-xs text-muted-foreground tabular-nums min-w-[55px] text-right">
        <BlurredAmount>${Math.round(stylist.totalTips).toLocaleString()}</BlurredAmount>
      </span>
    </motion.div>
  );
}
