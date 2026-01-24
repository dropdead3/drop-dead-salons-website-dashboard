import { useMemo } from 'react';
import { LineChart, Line, Area, AreaChart, ResponsiveContainer } from 'recharts';

// Size presets for different use cases
const SIZE_PRESETS = {
  xs: { width: 48, height: 16 },
  sm: { width: 64, height: 20 },
  md: { width: 80, height: 24 },
  lg: { width: 120, height: 32 },
} as const;

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  variant?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showArea?: boolean;
  invertTrend?: boolean; // For metrics where down is good (e.g., bounce rate)
}

export function TrendSparkline({ 
  data, 
  width,
  height,
  className = '',
  variant = 'default',
  size = 'md',
  showArea = false,
  invertTrend = false,
}: TrendSparklineProps) {
  // Use size preset if no explicit dimensions provided
  const dimensions = useMemo(() => {
    if (width !== undefined && height !== undefined) {
      return { width, height };
    }
    return SIZE_PRESETS[size];
  }, [width, height, size]);

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

  // Color based on variant or trend direction
  const trendColor = useMemo(() => {
    switch (variant) {
      case 'muted':
        return 'hsl(var(--muted-foreground))';
      case 'primary':
        return 'hsl(var(--primary))';
      case 'success':
        return 'hsl(145 50% 45%)'; // Always green
      case 'warning':
        return 'hsl(38 92% 50%)'; // Always amber
      case 'danger':
        return 'hsl(0 60% 60%)'; // Always red
      default:
        // For default variant, use trend direction
        const trendIsGood = invertTrend ? !isUpward : isUpward;
        return trendIsGood 
          ? 'hsl(145 50% 45%)' // Light green
          : 'hsl(0 60% 60%)';   // Light red
    }
  }, [variant, isUpward, invertTrend]);

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
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <span className="text-xs">—</span>
      </div>
    );
  }

  // Area chart variant
  if (showArea) {
    return (
      <div className={className} style={{ width: dimensions.width, height: dimensions.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`gradient-${variant}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${variant})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: dimensions.width, height: dimensions.height }}>
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
