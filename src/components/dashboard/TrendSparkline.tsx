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

  // Stroke color for the line
  const strokeColor = variant === 'muted' 
    ? 'hsl(var(--muted-foreground))' 
    : 'hsl(var(--foreground) / 0.6)';
  
  // Dot color (solid foreground)
  const dotColor = variant === 'muted' 
    ? 'hsl(var(--muted-foreground))' 
    : 'hsl(var(--foreground))';

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
        fill={dotColor}
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
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={renderDot}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
