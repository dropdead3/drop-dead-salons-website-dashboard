import { useMemo, useState, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { motion } from 'framer-motion';
import type { LocationCardData } from './LocationComparisonCard';

interface LocationDonutChartProps {
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

// Active slice renderer — expands outward on hover
function ActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, stroke, strokeWidth,
    midAngle, name, sharePercent,
  } = props;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);

  // Expand outward by 6px
  const expandR = outerRadius + 6;

  // Inline label positioning
  const labelR = (innerRadius + outerRadius) / 2;
  const lx = cx + labelR * cos;
  const ly = cy + labelR * sin;
  const angleDiff = Math.abs(endAngle - startAngle);
  const showLabel = angleDiff > 25;

  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={expandR}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {showLabel && (
        <>
          <text
            x={lx} y={ly - 5}
            textAnchor="middle"
            fill="#fff"
            fontSize={11}
            fontWeight={500}
          >
            {name.length > 12 ? name.slice(0, 11) + '…' : name}
          </text>
          <text
            x={lx} y={ly + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.75)"
            fontSize={10}
          >
            {Math.round(sharePercent)}%
          </text>
        </>
      )}
    </g>
  );
}

// Inactive slice with optional inline label
function InactiveSliceLabel(props: any) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, stroke, strokeWidth,
    midAngle, name, sharePercent,
  } = props;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const labelR = (innerRadius + outerRadius) / 2;
  const lx = cx + labelR * cos;
  const ly = cy + labelR * sin;
  const angleDiff = Math.abs(endAngle - startAngle);
  const showLabel = angleDiff > 30;

  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {showLabel && (
        <text
          x={lx} y={ly + 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize={10}
        >
          {Math.round(sharePercent)}%
        </text>
      )}
    </g>
  );
}

export function LocationDonutChart({ locations, colors, totalRevenue }: LocationDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const gradientDefs = useMemo(() => {
    const unique = [...new Set(colors.slice(0, locations.length))];
    return unique.map(hex => ({ id: `donut-glass-${hex.replace('#', '')}`, hex }));
  }, [colors, locations.length]);

  const onEnter = useCallback((_: any, index: number) => setActiveIndex(index), []);
  const onLeave = useCallback(() => setActiveIndex(null), []);

  // Center label: show hovered location or total
  const centerData = activeIndex !== null && data[activeIndex]
    ? { label: data[activeIndex].name, value: data[activeIndex].totalRevenue, sub: `${Math.round(data[activeIndex].sharePercent)}% of total` }
    : { label: `${locations.length} Locations`, value: totalRevenue, sub: 'Total Revenue' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="flex-shrink-0" style={{ width: 240, height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {gradientDefs.map(({ id, hex }) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={hex} stopOpacity={0.9} />
                    <stop offset="50%" stopColor={hex} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={hex} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={0}
                stroke="hsl(var(--border) / 0.4)"
                strokeWidth={1}
                label={false}
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={<ActiveShape />}
                inactiveShape={<InactiveSliceLabel />}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                {data.map((_, i) => {
                  const hex = colors[i % colors.length];
                  const gradId = `donut-glass-${hex.replace('#', '')}`;
                  return <Cell key={i} fill={`url(#${gradId})`} />;
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />

              {/* Center label */}
              <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" fontSize={9} className="uppercase tracking-wider">
                {centerData.sub}
              </text>
              <text x="50%" y="54%" textAnchor="middle" dominantBaseline="central" fill="hsl(var(--foreground))" fontSize={15} fontWeight={500} className="font-display">
                <BlurredAmount>${centerData.value >= 1000 ? `${(centerData.value / 1000).toFixed(1)}k` : centerData.value.toLocaleString()}</BlurredAmount>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Side legend with metrics */}
        <div className="flex-1 min-w-0 space-y-2">
          {data.map((loc, i) => {
            const isActive = activeIndex === i;
            return (
              <div
                key={loc.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-default ${isActive ? 'bg-muted/30' : 'hover:bg-muted/15'}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-sm font-medium truncate flex-1">{loc.name}</span>
                <span className="text-sm tabular-nums font-display">
                  <BlurredAmount>${loc.totalRevenue.toLocaleString()}</BlurredAmount>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                  {Math.round(loc.sharePercent)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
