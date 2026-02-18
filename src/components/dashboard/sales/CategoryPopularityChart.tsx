import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers, DollarSign, TrendingUp, ChevronDown, User, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, FilterTabsList, FilterTabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell,
} from 'recharts';
import { useRevenueByCategoryDrilldown } from '@/hooks/useRevenueByCategoryDrilldown';
import { useState, useEffect, useMemo } from 'react';
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useServiceCategoryColorsMap } from '@/hooks/useServiceCategoryColors';
import { getCategoryColor, getGradientFromMarker, isGradientMarker } from '@/utils/categoryColors';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { formatCurrencyWhole as formatCurrencyWholeUtil } from '@/lib/formatCurrency';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { ScrollArea } from '@/components/ui/scroll-area';

let catBarIdCounter = 0;

const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, stroke, strokeWidth, index } = props;
  const [animWidth, setAnimWidth] = useState(0);
  const [clipId] = useState(() => `cat-bar-clip-${catBarIdCounter++}`);

  useEffect(() => {
    const delay = (index || 0) * 80;
    const t = setTimeout(() => setAnimWidth(width || 0), delay + 50);
    return () => clearTimeout(t);
  }, [width, index]);

  const w = width || 0;
  const h = height || 0;
  const r = Math.min(4, w / 2, h / 2);

  if (h <= 0) return null;

  const clipPath = w > 0
    ? `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`
    : `M${x},${y} H${x} V${y + h} H${x} Z`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={clipPath} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={animWidth}
        height={h}
        fill={fill}
        stroke={animWidth > 0 ? stroke : 'none'}
        strokeWidth={strokeWidth}
        clipPath={`url(#${clipId})`}
        style={{ transition: 'width 800ms cubic-bezier(0.25, 1, 0.5, 1)' }}
      />
    </g>
  );
};

function resolveCategoryHex(colorMap: Record<string, { bg: string; text: string; abbr: string }>, category: string | null): string {
  if (!category) return '#6b7280';
  const info = getCategoryColor(category, colorMap);
  if (isGradientMarker(info.bg)) {
    const grad = getGradientFromMarker(info.bg);
    if (grad) {
      const match = grad.background.match(/#[0-9a-fA-F]{6}/);
      return match ? match[0] : '#6b7280';
    }
    return '#6b7280';
  }
  return info.bg;
}

interface CategoryPopularityChartProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

export function CategoryPopularityChart({ dateFrom, dateTo, locationId, filterContext }: CategoryPopularityChartProps) {
  const { data, isLoading } = useRevenueByCategoryDrilldown({ dateFrom, dateTo, locationId });
  const { formatCurrencyWhole } = useFormatCurrency();
  const [sortBy, setSortBy] = useState<'revenue' | 'frequency'>('revenue');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { colorMap } = useServiceCategoryColorsMap();

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) =>
      sortBy === 'revenue' ? b.revenue - a.revenue : b.count - a.count
    );
  }, [data, sortBy]);

  const totalRevenue = data?.reduce((s, c) => s + c.revenue, 0) || 0;
  const totalCount = data?.reduce((s, c) => s + c.count, 0) || 0;
  const categoryCount = data?.length || 0;

  const categoryColors = useMemo(() => {
    return sortedData.map(c => resolveCategoryHex(colorMap, c.category));
  }, [sortedData, colorMap]);

  const gradientDefs = useMemo(() => {
    const unique = [...new Set(categoryColors)];
    return unique.map(hex => ({
      id: `cat-glass-${hex.replace('#', '')}`,
      hex,
    }));
  }, [categoryColors]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderBarChart = (dataKey: 'revenue' | 'count', isRevenue: boolean) => {
    const total = isRevenue ? totalRevenue : totalCount;
    return (
      <div className="h-[320px]">
        {sortedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No category data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" barSize={32}>
              <defs>
                {gradientDefs.map(({ id, hex }) => (
                  <linearGradient key={id} id={id} x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor={hex} stopOpacity={0.75} />
                    <stop offset="40%" stopColor={hex} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={hex} stopOpacity={0.35} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis type="number" tickFormatter={isRevenue ? (v) => formatCurrencyWholeUtil(v) : undefined} />
              <YAxis
                type="category"
                dataKey="category"
                width={160}
                tick={{ fontSize: 13 }}
                tickMargin={12}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.15)' }}
                formatter={(value: number, _name: string, props: any) => {
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                  if (isRevenue) {
                    return [`${formatCurrencyWholeUtil(value)} · ${pct}%`, props.payload?.category || 'Revenue'];
                  }
                  return [`${value} bookings · ${pct}%`, props.payload?.category || 'Category'];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey={dataKey}
                radius={[0, 4, 4, 0]}
                shape={<AnimatedBar />}
                isAnimationActive={false}
              >
                {sortedData.map((_, i) => {
                  const hex = categoryColors[i];
                  const gradId = `cat-glass-${hex.replace('#', '')}`;
                  return (
                    <Cell
                      key={i}
                      fill={`url(#${gradId})`}
                      stroke={`${hex}50`}
                      strokeWidth={1}
                    />
                  );
                })}
                <LabelList
                  dataKey={dataKey}
                  position="insideRight"
                  content={({ x, y, width, height, value, index }: any) => {
                    const barW = width || 0;
                    const barH = height || 0;
                    const padY = 3;
                    const padX = 4;
                    const badgeH = barH - padY * 2;
                    const label = isRevenue ? formatCurrencyWholeUtil(Number(value)) : `${value}`;
                    const badgeW = Math.max(label.length * (isRevenue ? 6.5 : 7) + (isRevenue ? 14 : 12), isRevenue ? 50 : 36);
                    if (badgeW + padX * 2 > barW) return null;
                    const bx = (x || 0) + barW - badgeW - padX;
                    const by = (y || 0) + padY;
                    const delay = (index || 0) * 80 + 650;
                    return (
                      <g opacity={0} style={{ animation: `svgFadeIn 350ms ease-out ${delay}ms forwards` }}>
                        <rect
                          x={bx}
                          y={by}
                          width={badgeW}
                          height={badgeH}
                          rx={3}
                          fill="hsl(var(--background) / 0.8)"
                        />
                        <text
                          x={bx + badgeW / 2}
                          y={by + badgeH / 2 + 4}
                          textAnchor="middle"
                          style={{ fontSize: isRevenue ? 10 : 11, fontWeight: 500, fill: 'hsl(var(--foreground))' }}
                        >
                          {label}
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <CardTitle className="font-display text-base tracking-wide">CATEGORY POPULARITY</CardTitle>
              <MetricInfoTooltip description="Ranks service categories by revenue or booking count. Click any category to drill into stylist breakdown, client mix, and concentration risk." />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filterContext && (
              <AnalyticsFilterBadge
                locationId={filterContext.locationId}
                dateRange={filterContext.dateRange}
              />
            )}
            <Badge variant="outline">{categoryCount} categories</Badge>
            <Badge variant="secondary"><BlurredAmount>{formatCurrencyWhole(totalRevenue)}</BlurredAmount></Badge>
          </div>
        </div>
        <CardDescription>Service categories ranked by dominance — click to drill down</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'revenue' | 'frequency')}>
          <FilterTabsList className="mb-4">
            <FilterTabsTrigger value="revenue" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              By Revenue
            </FilterTabsTrigger>
            <FilterTabsTrigger value="frequency" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              By Frequency
            </FilterTabsTrigger>
          </FilterTabsList>

          <TabsContent value="revenue" className="mt-0">
            {renderBarChart('revenue', true)}
          </TabsContent>

          <TabsContent value="frequency" className="mt-0">
            {renderBarChart('count', false)}
          </TabsContent>
        </Tabs>

        {/* Category drill-down rows */}
        {sortedData.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
              CATEGORY DRILL-DOWN
            </p>
            {sortedData.map((cat, i) => {
              const isExpanded = expandedCategory === cat.category;
              const topStylist = cat.stylists[0];
              const concentrationRisk = topStylist && cat.stylists.length > 1 && topStylist.sharePercent > 70;
              const totalNewClients = cat.stylists.reduce((s, st) => s + st.newClients, 0);
              const totalReturningClients = cat.stylists.reduce((s, st) => s + st.returningClients, 0);
              const totalClients = totalNewClients + totalReturningClients;
              const newPct = totalClients > 0 ? Math.round((totalNewClients / totalClients) * 100) : 0;

              return (
                <div key={cat.category}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                    className="w-full flex items-center justify-between p-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: categoryColors[i] || '#6b7280' }}
                      />
                      <span className="text-sm font-medium">{cat.category}</span>
                      {concentrationRisk && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {cat.count}× · <BlurredAmount>{formatCurrencyWhole(cat.revenue)}</BlurredAmount> · {cat.sharePercent}%
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 pb-1 pl-6 space-y-3">
                          {/* Client mix + concentration risk */}
                          <div className="flex gap-4 text-xs flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> New clients: <strong>{newPct}%</strong> ({totalNewClients})
                            </span>
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> Returning: <strong>{100 - newPct}%</strong> ({totalReturningClients})
                            </span>
                            {concentrationRisk && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                Concentration risk: {topStylist.staffName} = {topStylist.sharePercent}% of revenue
                              </span>
                            )}
                          </div>

                          {/* Stylist breakdown */}
                          <div>
                            <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">STYLIST BREAKDOWN</p>
                            {cat.stylists.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">No stylist data</p>
                            ) : (
                              <div className="space-y-0">
                                {cat.stylists.slice(0, 5).map((stylist, idx) => (
                                  <div
                                    key={stylist.phorestStaffId}
                                    className="flex items-center justify-between py-2 px-3 border-l-2 border-primary/20"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-primary/10 flex items-center justify-center rounded-full">
                                        <User className="w-3 h-3 text-primary/50" />
                                      </div>
                                      <span className="text-sm text-muted-foreground">{stylist.staffName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground/70 text-xs">
                                        {stylist.count}× · {stylist.sharePercent}%
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        <BlurredAmount>{formatCurrencyWhole(stylist.revenue)}</BlurredAmount>
                                      </Badge>
                                      <span className="text-xs text-muted-foreground/60">
                                        {stylist.newClients} new · {stylist.returningClients} ret
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {cat.stylists.length > 5 && (
                                  <p className="text-xs text-muted-foreground pl-3 py-1.5">
                                    +{cat.stylists.length - 5} more stylists
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
