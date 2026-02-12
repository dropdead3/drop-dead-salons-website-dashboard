import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Scissors, TrendingUp, DollarSign, ChevronDown, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useServicePopularity } from '@/hooks/useSalesAnalytics';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { motion, AnimatePresence } from 'framer-motion';

let barIdCounter = 0;

const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, stroke, strokeWidth, index } = props;
  const [animWidth, setAnimWidth] = useState(0);
  const [clipId] = useState(() => `bar-clip-${barIdCounter++}`);

  useEffect(() => {
    const delay = (index || 0) * 60;
    const t = setTimeout(() => setAnimWidth(width || 0), delay + 50);
    return () => clearTimeout(t);
  }, [width, index]);

  const w = animWidth;
  const h = height || 0;
  const r = Math.min(4, w / 2, h / 2);

  if (h <= 0) return null;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} style={{ transition: 'width 800ms cubic-bezier(0.25, 1, 0.5, 1)' }} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={Math.max(w, r * 2)}
        height={h}
        rx={0}
        ry={0}
        fill={fill}
        stroke={w > 0 ? stroke : 'none'}
        strokeWidth={strokeWidth}
        clipPath={`url(#${clipId})`}
        style={{ transition: 'width 800ms cubic-bezier(0.25, 1, 0.5, 1)' }}
      />
      {w > r && (
        <rect
          x={x + w - r * 2}
          y={y}
          width={r * 2}
          height={h}
          rx={r}
          ry={r}
          fill={fill}
          stroke={w > 0 ? stroke : 'none'}
          strokeWidth={strokeWidth}
          clipPath={`url(#${clipId})`}
          style={{ transition: 'all 800ms cubic-bezier(0.25, 1, 0.5, 1)' }}
        />
      )}
    </g>
  );
};

// Hook to fetch stylist breakdown for a specific service
function useServiceStylistBreakdown(serviceName: string | null, dateFrom?: string, dateTo?: string, locationId?: string) {
  return useQuery({
    queryKey: ['service-stylist-breakdown', serviceName, dateFrom, dateTo, locationId],
    queryFn: async () => {
      if (!serviceName) return [];
      
      let query = supabase
        .from('phorest_appointments')
        .select('phorest_staff_id, total_price')
        .eq('service_name', serviceName)
        .not('phorest_staff_id', 'is', null);

      if (dateFrom) query = query.gte('appointment_date', dateFrom);
      if (dateTo) query = query.lte('appointment_date', dateTo);
      if (locationId) query = query.eq('location_id', locationId);

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by staff
      const byStaff: Record<string, { count: number; revenue: number }> = {};
      data?.forEach(row => {
        const id = row.phorest_staff_id;
        if (!id) return;
        if (!byStaff[id]) byStaff[id] = { count: 0, revenue: 0 };
        byStaff[id].count += 1;
        byStaff[id].revenue += Number(row.total_price) || 0;
      });

      // Get staff names from mapping
      const staffIds = Object.keys(byStaff);
      if (staffIds.length === 0) return [];

      const { data: mappings } = await supabase
        .from('phorest_staff_mapping')
        .select('phorest_staff_id, phorest_staff_name')
        .in('phorest_staff_id', staffIds);

      const nameMap: Record<string, string> = {};
      mappings?.forEach(m => {
        if (m.phorest_staff_id && m.phorest_staff_name) {
          nameMap[m.phorest_staff_id] = m.phorest_staff_name;
        }
      });

      return Object.entries(byStaff)
        .map(([staffId, stats]) => ({
          name: nameMap[staffId] || 'Unknown Stylist',
          count: stats.count,
          revenue: stats.revenue,
          avgPrice: stats.count > 0 ? stats.revenue / stats.count : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!serviceName && !!dateFrom && !!dateTo,
  });
}

// Expandable stylist detail panel
function StylistBreakdownPanel({ serviceName, dateFrom, dateTo, locationId }: {
  serviceName: string;
  dateFrom: string;
  dateTo: string;
  locationId?: string;
}) {
  const { data: stylists, isLoading } = useServiceStylistBreakdown(serviceName, dateFrom, dateTo, locationId);
  const totalCount = stylists?.reduce((s, st) => s + st.count, 0) || 0;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="pt-3 pb-1 px-1 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : stylists && stylists.length > 0 ? (
          stylists.map((stylist, idx) => {
            const pct = totalCount > 0 ? ((stylist.count / totalCount) * 100).toFixed(0) : '0';
            return (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted/50 flex items-center justify-center rounded-full">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm">{stylist.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{stylist.count}× · {pct}%</span>
                  <Badge variant="secondary" className="text-xs">${stylist.revenue.toLocaleString()}</Badge>
                  <span className="text-xs text-muted-foreground">avg ${stylist.avgPrice.toFixed(0)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-3">No stylist data available</p>
        )}
      </div>
    </motion.div>
  );
}

interface ServicePopularityChartProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

export function ServicePopularityChart({ dateFrom, dateTo, locationId, filterContext }: ServicePopularityChartProps) {
  const { data, isLoading } = useServicePopularity(dateFrom, dateTo, locationId);
  const [sortBy, setSortBy] = useState<'frequency' | 'revenue'>('revenue');
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const sortedData = [...(data || [])].sort((a, b) => 
    sortBy === 'frequency' ? b.frequency - a.frequency : b.totalRevenue - a.totalRevenue
  ).slice(0, 10);

  const totalServices = data?.reduce((sum, s) => sum + s.frequency, 0) || 0;
  const totalRevenue = data?.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;

  // Build avgPrice lookup from data
  const avgPriceMap: Record<string, number> = {};
  data?.forEach(s => { avgPriceMap[s.name] = s.avgPrice; });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="font-display text-base tracking-wide">SERVICE POPULARITY</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filterContext && (
              <AnalyticsFilterBadge 
                locationId={filterContext.locationId} 
                dateRange={filterContext.dateRange} 
              />
            )}
            <Badge variant="outline">{totalServices} services</Badge>
            <Badge variant="secondary">${totalRevenue.toLocaleString()}</Badge>
          </div>
        </div>
        <CardDescription>Most requested services ranked by frequency and revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'frequency' | 'revenue')}>
          <TabsList className="mb-4">
            <TabsTrigger value="revenue" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              By Revenue
            </TabsTrigger>
            <TabsTrigger value="frequency" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              By Frequency
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frequency" className="mt-0">
            <div className="h-[400px]">
              {sortedData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No service data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedData} layout="vertical" barSize={28}>
                    <defs>
                      <linearGradient id="glassFrequency" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                        <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={200}
                      tick={{ fontSize: 13 }}
                      tickMargin={12}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.15)' }}
                      formatter={(value: number, name: string, props: any) => {
                        const pct = totalServices > 0 ? ((value / totalServices) * 100).toFixed(1) : '0';
                        return [`${value} bookings · ${pct}%`, props.payload?.name || 'Service'];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="frequency" fill="url(#glassFrequency)" radius={[0, 4, 4, 0]} stroke="hsl(var(--primary) / 0.3)" strokeWidth={1} shape={<AnimatedBar />} isAnimationActive={false}>
                      <LabelList
                        dataKey="frequency"
                        position="insideRight"
                        content={({ x, y, width, height, value, index }: any) => {
                          const barW = width || 0;
                          const barH = height || 0;
                          const padY = 3;
                          const padX = 4;
                          const badgeH = barH - padY * 2;
                          const label = `${value}`;
                          const badgeW = Math.max(label.length * 7 + 12, 36);
                          // Hide badge if it doesn't fit inside the bar
                          if (badgeW + padX * 2 > barW) return null;
                          const bx = (x || 0) + barW - badgeW - padX;
                          const by = (y || 0) + padY;
                          const delay = (index || 0) * 60 + 650;
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
                                style={{ fontSize: 11, fontWeight: 500, fill: 'hsl(var(--foreground))' }}
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
          </TabsContent>

          <TabsContent value="revenue" className="mt-0">
            <div className="h-[400px]">
              {sortedData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No service data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedData} layout="vertical" barSize={28}>
                    <defs>
                      <linearGradient id="glassRevenue" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.7} />
                        <stop offset="40%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={200}
                      tick={{ fontSize: 13 }}
                      tickMargin={12}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.15)' }}
                      formatter={(value: number, name: string, props: any) => {
                        const pct = totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : '0';
                        const svcName = props.payload?.name;
                        const avg = svcName ? avgPriceMap[svcName] : 0;
                        return [`$${value.toLocaleString()} · ${pct}% · avg $${(avg || 0).toFixed(0)}`, svcName || 'Revenue'];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="totalRevenue" fill="url(#glassRevenue)" radius={[0, 4, 4, 0]} stroke="hsl(var(--chart-2) / 0.3)" strokeWidth={1} shape={<AnimatedBar />} isAnimationActive={false}>
                      <LabelList
                        dataKey="totalRevenue"
                        position="insideRight"
                        content={({ x, y, width, height, value, index }: any) => {
                          const barW = width || 0;
                          const barH = height || 0;
                          const padY = 3;
                          const padX = 4;
                          const badgeH = barH - padY * 2;
                          const label = `$${Number(value).toLocaleString()}`;
                          const badgeW = Math.max(label.length * 6.5 + 14, 50);
                          // Hide badge if it doesn't fit inside the bar
                          if (badgeW + padX * 2 > barW) return null;
                          const bx = (x || 0) + barW - badgeW - padX;
                          const by = (y || 0) + padY;
                          const delay = (index || 0) * 60 + 650;
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
                                style={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--foreground))' }}
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
          </TabsContent>
        </Tabs>

        {/* Expandable service detail rows */}
        {sortedData.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-oat" />
              STYLIST BREAKDOWN
            </p>
            {sortedData.slice(0, 5).map((svc) => (
              <div key={svc.name}>
                <button
                  onClick={() => setExpandedService(expandedService === svc.name ? null : svc.name)}
                  className="w-full flex items-center justify-between p-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{svc.frequency}× · ${svc.totalRevenue.toLocaleString()} · avg ${svc.avgPrice.toFixed(0)}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedService === svc.name ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {expandedService === svc.name && (
                    <StylistBreakdownPanel
                      serviceName={svc.name}
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      locationId={locationId}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
