import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  variant?: 'default' | 'muted';
}

export function TrendSparkline({ 
  data, 
  width = 80,
  height = 24,
  className = '',
  variant = 'default'
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

  // Unique gradient ID for each instance
  const gradientId = useMemo(() => `trend-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Elegant neutral color matching reference design
  const strokeColor = variant === 'muted' 
    ? 'hsl(var(--muted-foreground))' 
    : 'hsl(var(--foreground) / 0.7)';
  
  // More visible gradient like the reference image
  const gradientStartOpacity = variant === 'muted' ? 0.2 : 0.35;
  const gradientEndOpacity = 0.02;

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
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={gradientStartOpacity} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={gradientEndOpacity} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            fill={`url(#${gradientId})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
