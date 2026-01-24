import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function TrendSparkline({ 
  data, 
  width = 80,
  height = 24,
  className = ''
}: TrendSparklineProps) {
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      index,
      value,
    }));
  }, [data]);

  // Determine trend direction for color
  const isUpward = useMemo(() => {
    if (data.length < 2) return true;
    const first = data[0];
    const last = data[data.length - 1];
    return last >= first;
  }, [data]);

  const strokeColor = isUpward 
    ? 'hsl(var(--chart-2))' 
    : 'hsl(var(--destructive))';
  
  const fillColor = isUpward
    ? 'hsl(var(--chart-2) / 0.3)'
    : 'hsl(var(--destructive) / 0.3)';

  if (!chartData.length || data.length < 2) {
    return (
      <div 
        className={`flex items-center justify-center text-muted-foreground ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs">—</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`gradient-${isUpward ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            fill={`url(#gradient-${isUpward ? 'up' : 'down'})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
