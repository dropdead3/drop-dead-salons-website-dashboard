import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Scissors, TrendingUp, DollarSign } from 'lucide-react';
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
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, stroke, strokeWidth, index } = props;
  const [animWidth, setAnimWidth] = useState(0);

  useEffect(() => {
    const delay = (index || 0) * 60;
    const t = setTimeout(() => setAnimWidth(width || 0), delay + 50);
    return () => clearTimeout(t);
  }, [width, index]);

  const w = animWidth;
  const h = height || 0;
  const r = Math.min(4, w / 2, h / 2);

  if (w <= 0 || h <= 0) return null;

  // Path with flat left side, rounded right side
  const d = `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;

  return (
    <path
      d={d}
      fill={fill}
      stroke={w > 0 ? stroke : 'none'}
      strokeWidth={strokeWidth}
      style={{ transition: 'd 800ms cubic-bezier(0.25, 1, 0.5, 1)' }}
    />
  );
};

interface ServicePopularityChartProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

export function ServicePopularityChart({ dateFrom, dateTo, locationId, filterContext }: ServicePopularityChartProps) {
  const { data, isLoading } = useServicePopularity(dateFrom, dateTo, locationId);
  const [sortBy, setSortBy] = useState<'frequency' | 'revenue'>('revenue');

  const sortedData = [...(data || [])].sort((a, b) => 
    sortBy === 'frequency' ? b.frequency - a.frequency : b.totalRevenue - a.totalRevenue
  ).slice(0, 10);

  const totalServices = data?.reduce((sum, s) => sum + s.frequency, 0) || 0;
  const totalRevenue = data?.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;

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
                      formatter={(value: number, name: string) => [
                        name === 'frequency' ? `${value} times` : `$${value.toLocaleString()}`,
                        name === 'frequency' ? 'Bookings' : 'Revenue'
                      ]}
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
                          const barH = height || 0;
                          const padY = 3;
                          const padX = 4;
                          const badgeH = barH - padY * 2;
                          const pct = totalServices > 0 ? ((value / totalServices) * 100).toFixed(0) : '0';
                          const label = `${value} · ${pct}%`;
                          const badgeW = Math.max(label.length * 7 + 12, 50);
                          const bx = (x || 0) + (width || 0) - badgeW - padX;
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
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
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
                          const barH = height || 0;
                          const padY = 3;
                          const padX = 4;
                          const badgeH = barH - padY * 2;
                          const pct = totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(0) : '0';
                          const label = `$${Number(value).toLocaleString()} · ${pct}%`;
                          const badgeW = Math.max(label.length * 7 + 12, 50);
                          const bx = (x || 0) + (width || 0) - badgeW - padX;
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
