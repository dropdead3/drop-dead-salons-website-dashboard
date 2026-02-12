import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { motion } from 'framer-motion';
import type { LocationCardData } from './LocationComparisonCard';

interface LocationBarChartProps {
  locations: LocationCardData[];
  colors: string[];
  totalRevenue: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">
        <BlurredAmount>${d.totalRevenue.toLocaleString()}</BlurredAmount>
        <span className="ml-2">({Math.round(d.sharePercent)}%)</span>
      </p>
    </div>
  );
}

export function LocationBarChart({ locations, colors, totalRevenue }: LocationBarChartProps) {
  const data = useMemo(() =>
    [...locations].sort((a, b) => b.totalRevenue - a.totalRevenue),
    [locations]
  );

  const barHeight = 32;
  const chartHeight = Math.max(200, data.length * barHeight + 40);
  const needsScroll = data.length > 15;

  const chart = (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
        <Bar dataKey="totalRevenue" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {needsScroll ? (
        <ScrollArea className="max-h-[480px]">{chart}</ScrollArea>
      ) : (
        chart
      )}
    </motion.div>
  );
}
