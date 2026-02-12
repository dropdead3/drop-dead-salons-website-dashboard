import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { motion } from 'framer-motion';
import type { LocationCardData } from './LocationComparisonCard';

interface LocationTreemapProps {
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
        <BlurredAmount>${(d.totalRevenue ?? d.value ?? 0).toLocaleString()}</BlurredAmount>
        <span className="ml-2">({Math.round(d.sharePercent ?? 0)}%)</span>
      </p>
    </div>
  );
}

function CustomContent(props: any) {
  const { x, y, width, height, name, fill } = props;
  if (width < 4 || height < 4) return null;

  const showLabel = width > 60 && height > 28;
  const showRevenue = width > 80 && height > 44;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        className="transition-opacity hover:opacity-80"
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + (showRevenue ? height / 2 - 6 : height / 2 + 4)}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(12, width / 8)}
          fontWeight={600}
        >
          {name.length > width / 8 ? name.slice(0, Math.floor(width / 8)) + '…' : name}
        </text>
      )}
      {showRevenue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize={Math.min(10, width / 10)}
        >
          ${((props.totalRevenue ?? props.value ?? 0) / 1000).toFixed(0)}k
        </text>
      )}
    </g>
  );
}

export function LocationTreemap({ locations, colors, totalRevenue }: LocationTreemapProps) {
  const data = useMemo(() =>
    locations.map((loc, i) => ({
      name: loc.name,
      value: loc.totalRevenue,
      totalRevenue: loc.totalRevenue,
      sharePercent: loc.sharePercent,
      fill: colors[i % colors.length],
    })),
    [locations, colors]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <ResponsiveContainer width="100%" height={320}>
        <Treemap
          data={data}
          dataKey="value"
          nameKey="name"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </motion.div>
  );
}
