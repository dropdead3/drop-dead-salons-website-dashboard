import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

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

  // Determine trend direction
  const isUpward = useMemo(() => {
    if (data.length < 2) return true;
    const first = data[0];
    const last = data[data.length - 1];
    return last >= first;
  }, [data]);

  // Color based on trend direction - light green for up, light red for down
  const trendColor = useMemo(() => {
    if (variant === 'muted') {
      return 'hsl(var(--muted-foreground))';
    }
    return isUpward 
      ? 'hsl(145 50% 45%)' // Light green
      : 'hsl(0 60% 60%)';   // Light red
  }, [variant, isUpward]);

  // Custom dot renderer - only show at first and last points
  const renderDot = (props: any) => {
    const { cx, cy, index } = props;
    const isEndpoint = index === 0 || index === chartData.length - 1;
    
    if (!isEndpoint) return null;
    
    return (
      <circle 
        key={`dot-${index}`}
        cx={cx} 
        cy={cy} 
        r={3} 
        fill={trendColor}
        stroke="none"
      />
    );
  };

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
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={1.5}
            dot={renderDot}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
