import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LineChart } from 'lucide-react';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { formatCurrencyWhole as formatCurrencyWholeUtil } from '@/lib/formatCurrency';
import { format, parseISO } from 'date-fns';
import type { DailyOverlayPoint } from '@/hooks/useComparisonData';

interface DailyOverlayChartProps {
  data: DailyOverlayPoint[] | undefined;
  isLoading: boolean;
  periodALabel?: string;
  periodBLabel?: string;
}

export function DailyOverlayChart({
  data,
  isLoading,
  periodALabel = 'Period A',
  periodBLabel = 'Period B',
}: DailyOverlayChartProps) {
  const { formatCurrencyWhole } = useFormatCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[280px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length < 2) return null;

  const chartData = data.map((d, i) => ({
    idx: i,
    label: d.date ? format(parseISO(d.date), 'MMM d') : `Day ${i + 1}`,
    periodA: d.periodA,
    periodB: d.periodB,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
              <LineChart className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="font-display text-base tracking-wide">DAILY OVERLAY</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-[2.5px] rounded-full bg-primary" />
              <span>{periodALabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-[2.5px] rounded-full bg-muted-foreground/40" />
              <span>{periodBLabel}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dailyOverlayGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? formatCurrencyWholeUtil(v / 1000) + 'k' : formatCurrencyWholeUtil(v)}
                width={50}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg min-w-[160px]">
                      <p className="text-xs font-medium mb-2">{d.label}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-[2.5px] rounded-full bg-primary" />
                            <span className="text-[11px] text-muted-foreground">Current</span>
                          </div>
                          <span className="text-xs font-display tabular-nums">{formatCurrencyWhole(d.periodA)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-[2.5px] rounded-full bg-muted-foreground/50" />
                            <span className="text-[11px] text-muted-foreground">Prior</span>
                          </div>
                          <span className="text-xs font-display tabular-nums">{formatCurrencyWhole(d.periodB)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="periodB"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={0.08}
                animationDuration={300}
              />
              <Area
                type="monotone"
                dataKey="periodA"
                stroke="hsl(var(--primary))"
                fill="url(#dailyOverlayGradA)"
                strokeWidth={2}
                fillOpacity={1}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
